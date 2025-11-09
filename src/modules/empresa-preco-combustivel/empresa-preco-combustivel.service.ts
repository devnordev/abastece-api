import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaPrecoCombustivelDto } from './dto/create-empresa-preco-combustivel.dto';
import { UpdateEmpresaPrecoCombustivelDto } from './dto/update-empresa-preco-combustivel.dto';
import { FindEmpresaPrecoCombustivelDto } from './dto/find-empresa-preco-combustivel.dto';
import { UpdatePrecoAtualDto } from './dto/update-preco-atual.dto';
import { Prisma, TipoCombustivelAnp, AnpBase, StatusPreco } from '@prisma/client';
import {
  EmpresaPrecoCombustivelAcessoNegadoException,
  EmpresaPrecoCombustivelCombustivelNaoEncontradoException,
  EmpresaPrecoCombustivelEmpresaNaoEncontradaException,
  EmpresaPrecoCombustivelMargemAnpAusenteException,
  EmpresaPrecoCombustivelNaoEncontradoException,
  EmpresaPrecoCombustivelPrecoAbaixoDoMinimoException,
  EmpresaPrecoCombustivelPrecoAcimaDoTetoException,
  EmpresaPrecoCombustivelPrecoAnpNaoEncontradoException,
  EmpresaPrecoCombustivelPrecoAnpSemBaseUtilizadaException,
  EmpresaPrecoCombustivelPrecoAnpSemPrecoMinimoException,
  EmpresaPrecoCombustivelPrecoAnpSemTetoCalculadoException,
  EmpresaPrecoCombustivelPrecoJaAtivoException,
  EmpresaPrecoCombustivelPrecoNegativoException,
  EmpresaPrecoCombustivelStatusInvalidoException,
  EmpresaPrecoCombustivelTipoCombustivelNaoMapeadoException,
  EmpresaPrecoCombustivelValorBaseAusenteException,
  EmpresaPrecoCombustivelSemanaAnpNaoEncontradaException,
  EmpresaPrecoCombustivelBaseAnpNaoSuportadaException,
} from '../../common/exceptions';

@Injectable()
export class EmpresaPrecoCombustivelService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEmpresaPrecoCombustivelDto, empresaId: number) {
    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new EmpresaPrecoCombustivelEmpresaNaoEncontradaException(empresaId);
    }

    // Verificar se o combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: data.combustivel_id },
    });

    if (!combustivel) {
      throw new EmpresaPrecoCombustivelCombustivelNaoEncontradoException(data.combustivel_id);
    }

    // Verificar se já existe um preço ativo para esta empresa e combustível
    const existingPreco = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: data.combustivel_id,
        status: 'ACTIVE',
      },
    });

    if (existingPreco) {
      throw new EmpresaPrecoCombustivelPrecoJaAtivoException(empresaId, data.combustivel_id);
    }

    const dadosAnp = await this.buscarTetoVigenteAnp(empresaId, data.combustivel_id);

    this.validarPrecoDentroDaFaixa(data.preco_atual, dadosAnp.anpPreco);

    if (!dadosAnp.anpPreco.margem_aplicada) {
      throw new EmpresaPrecoCombustivelMargemAnpAusenteException();
    }

    const anpBaseValor = this.obterValorBaseAnp(dadosAnp.anpPreco);
    const precoDecimal = new Prisma.Decimal(data.preco_atual);
    const statusInformado = data.status;
    if (statusInformado && !(Object.values(StatusPreco) as StatusPreco[]).includes(statusInformado)) {
      throw new EmpresaPrecoCombustivelStatusInvalidoException(statusInformado);
    }
    const status: StatusPreco = statusInformado ?? StatusPreco.ACTIVE;

    const preco = await this.prisma.empresaPrecoCombustivel.create({
      data: {
        empresa_id: empresaId,
        combustivel_id: data.combustivel_id,
        preco_atual: new Prisma.Decimal(data.preco_atual),
        teto_vigente: dadosAnp.teto_vigente,
        anp_base: dadosAnp.anpPreco.base_utilizada,
        anp_base_valor: anpBaseValor,
        margem_app_pct: dadosAnp.anpPreco.margem_aplicada,
        uf_referencia: empresa.uf,
        status,
        updated_at: new Date(),
        updated_by: data.updated_by,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    return {
      message: 'Preço de combustível criado com sucesso',
      preco,
    };
  }

  async findAll(filters: FindEmpresaPrecoCombustivelDto, empresaId: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EmpresaPrecoCombustivelWhereInput = {
      empresa_id: empresaId, // Sempre filtrar pela empresa do usuário
    };

    if (filters.combustivel_id) {
      where.combustivel_id = filters.combustivel_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.uf_referencia) {
      where.uf_referencia = filters.uf_referencia;
    }

    const [precos, total] = await Promise.all([
      this.prisma.empresaPrecoCombustivel.findMany({
        where,
        skip,
        take: limit,
        include: {
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      this.prisma.empresaPrecoCombustivel.count({ where }),
    ]);

    return {
      message: 'Preços de combustível encontrados com sucesso',
      precos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, empresaId: number) {
    const preco = await this.prisma.empresaPrecoCombustivel.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    if (!preco) {
      throw new EmpresaPrecoCombustivelNaoEncontradoException(id);
    }

    // Verificar se o preço pertence à empresa do usuário
    if (preco.empresa_id !== empresaId) {
      throw new EmpresaPrecoCombustivelAcessoNegadoException(id, empresaId);
    }

    return {
      message: 'Preço de combustível encontrado com sucesso',
      preco,
    };
  }

  async update(id: number, data: UpdateEmpresaPrecoCombustivelDto, empresaId: number) {
    const existingPreco = await this.prisma.empresaPrecoCombustivel.findUnique({
      where: { id },
    });

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        uf: true,
      },
    });

    if (!empresa) {
      throw new EmpresaPrecoCombustivelEmpresaNaoEncontradaException(empresaId, 'update');
    }

    if (!existingPreco) {
      throw new EmpresaPrecoCombustivelNaoEncontradoException(id);
    }

    // Verificar se o preço pertence à empresa do usuário
    if (existingPreco.empresa_id !== empresaId) {
      throw new EmpresaPrecoCombustivelAcessoNegadoException(id, empresaId);
    }

    // Determinar qual combustível será usado (novo ou existente)
    const combustivelIdFinal = data.combustivel_id || existingPreco.combustivel_id;

    // Se estiver alterando combustível, verificar se já existe preço ativo para o novo combustível
    if (data.combustivel_id && data.combustivel_id !== existingPreco.combustivel_id) {
      const combustivel = await this.prisma.combustivel.findUnique({
        where: { id: data.combustivel_id },
      });

      if (!combustivel) {
        throw new EmpresaPrecoCombustivelCombustivelNaoEncontradoException(data.combustivel_id, 'update');
      }

      const existingPrecoNovoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
        where: {
          empresa_id: empresaId,
          combustivel_id: data.combustivel_id,
          status: 'ACTIVE',
          id: { not: id },
        },
      });

      if (existingPrecoNovoCombustivel) {
        throw new EmpresaPrecoCombustivelPrecoJaAtivoException(empresaId, data.combustivel_id);
      }
    }

    // Buscar teto vigente da ANP se necessário
    // É necessário buscar se:
    // 1. O preço atual está sendo alterado
    // 2. O combustível está sendo alterado
    // 3. O teto_vigente está sendo alterado
    const dadosAnp = await this.buscarTetoVigenteAnp(empresaId, combustivelIdFinal, undefined, 'update');
    const precoParaValidacao =
      data.preco_atual !== undefined ? data.preco_atual : existingPreco.preco_atual;

    this.validarPrecoDentroDaFaixa(precoParaValidacao, dadosAnp.anpPreco);

    if (!dadosAnp.anpPreco.margem_aplicada) {
      throw new EmpresaPrecoCombustivelMargemAnpAusenteException();
    }

    const anpBaseValor = this.obterValorBaseAnp(dadosAnp.anpPreco);

    const updateData: Prisma.EmpresaPrecoCombustivelUpdateInput = {
      updated_at: new Date(),
      teto_vigente: dadosAnp.teto_vigente,
      anp_base: dadosAnp.anpPreco.base_utilizada,
      anp_base_valor: anpBaseValor,
      margem_app_pct: dadosAnp.anpPreco.margem_aplicada,
      uf_referencia: empresa.uf,
    };

    if (data.preco_atual !== undefined) {
      updateData.preco_atual = new Prisma.Decimal(data.preco_atual);
    }

    if (data.status !== undefined) {
      if (!(Object.values(StatusPreco) as StatusPreco[]).includes(data.status)) {
        throw new EmpresaPrecoCombustivelStatusInvalidoException(data.status);
      }
      updateData.status = data.status;
    }

    if (data.updated_by !== undefined) {
      updateData.updated_by = data.updated_by;
    }
    if (data.combustivel_id !== undefined) {
      updateData.combustivel = { connect: { id: data.combustivel_id } };
    }

    const preco = await this.prisma.empresaPrecoCombustivel.update({
      where: { id },
      data: updateData,
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    return {
      message: 'Preço de combustível atualizado com sucesso',
      preco,
    };
  }

  async remove(id: number, empresaId: number) {
    const existingPreco = await this.prisma.empresaPrecoCombustivel.findUnique({
      where: { id },
    });

    if (!existingPreco) {
      throw new EmpresaPrecoCombustivelNaoEncontradoException(id);
    }

    // Verificar se o preço pertence à empresa do usuário
    if (existingPreco.empresa_id !== empresaId) {
      throw new EmpresaPrecoCombustivelAcessoNegadoException(id, empresaId);
    }

    await this.prisma.empresaPrecoCombustivel.delete({
      where: { id },
    });

    return {
      message: 'Preço de combustível excluído com sucesso',
    };
  }

  /**
   * Busca o teto vigente da ANP para uma empresa, combustível e semana ANP específica
   */
  private async buscarTetoVigenteAnp(
    empresaId: number,
    combustivelId: number,
    anpSemanaId?: number,
    operation: 'create' | 'update' | 'updatePreco' = 'create',
  ): Promise<{ teto_vigente: Prisma.Decimal; anpPreco: any }> {
    // Buscar empresa para pegar a UF
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, uf: true },
    });

    if (!empresa) {
      throw new EmpresaPrecoCombustivelEmpresaNaoEncontradaException(empresaId, operation);
    }

    // Buscar combustível
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new EmpresaPrecoCombustivelCombustivelNaoEncontradoException(combustivelId, operation);
    }

    // Mapear combustível para TipoCombustivelAnp
    const tipoCombustivelAnp = this.mapearCombustivelParaTipoAnp(combustivel.nome, combustivel.sigla);

    if (!tipoCombustivelAnp) {
      throw new EmpresaPrecoCombustivelTipoCombustivelNaoMapeadoException(combustivel.nome, combustivel.sigla);
    }

    // Buscar semana ANP (ativa ou específica)
    let anpSemana;
    if (anpSemanaId) {
      anpSemana = await this.prisma.anpSemana.findUnique({
        where: { id: anpSemanaId },
      });
    } else {
      anpSemana = await this.prisma.anpSemana.findFirst({
        where: { ativo: true },
        orderBy: { semana_ref: 'desc' },
      });
    }

    if (!anpSemana) {
      throw new EmpresaPrecoCombustivelSemanaAnpNaoEncontradaException(anpSemanaId);
    }

    // Buscar preço ANP para a UF e tipo de combustível
    const anpPreco = await this.prisma.anpPrecosUf.findFirst({
      where: {
        anp_semana_id: anpSemana.id,
        uf: empresa.uf,
        combustivel: tipoCombustivelAnp,
      },
    });

    if (!anpPreco) {
      throw new EmpresaPrecoCombustivelPrecoAnpNaoEncontradoException(empresa.uf, tipoCombustivelAnp);
    }

    if (!anpPreco.teto_calculado) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemTetoCalculadoException();
    }

    if (!anpPreco.preco_minimo) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemPrecoMinimoException();
    }

    if (!anpPreco.base_utilizada) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemBaseUtilizadaException();
    }

    return {
      teto_vigente: anpPreco.teto_calculado,
      anpPreco,
    };
  }

  private validarPrecoDentroDaFaixa(
    precoAtual: number | Prisma.Decimal,
    anpPreco: {
      teto_calculado: Prisma.Decimal;
      preco_minimo: Prisma.Decimal;
    },
  ): void {
    const precoDecimal = typeof precoAtual === 'number' ? new Prisma.Decimal(precoAtual) : precoAtual;
    const precoNumber = Number(precoDecimal.toString());

    if (precoDecimal.lt(0)) {
      throw new EmpresaPrecoCombustivelPrecoNegativoException(precoNumber);
    }

    const tetoDecimal = anpPreco.teto_calculado;
    const tetoNumber = Number(tetoDecimal.toString());
    if (precoDecimal.gt(tetoDecimal)) {
      throw new EmpresaPrecoCombustivelPrecoAcimaDoTetoException(precoNumber, tetoNumber);
    }

    const minimoDecimal = anpPreco.preco_minimo;
    const minimoNumber = Number(minimoDecimal.toString());
    if (precoDecimal.lt(minimoDecimal)) {
      throw new EmpresaPrecoCombustivelPrecoAbaixoDoMinimoException(precoNumber, minimoNumber);
    }
  }

  private obterValorBaseAnp(anpPreco: {
    base_utilizada: AnpBase;
    preco_minimo: Prisma.Decimal | null;
    preco_medio: Prisma.Decimal;
    preco_maximo: Prisma.Decimal | null;
  }): Prisma.Decimal {
    switch (anpPreco.base_utilizada) {
      case AnpBase.MINIMO:
        if (!anpPreco.preco_minimo) {
          throw new EmpresaPrecoCombustivelValorBaseAusenteException(AnpBase.MINIMO);
        }
        return anpPreco.preco_minimo;
      case AnpBase.MEDIO:
        if (!anpPreco.preco_medio) {
          throw new EmpresaPrecoCombustivelValorBaseAusenteException(AnpBase.MEDIO);
        }
        return anpPreco.preco_medio;
      case AnpBase.MAXIMO:
        if (!anpPreco.preco_maximo) {
          throw new EmpresaPrecoCombustivelValorBaseAusenteException(AnpBase.MAXIMO);
        }
        return anpPreco.preco_maximo;
      default:
        throw new EmpresaPrecoCombustivelBaseAnpNaoSuportadaException(anpPreco.base_utilizada);
    }
  }

  /**
   * Mapeia o nome ou sigla do combustível para TipoCombustivelAnp
   */
  private mapearCombustivelParaTipoAnp(nome: string, sigla: string): TipoCombustivelAnp | null {
    const textoBusca = `${nome} ${sigla}`.toLowerCase();
    const siglaLower = sigla.toLowerCase();

    // Mapeamento por sigla primeiro (mais preciso)
    if (siglaLower === 'gas_comum' || siglaLower === 'gasolina_comum' || siglaLower.includes('gas_comum')) {
      return TipoCombustivelAnp.GASOLINA_COMUM;
    }
    if (siglaLower === 'gas_aditivada' || siglaLower === 'gasolina_aditivada' || siglaLower.includes('gas_aditivada')) {
      return TipoCombustivelAnp.GASOLINA_ADITIVADA;
    }
    if (siglaLower === 'etanol' || siglaLower === 'etanol_comum' || siglaLower.includes('etanol')) {
      return TipoCombustivelAnp.ETANOL_COMUM;
    }
    if (siglaLower === 'diesel_s10' || siglaLower.includes('diesel_s10') || siglaLower === 'ds10') {
      return TipoCombustivelAnp.DIESEL_S10;
    }
    if (siglaLower === 'diesel_s500' || siglaLower.includes('diesel_s500') || siglaLower === 'ds500' || siglaLower === 'diesel') {
      return TipoCombustivelAnp.DIESEL_S500;
    }
    if (siglaLower === 'gnv') {
      return TipoCombustivelAnp.GNV;
    }
    if (siglaLower === 'glp') {
      return TipoCombustivelAnp.GLP;
    }

    // Mapeamento por nome (fallback)
    if (textoBusca.includes('gasolina comum')) {
      return TipoCombustivelAnp.GASOLINA_COMUM;
    }
    if (textoBusca.includes('gasolina aditivada')) {
      return TipoCombustivelAnp.GASOLINA_ADITIVADA;
    }
    if (textoBusca.includes('etanol comum') || textoBusca.includes('etanol hidratado') || 
        (textoBusca.includes('etanol') && !textoBusca.includes('aditivado'))) {
      return TipoCombustivelAnp.ETANOL_COMUM;
    }
    if (textoBusca.includes('etanol aditivado')) {
      return TipoCombustivelAnp.ETANOL_ADITIVADO;
    }
    if (textoBusca.includes('diesel s10') || textoBusca.includes('diesel s-10')) {
      return TipoCombustivelAnp.DIESEL_S10;
    }
    if (textoBusca.includes('diesel s500') || textoBusca.includes('diesel s-500') || 
        textoBusca.includes('óleo diesel') || textoBusca.includes('oleo diesel')) {
      return TipoCombustivelAnp.DIESEL_S500;
    }
    if (textoBusca.includes('gnv')) {
      return TipoCombustivelAnp.GNV;
    }
    if (textoBusca.includes('glp')) {
      return TipoCombustivelAnp.GLP;
    }

    return null;
  }

  /**
   * Atualiza o preço atual do combustível consultando automaticamente os dados da ANP
   */
  async updatePrecoAtual(data: UpdatePrecoAtualDto, empresaId: number, userName: string) {
    // Buscar empresa para pegar a UF
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        uf: true,
      },
    });

    if (!empresa) {
      throw new EmpresaPrecoCombustivelEmpresaNaoEncontradaException(empresaId, 'updatePreco');
    }

    // Buscar combustível
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: data.combustivel_id },
    });

    if (!combustivel) {
      throw new EmpresaPrecoCombustivelCombustivelNaoEncontradoException(data.combustivel_id, 'updatePreco');
    }

    // Mapear combustível para TipoCombustivelAnp
    const tipoCombustivelAnp = this.mapearCombustivelParaTipoAnp(combustivel.nome, combustivel.sigla);

    if (!tipoCombustivelAnp) {
      throw new EmpresaPrecoCombustivelTipoCombustivelNaoMapeadoException(combustivel.nome, combustivel.sigla, {
        additionalInfo: {
          tiposValidos: Object.values(TipoCombustivelAnp),
        },
      });
    }

    // Buscar semana ANP ativa
    const anpSemana = await this.prisma.anpSemana.findFirst({
      where: {
        ativo: true,
      },
      orderBy: {
        semana_ref: 'desc',
      },
    });

    if (!anpSemana) {
      throw new EmpresaPrecoCombustivelSemanaAnpNaoEncontradaException();
    }

    // Buscar preço ANP para a UF e tipo de combustível
    const anpPreco = await this.prisma.anpPrecosUf.findFirst({
      where: {
        anp_semana_id: anpSemana.id,
        uf: empresa.uf,
        combustivel: tipoCombustivelAnp,
      },
    });

    if (!anpPreco) {
      throw new EmpresaPrecoCombustivelPrecoAnpNaoEncontradoException(empresa.uf, tipoCombustivelAnp);
    }

    if (!anpPreco.teto_calculado) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemTetoCalculadoException();
    }

    if (!anpPreco.preco_minimo) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemPrecoMinimoException();
    }

    if (!anpPreco.base_utilizada) {
      throw new EmpresaPrecoCombustivelPrecoAnpSemBaseUtilizadaException();
    }

    this.validarPrecoDentroDaFaixa(data.preco_atual, anpPreco);

    if (!anpPreco.margem_aplicada) {
      throw new EmpresaPrecoCombustivelMargemAnpAusenteException();
    }

    const anpBaseValor = this.obterValorBaseAnp(anpPreco);

    // Verificar se já existe um preço para esta empresa e combustível
    const existingPreco = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: data.combustivel_id,
        status: 'ACTIVE',
      },
    });

    // Se existe, atualiza; se não existe, cria
    if (existingPreco) {
      const preco = await this.prisma.empresaPrecoCombustivel.update({
        where: { id: existingPreco.id },
        data: {
          preco_atual: new Prisma.Decimal(data.preco_atual),
          teto_vigente: anpPreco.teto_calculado,
          anp_base: anpPreco.base_utilizada,
          anp_base_valor: anpBaseValor,
          margem_app_pct: anpPreco.margem_aplicada,
          uf_referencia: empresa.uf,
          status: StatusPreco.ACTIVE,
          updated_at: new Date(),
          updated_by: userName,
        },
        include: {
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
        },
      });

      return {
        message: 'Preço atual atualizado com sucesso',
        preco,
      };
    } else {
      // Criar novo registro
      const preco = await this.prisma.empresaPrecoCombustivel.create({
        data: {
          empresa_id: empresaId,
          combustivel_id: data.combustivel_id,
          preco_atual: new Prisma.Decimal(data.preco_atual),
          teto_vigente: anpPreco.teto_calculado,
          anp_base: anpPreco.base_utilizada,
          anp_base_valor: anpBaseValor,
          margem_app_pct: anpPreco.margem_aplicada,
          uf_referencia: empresa.uf,
          status: StatusPreco.ACTIVE,
          updated_at: new Date(),
          updated_by: userName,
        },
        include: {
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
        },
      });

      return {
        message: 'Preço criado com sucesso',
        preco,
      };
    }
  }
}

