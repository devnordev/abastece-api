import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';

@Injectable()
export class ProcessoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProcessoDto) {
    // Validar se tipo_contrato é obrigatório
    if (!data.tipo_contrato) {
      throw new BadRequestException('Tipo de contrato é obrigatório');
    }

    // Validações específicas para tipo OBJETIVO
    if (data.tipo_contrato === TipoContrato.OBJETIVO) {
      const camposObrigatorios = [];
      
      if (!data.prefeituraId) camposObrigatorios.push('prefeituraId');
      if (!data.numero_processo) camposObrigatorios.push('numero_processo');
      if (!data.numero_documento) camposObrigatorios.push('numero_documento');
      if (!data.data_abertura) camposObrigatorios.push('data_abertura');
      if (!data.status) camposObrigatorios.push('status');
      if (!data.objeto) camposObrigatorios.push('objeto');

      if (camposObrigatorios.length > 0) {
        throw new BadRequestException(
          `Para processos do tipo OBJETIVO, os seguintes campos são obrigatórios: ${camposObrigatorios.join(', ')}`
        );
      }

      // Verificar se a prefeitura existe
      const prefeituraExists = await this.prisma.prefeitura.findUnique({
        where: { id: data.prefeituraId },
      });

      if (!prefeituraExists) {
        throw new NotFoundException('Prefeitura não encontrada');
      }

    // Verificar se já existe um processo para esta prefeitura
      const existingProcesso = await this.prisma.processo.findFirst({
        where: { prefeituraId: data.prefeituraId },
      });

      if (existingProcesso) {
        throw new ConflictException('Esta prefeitura já possui um processo cadastrado. Uma prefeitura só pode ter um processo ativo.');
      }
    }

    // Validar se data de encerramento é posterior à data de abertura
    if (data.data_abertura && data.data_encerramento) {
      if (new Date(data.data_abertura) >= new Date(data.data_encerramento)) {
        throw new BadRequestException('Data de encerramento deve ser posterior à data de abertura');
      }
    }

    const { combustiveis, ...processoPayload } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const processo = await tx.processo.create({
        data: {
          ...processoPayload,
          data_abertura: data.data_abertura ? new Date(data.data_abertura) : undefined,
          data_encerramento: data.data_encerramento ? new Date(data.data_encerramento) : undefined,
          tipo_itens: data.tipo_itens || TipoItens.QUANTIDADE_LITROS,
          status: data.status || StatusProcesso.ATIVO,
          ativo: data.ativo !== undefined ? data.ativo : true,
        },
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
      });

      let combustiveisCriados = [];

      if (combustiveis?.length) {
        const combustiveisData = combustiveis.map((item) => ({
          processoId: processo.id,
          combustivelId: item.combustivelId,
          quantidade_litros: new Decimal(item.quantidade_litros),
          valor_unitario: item.valor_unitario !== undefined ? new Decimal(item.valor_unitario) : undefined,
        }));

        await tx.processoCombustivel.createMany({
          data: combustiveisData,
        });

        combustiveisCriados = await tx.processoCombustivel.findMany({
          where: { processoId: processo.id },
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        });
      }

      return { processo, combustiveis: combustiveisCriados };
    });

    return {
      message: 'Processo criado com sucesso',
      processo: {
        ...result.processo,
        combustiveis: result.combustiveis,
      },
    };
  }

  async findAll(page = 1, limit = 10, prefeituraId?: number, status?: StatusProcesso, ativo?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (status) where.status = status;
    if (ativo !== undefined) where.ativo = ativo;

    const [processos, total] = await Promise.all([
      this.prisma.processo.findMany({
        where,
        skip,
        take: limit,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
        orderBy: { data_abertura: 'desc' },
      }),
      this.prisma.processo.count({ where }),
    ]);

    return {
      message: 'Processos encontrados com sucesso',
      processos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const processo = await this.prisma.processo.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true },
            },
          },
        },
        _count: {
          select: {
            cotasOrgao: true,
            prefeiturasConsorcio: true,
          },
        },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado');
    }

    return {
      message: 'Processo encontrado com sucesso',
      processo,
    };
  }

  async findByPrefeituraDetalhado(prefeituraId: number) {
    // Buscar processo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: { prefeituraId },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true, descricao: true },
            },
          },
        },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado para esta prefeitura');
    }

    // Buscar abastecimentos relacionados ao processo (através da prefeitura)
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: {
        veiculo: {
          prefeituraId: prefeituraId,
        },
      },
      include: {
        combustivel: true,
        veiculo: true,
      },
    });

    // Calcular totais e estatísticas
    const totalLitrosContratados = processo.combustiveis.reduce(
      (sum, pc) => sum + Number(pc.quantidade_litros),
      0
    );

    const totalLitrosUtilizados = abastecimentos.reduce(
      (sum, ab) => sum + Number(ab.quantidade || 0),
      0
    );

    const percentualUtilizacao = totalLitrosContratados > 0 
      ? (totalLitrosUtilizados / totalLitrosContratados) * 100 
      : 0;

    // Calcular duração em dias
    const dataAbertura = new Date(processo.data_abertura);
    const dataEncerramento = new Date(processo.data_encerramento);
    const duracaoDias = Math.ceil((dataEncerramento.getTime() - dataAbertura.getTime()) / (1000 * 60 * 60 * 24));

    // Formatar combustíveis do processo
    const combustiveisFormatados = processo.combustiveis.map(pc => {
      const percentual = totalLitrosContratados > 0 
        ? (Number(pc.quantidade_litros) / totalLitrosContratados) * 100 
        : 0;

      return {
        id: pc.id,
        combustivelId: pc.combustivel.id,
        nome: pc.combustivel.nome,
        sigla: pc.combustivel.sigla,
        descricao: pc.combustivel.descricao,
        processDescription: processo.tipo_contrato === 'OBJETIVO' ? 'Processo Objetivo' : 'Processo Consorciado',
        quantityLiters: Number(pc.quantidade_litros),
        quantityDescription: 'Contratado',
        percentage: Number(percentual.toFixed(2)),
        percentageDescription: percentual === 100 ? 'Exclusivo' : 'Compartilhado',
        status: 'Ativo',
      };
    });

    // Análise visual para gráficos
    const distributionByFuel = combustiveisFormatados.map(c => ({
      fuelName: c.nome,
      percentage: c.percentage,
    }));

    const quantityByFuel = combustiveisFormatados.map(c => ({
      fuelName: c.nome,
      quantityLiters: c.quantityLiters,
    }));

    // Montar payload formatado
    const payload = {
      id: processo.numero_processo,
      processoId: processo.id,
      prefeituraId: processo.prefeituraId,
      prefeituraNome: processo.prefeitura?.nome,
      title: `Processo ${processo.numero_processo}`,
      status: processo.status,
      message: processo.status === 'ATIVO' ? 'está funcionando perfeitamente!' : '',
      description: 'Visualize detalhes, combustíveis disponíveis e alocações do processo da sua prefeitura',
      processType: {
        name: processo.tipo_contrato === 'OBJETIVO' ? 'Processo Objetivo' : 'Processo Consorciado',
        description: 'Recursos específicos para sua prefeitura',
      },
      officialDocumentNumber: processo.numero_processo,
      totalValueLiters: totalLitrosContratados,
      totalValueDescription: 'Total Disponível',
      openingDate: processo.data_abertura,
      closingDate: processo.data_encerramento,
      totalFuelsCount: processo.combustiveis.length,
      fuelsOverview: combustiveisFormatados,
      performanceIndicators: {
        utilizationPercentage: Number(percentualUtilizacao.toFixed(1)),
        utilizationDescription: 'Utilizado',
        durationDays: duracaoDias,
        durationDescription: 'Dias',
        processStatus: processo.status,
        processStatusDescription: 'Status',
        totalFuelsCount: processo.combustiveis.length,
        totalFuelsDescription: 'Combustíveis',
      },
      summary: {
        id: processo.id,
        year: new Date(processo.data_abertura).getFullYear(),
      },
      quickActions: {
        documentsLink: `/api/processos/${processo.id}/documentos`,
        contractLink: `/api/processos/${processo.id}/contrato`,
        itemsLink: `/api/processos/${processo.id}/itens`,
        voucherLink: `/api/processos/${processo.id}/comprovante`,
      },
      statistics: {
        fuelsCount: processo.combustiveis.length,
        fuelsQuantityLiters: totalLitrosContratados,
        totalUtilizado: totalLitrosUtilizados,
        totalDisponivel: totalLitrosContratados - totalLitrosUtilizados,
      },
      contractedFuels: combustiveisFormatados.map(c => ({
        name: c.nome,
        contractedQuantityLiters: c.quantityLiters,
      })),
      visualAnalysis: {
        distributionByFuel,
        quantityByFuel,
      },
      processDescriptionText: processo.objeto || '',
      supplyUtilization: {
        hasSuppliesRegistered: abastecimentos.length > 0,
        message: abastecimentos.length > 0 
          ? `${abastecimentos.length} abastecimento(s) registrado(s)` 
          : 'Nenhum abastecimento registrado',
        detailedMessage: abastecimentos.length > 0
          ? `Este processo possui ${abastecimentos.length} abastecimentos registrados.`
          : 'Este processo ainda não possui abastecimentos registrados.',
        abastecimentos: abastecimentos.map(ab => ({
          id: ab.id,
          veiculoId: ab.veiculoId,
          veiculoNome: ab.veiculo?.nome,
          veiculoPlaca: ab.veiculo?.placa,
          combustivelNome: ab.combustivel?.nome,
          quantidadeLitros: Number(ab.quantidade || 0),
          valorTotal: Number(ab.valor_total || 0),
          dataAbastecimento: ab.data_abastecimento,
          status: ab.status,
        })),
      },
      // Dados originais completos do processo
      processoCompleto: processo,
    };

    return {
      message: 'Processo detalhado encontrado com sucesso',
      data: payload,
    };
  }

  async update(id: number, data: UpdateProcessoDto) {
    const existingProcesso = await this.prisma.processo.findUnique({
      where: { id },
      include: {
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true },
            },
          },
        },
      },
    });

    if (!existingProcesso) {
      throw new NotFoundException('Processo não encontrado');
    }

    const { combustiveis, ...processoData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const processo = await tx.processo.update({
        where: { id },
        data: processoData,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
      });

      let combustiveisAtualizados = null;

      if (combustiveis) {
        await tx.processoCombustivel.deleteMany({
          where: { processoId: id },
        });

        if (combustiveis.length) {
          const combustiveisData = combustiveis.map((item) => ({
            processoId: id,
            combustivelId: item.combustivelId,
            quantidade_litros: new Decimal(item.quantidade_litros),
            valor_unitario:
              item.valor_unitario !== undefined ? new Decimal(item.valor_unitario) : undefined,
          }));

          await tx.processoCombustivel.createMany({
            data: combustiveisData,
          });
        }

        combustiveisAtualizados = await tx.processoCombustivel.findMany({
          where: { processoId: id },
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        });
      }

      return { processo, combustiveis: combustiveisAtualizados };
    });

    return {
      message: 'Processo atualizado com sucesso',
      processo: {
        ...result.processo,
        combustiveis: result.combustiveis ?? existingProcesso.combustiveis,
      },
    };
  }

  async remove(id: number) {
    const existingProcesso = await this.prisma.processo.findUnique({
      where: { id },
    });

    if (!existingProcesso) {
      throw new NotFoundException('Processo não encontrado');
    }

    await this.prisma.processo.delete({
      where: { id },
    });

    return {
      message: 'Processo excluído com sucesso',
    };
  }
}
