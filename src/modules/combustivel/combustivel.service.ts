import { Injectable, NotFoundException } from '@nestjs/common';
import { AnpBase, Prisma, TipoCombustivelAnp, UF } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CombustivelAlreadyExistsException,
  CombustivelDuplicateSiglaException,
  CombustivelNotFoundException,
} from '../../common/exceptions/combustivel/combustivel.exceptions';

@Injectable()
export class CombustivelService {
  constructor(private prisma: PrismaService) {}

  async create(data: { nome: string; sigla: string; descricao?: string; observacoes?: string }) {
    const existingCombustivel = await this.prisma.combustivel.findFirst({
      where: { sigla: data.sigla },
    });

    if (existingCombustivel) {
      throw new CombustivelAlreadyExistsException(data.nome, data.sigla, {
        payload: data,
        additionalInfo: {
          prismaWhere: { sigla: data.sigla },
        },
      });
    }

    const combustivel = await this.prisma.combustivel.create({
      data,
    });

    return {
      message: 'Combustível criado com sucesso',
      combustivel,
    };
  }

  async findAll(page = 1, limit = 10, ativo?: boolean) {
    const skip = (page - 1) * limit;
    const where = ativo !== undefined ? { ativo } : {};

    const [combustiveis, total] = await Promise.all([
      this.prisma.combustivel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.combustivel.count({ where }),
    ]);

    return {
      message: 'Combustíveis encontrados com sucesso',
      combustiveis,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            veiculos: true,
            abastecimentos: true,
            contratos: true,
          },
        },
      },
    });

    if (!combustivel) {
      throw new CombustivelNotFoundException(id, 'detail', {
        resourceId: id,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    return {
      message: 'Combustível encontrado com sucesso',
      combustivel,
    };
  }

  async update(id: number, data: { nome?: string; sigla?: string; descricao?: string; observacoes?: string; ativo?: boolean }) {
    const existingCombustivel = await this.prisma.combustivel.findUnique({
      where: { id },
    });

    if (!existingCombustivel) {
      throw new CombustivelNotFoundException(id, 'update', {
        resourceId: id,
        payload: data,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    if (data.sigla) {
      const conflictingCombustivel = await this.prisma.combustivel.findFirst({
        where: { sigla: data.sigla, id: { not: id } },
      });

      if (conflictingCombustivel) {
        throw new CombustivelDuplicateSiglaException(data.sigla, {
          resourceId: id,
          payload: data,
          additionalInfo: {
            prismaWhere: {
              sigla: data.sigla,
              idNot: id,
            },
          },
        });
      }
    }

    const combustivel = await this.prisma.combustivel.update({
      where: { id },
      data,
    });

    return {
      message: 'Combustível atualizado com sucesso',
      combustivel,
    };
  }

  async remove(id: number) {
    const existingCombustivel = await this.prisma.combustivel.findUnique({
      where: { id },
    });

    if (!existingCombustivel) {
      throw new CombustivelNotFoundException(id, 'delete', {
        resourceId: id,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    await this.prisma.combustivel.delete({
      where: { id },
    });

    return {
      message: 'Combustível excluído com sucesso',
    };
  }

  async obterDadosAnpDoUsuario(user: {
    id: number;
    tipo_usuario: string;
    empresa?: { id: number; nome: string; cnpj: string; uf?: UF | null };
  }) {
    if (!user?.empresa?.id || !user.empresa.uf) {
      throw new NotFoundException('Usuário não possui empresa com UF associada');
    }

    const anpSemanaAtiva = await this.prisma.anpSemana.findFirst({
      where: { ativo: true },
      orderBy: { semana_ref: 'desc' },
    });

    if (!anpSemanaAtiva) {
      throw new NotFoundException('Nenhuma semana ANP ativa encontrada');
    }

    const precosUf = await this.prisma.anpPrecosUf.findMany({
      where: {
        anp_semana_id: anpSemanaAtiva.id,
        uf: user.empresa.uf,
      },
      orderBy: { combustivel: 'asc' },
    });

    // Buscar todos os nomes de combustíveis únicos
    const nomesCombustiveis = precosUf.map((preco) => 
      this.mapearTipoCombustivelAnpParaNome(preco.combustivel)
    );

    // Buscar todos os combustíveis de uma vez
    const combustiveis = await this.prisma.combustivel.findMany({
      where: {
        nome: { in: nomesCombustiveis },
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    // Criar um mapa de nome -> id para busca rápida
    const mapaCombustiveis = new Map(
      combustiveis.map((c) => [c.nome, c.id])
    );

    const dados = precosUf.map((preco) => {
      const precoBase = this.obterPrecoBaseParaAnp(preco);
      const nomeCombustivel = this.mapearTipoCombustivelAnpParaNome(preco.combustivel);
      
      return {
        combustivel: nomeCombustivel,
        combustivel_id: mapaCombustiveis.get(nomeCombustivel) ?? null,
        tipo_combustivel: preco.combustivel,
        teto_vigente: preco.teto_calculado,
        base_utilizada: preco.base_utilizada,
        preco_base: precoBase,
        preco_minimo: preco.preco_minimo,
        preco_medio: preco.preco_medio,
        preco_maximo: preco.preco_maximo,
        margem_aplicada: preco.margem_aplicada,
      };
    });

    return {
      message: 'Dados ANP recuperados com sucesso',
      uf: user.empresa.uf,
      semana: {
        id: anpSemanaAtiva.id,
        semana_ref: anpSemanaAtiva.semana_ref,
        publicada_em: anpSemanaAtiva.publicada_em,
      },
      dados,
    };
  }

  private obterPrecoBaseParaAnp(
    anpPreco: {
      base_utilizada: AnpBase | null;
      preco_minimo: Decimal | null;
      preco_medio: Decimal;
      preco_maximo: Decimal | null;
    },
  ): Decimal | null {
    switch (anpPreco.base_utilizada) {
      case AnpBase.MINIMO:
        return anpPreco.preco_minimo ?? null;
      case AnpBase.MEDIO:
        return anpPreco.preco_medio ?? null;
      case AnpBase.MAXIMO:
        return anpPreco.preco_maximo ?? null;
      default:
        return null;
    }
  }

  private mapearTipoCombustivelAnpParaNome(tipo: TipoCombustivelAnp): string {
    const mapa: Record<TipoCombustivelAnp, string> = {
      [TipoCombustivelAnp.GASOLINA_COMUM]: 'Gasolina Comum',
      [TipoCombustivelAnp.GASOLINA_ADITIVADA]: 'Gasolina Aditivada',
      [TipoCombustivelAnp.ETANOL_COMUM]: 'Etanol Comum',
      [TipoCombustivelAnp.ETANOL_ADITIVADO]: 'Etanol Aditivado',
      [TipoCombustivelAnp.DIESEL_S10]: 'Diesel S10',
      [TipoCombustivelAnp.DIESEL_S500]: 'Diesel S500',
      [TipoCombustivelAnp.GNV]: 'GNV',
      [TipoCombustivelAnp.GLP]: 'GLP',
    };

    return mapa[tipo] ?? tipo;
  }
}
