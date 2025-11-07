import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmpresaPrecoCombustivelDto } from './dto/create-empresa-preco-combustivel.dto';
import { UpdateEmpresaPrecoCombustivelDto } from './dto/update-empresa-preco-combustivel.dto';
import { FindEmpresaPrecoCombustivelDto } from './dto/find-empresa-preco-combustivel.dto';
import { UpdatePrecoAtualDto } from './dto/update-preco-atual.dto';
import { Prisma, TipoCombustivelAnp, AnpBase } from '@prisma/client';

@Injectable()
export class EmpresaPrecoCombustivelService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEmpresaPrecoCombustivelDto, empresaId: number) {
    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se o combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: data.combustivel_id },
    });

    if (!combustivel) {
      throw new NotFoundException('Combustível não encontrado');
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
      throw new ConflictException('Já existe um preço ativo para esta empresa e combustível');
    }

    const preco = await this.prisma.empresaPrecoCombustivel.create({
      data: {
        empresa_id: empresaId,
        combustivel_id: data.combustivel_id,
        preco_atual: new Prisma.Decimal(data.preco_atual),
        teto_vigente: new Prisma.Decimal(data.teto_vigente),
        anp_base: data.anp_base,
        anp_base_valor: new Prisma.Decimal(data.anp_base_valor),
        margem_app_pct: new Prisma.Decimal(data.margem_app_pct),
        uf_referencia: data.uf_referencia,
        status: data.status || 'ACTIVE',
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
      throw new NotFoundException('Preço de combustível não encontrado');
    }

    // Verificar se o preço pertence à empresa do usuário
    if (preco.empresa_id !== empresaId) {
      throw new ForbiddenException('Você não tem permissão para acessar este preço');
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

    if (!existingPreco) {
      throw new NotFoundException('Preço de combustível não encontrado');
    }

    // Verificar se o preço pertence à empresa do usuário
    if (existingPreco.empresa_id !== empresaId) {
      throw new ForbiddenException('Você não tem permissão para atualizar este preço');
    }

    // Se estiver alterando combustível, verificar se já existe preço ativo para o novo combustível
    if (data.combustivel_id && data.combustivel_id !== existingPreco.combustivel_id) {
      const combustivel = await this.prisma.combustivel.findUnique({
        where: { id: data.combustivel_id },
      });

      if (!combustivel) {
        throw new NotFoundException('Combustível não encontrado');
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
        throw new ConflictException('Já existe um preço ativo para este combustível');
      }
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.preco_atual !== undefined) {
      updateData.preco_atual = new Prisma.Decimal(data.preco_atual);
    }
    if (data.teto_vigente !== undefined) {
      updateData.teto_vigente = new Prisma.Decimal(data.teto_vigente);
    }
    if (data.anp_base !== undefined) {
      updateData.anp_base = data.anp_base;
    }
    if (data.anp_base_valor !== undefined) {
      updateData.anp_base_valor = new Prisma.Decimal(data.anp_base_valor);
    }
    if (data.margem_app_pct !== undefined) {
      updateData.margem_app_pct = new Prisma.Decimal(data.margem_app_pct);
    }
    if (data.uf_referencia !== undefined) {
      updateData.uf_referencia = data.uf_referencia;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.updated_by !== undefined) {
      updateData.updated_by = data.updated_by;
    }
    if (data.combustivel_id !== undefined) {
      updateData.combustivel_id = data.combustivel_id;
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
      throw new NotFoundException('Preço de combustível não encontrado');
    }

    // Verificar se o preço pertence à empresa do usuário
    if (existingPreco.empresa_id !== empresaId) {
      throw new ForbiddenException('Você não tem permissão para excluir este preço');
    }

    await this.prisma.empresaPrecoCombustivel.delete({
      where: { id },
    });

    return {
      message: 'Preço de combustível excluído com sucesso',
    };
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
      throw new NotFoundException('Empresa não encontrada');
    }

    // Buscar combustível
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: data.combustivel_id },
    });

    if (!combustivel) {
      throw new NotFoundException('Combustível não encontrado');
    }

    // Mapear combustível para TipoCombustivelAnp
    const tipoCombustivelAnp = this.mapearCombustivelParaTipoAnp(combustivel.nome, combustivel.sigla);

    if (!tipoCombustivelAnp) {
      throw new BadRequestException(
        `Não foi possível mapear o combustível "${combustivel.nome}" (${combustivel.sigla}) para um tipo ANP válido. ` +
        `Tipos válidos: GASOLINA_COMUM, GASOLINA_ADITIVADA, ETANOL_COMUM, ETANOL_ADITIVADO, DIESEL_S10, DIESEL_S500, GNV, GLP`
      );
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
      throw new NotFoundException('Nenhuma semana ANP ativa encontrada. É necessário ter uma semana ANP ativa para atualizar preços.');
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
      throw new NotFoundException(
        `Preço ANP não encontrado para UF ${empresa.uf} e combustível ${tipoCombustivelAnp}. ` +
        `Verifique se os preços ANP foram importados para esta semana.`
      );
    }

    // Validar se tem teto calculado
    if (!anpPreco.teto_calculado) {
      throw new BadRequestException(
        `O preço ANP encontrado não possui teto calculado. É necessário calcular o teto antes de atualizar preços.`
      );
    }

    // Validar se tem base utilizada
    if (!anpPreco.base_utilizada) {
      throw new BadRequestException(
        `O preço ANP encontrado não possui base utilizada definida.`
      );
    }

    // Determinar o valor da base ANP baseado na base_utilizada
    let anpBaseValor: Prisma.Decimal;
    if (anpPreco.base_utilizada === AnpBase.MINIMO) {
      if (!anpPreco.preco_minimo) {
        throw new BadRequestException('Preço mínimo não encontrado na tabela ANP para a base MINIMO.');
      }
      anpBaseValor = anpPreco.preco_minimo;
    } else if (anpPreco.base_utilizada === AnpBase.MEDIO) {
      anpBaseValor = anpPreco.preco_medio;
    } else if (anpPreco.base_utilizada === AnpBase.MAXIMO) {
      if (!anpPreco.preco_maximo) {
        throw new BadRequestException('Preço máximo não encontrado na tabela ANP para a base MAXIMO.');
      }
      anpBaseValor = anpPreco.preco_maximo;
    } else {
      // Fallback para médio se não tiver base definida
      anpBaseValor = anpPreco.preco_medio;
    }

    // Validar margem aplicada
    if (!anpPreco.margem_aplicada) {
      throw new BadRequestException('Margem aplicada não encontrada na tabela ANP.');
    }

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
          status: 'ACTIVE',
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
          status: 'ACTIVE',
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

