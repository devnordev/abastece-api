import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FindAlertaDto } from './dto/find-alerta.dto';
import { TipoRegraAlerta, StatusAlerta, StatusAbastecimento, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AlertaService {
  constructor(private prisma: PrismaService) {}

  async findAll(prefeituraId: number, findAlertaDto: FindAlertaDto) {
    const where: Prisma.AlertaWhereInput = {
      prefeituraId,
    };

    if (findAlertaDto.status) {
      where.status = findAlertaDto.status;
    }

    if (findAlertaDto.veiculoId) {
      where.veiculoId = findAlertaDto.veiculoId;
    }

    const limit = findAlertaDto.limit ?? 10;

    const alertas = await this.prisma.alerta.findMany({
      where,
      take: limit,
      orderBy: { dataOcorrencia: 'desc' },
      include: {
        veiculo: {
          select: { id: true, nome: true, placa: true },
        },
        regraAlerta: {
          select: { id: true, nome: true, tipo: true },
        },
        configuracaoAlerta: {
          select: { id: true, valorLimite: true, percentualLimite: true },
        },
      },
    });

    return {
      message: 'Alertas encontrados com sucesso',
      alertas,
    };
  }

  async gerarAlertas(prefeituraId: number) {
    // Buscar todas as configurações ativas da prefeitura
    const configuracoes = await this.prisma.configuracaoAlerta.findMany({
      where: {
        prefeituraId,
        ativo: true,
      },
      include: {
        regraAlerta: true,
      },
    });

    const alertasGerados = [];

    for (const config of configuracoes) {
      const alertas = await this.verificarRegra(config);
      alertasGerados.push(...alertas);
    }

    return {
      message: 'Alertas gerados com sucesso',
      total: alertasGerados.length,
      alertas: alertasGerados,
    };
  }

  private async verificarRegra(config: any): Promise<any[]> {
    const { regraAlerta, valorLimite, percentualLimite, periodoDias, prefeituraId } = config;
    const periodo = periodoDias ?? 7;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo);

    const alertas: any[] = [];

    switch (regraAlerta.tipo) {
      case TipoRegraAlerta.MULTIPLOS_ABASTECIMENTOS_DIA:
        alertas.push(...(await this.verificarMultiplosAbastecimentosDia(prefeituraId, valorLimite, dataInicio)));
        break;

      case TipoRegraAlerta.QUANTIDADE_LITROS_ACIMA_MEDIA:
        alertas.push(...(await this.verificarQuantidadeLitrosAcimaMedia(prefeituraId, percentualLimite, periodo, dataInicio)));
        break;

      case TipoRegraAlerta.VALOR_ACIMA_MEDIA:
        alertas.push(...(await this.verificarValorAcimaMedia(prefeituraId, percentualLimite, periodo, dataInicio)));
        break;

      case TipoRegraAlerta.AUMENTO_PERCENTUAL_GASTO:
        alertas.push(...(await this.verificarAumentoPercentualGasto(prefeituraId, percentualLimite, periodo, dataInicio)));
        break;

      case TipoRegraAlerta.ABASTECIMENTO_FORA_PADRAO:
        alertas.push(...(await this.verificarAbastecimentoForaPadrao(prefeituraId, percentualLimite, periodo, dataInicio)));
        break;
    }

    // Criar alertas no banco
    const alertasCriados = [];
    for (const alerta of alertas) {
      // Verificar se já existe alerta similar recente (últimas 24h)
      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() - 24);

      const existeAlerta = await this.prisma.alerta.findFirst({
        where: {
          prefeituraId,
          regraAlertaId: regraAlerta.id,
          veiculoId: alerta.veiculoId,
          status: StatusAlerta.ATIVO,
          dataOcorrencia: { gte: dataLimite },
        },
      });

      if (!existeAlerta) {
        const alertaCriado = await this.prisma.alerta.create({
          data: {
            prefeituraId,
            configuracaoAlertaId: config.id,
            regraAlertaId: regraAlerta.id,
            veiculoId: alerta.veiculoId,
            titulo: alerta.titulo,
            mensagem: alerta.mensagem,
            dadosContexto: alerta.dadosContexto,
            dataOcorrencia: new Date(),
            status: StatusAlerta.ATIVO,
          },
          include: {
            veiculo: {
              select: { id: true, nome: true, placa: true },
            },
          },
        });
        alertasCriados.push(alertaCriado);
      }
    }

    return alertasCriados;
  }

  private async verificarMultiplosAbastecimentosDia(
    prefeituraId: number,
    limite: number | null,
    dataInicio: Date,
  ): Promise<any[]> {
    if (!limite || limite < 2) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Buscar veículos com múltiplos abastecimentos hoje
    const abastecimentos = await this.prisma.abastecimento.groupBy({
      by: ['veiculoId'],
      where: {
        veiculo: {
          prefeituraId,
        },
        data_abastecimento: {
          gte: hoje,
          lt: amanha,
        },
        status: StatusAbastecimento.Aprovado,
        ativo: true,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: limite,
          },
        },
      },
    });

    const alertas = [];
    for (const item of abastecimentos) {
      const veiculo = await this.prisma.veiculo.findUnique({
        where: { id: item.veiculoId },
        select: { nome: true, placa: true },
      });

      if (veiculo) {
        alertas.push({
          veiculoId: item.veiculoId,
          titulo: `Múltiplos abastecimentos no dia`,
          mensagem: `O veículo ${veiculo.nome} (${veiculo.placa}) registrou ${item._count.id} abastecimentos hoje, acima do limite de ${limite}.`,
          dadosContexto: {
            quantidadeAbastecimentos: item._count.id,
            limite,
            data: hoje.toISOString(),
          },
        });
      }
    }

    return alertas;
  }

  private async verificarQuantidadeLitrosAcimaMedia(
    prefeituraId: number,
    percentualLimite: number | null,
    periodo: number,
    dataInicio: Date,
  ): Promise<any[]> {
    if (!percentualLimite) return [];

    // Calcular média de litros por veículo no período
    const mediaPorVeiculo = await this.prisma.abastecimento.groupBy({
      by: ['veiculoId'],
      where: {
        veiculo: {
          prefeituraId,
        },
        data_abastecimento: {
          gte: dataInicio,
        },
        status: StatusAbastecimento.Aprovado,
        ativo: true,
      },
      _avg: {
        quantidade: true,
      },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alertas = [];
    for (const media of mediaPorVeiculo) {
      if (!media._avg.quantidade) continue;

      const mediaLitros = Number(media._avg.quantidade);
      const limiteLitros = mediaLitros * (1 + percentualLimite / 100);

      // Verificar abastecimentos de hoje acima da média
      const abastecimentosHoje = await this.prisma.abastecimento.findMany({
        where: {
          veiculoId: media.veiculoId,
          data_abastecimento: {
            gte: hoje,
          },
          status: StatusAbastecimento.Aprovado,
          ativo: true,
          quantidade: {
            gt: limiteLitros,
          },
        },
        include: {
          veiculo: {
            select: { nome: true, placa: true },
          },
        },
      });

      for (const abastecimento of abastecimentosHoje) {
        const quantidade = Number(abastecimento.quantidade);
        const percentualAumento = ((quantidade - mediaLitros) / mediaLitros) * 100;

        alertas.push({
          veiculoId: media.veiculoId,
          titulo: `Quantidade de litros acima da média`,
          mensagem: `O veículo ${abastecimento.veiculo.nome} (${abastecimento.veiculo.placa}) abasteceu ${quantidade.toFixed(2)} litros, ${percentualAumento.toFixed(1)}% acima da média de ${mediaLitros.toFixed(2)} litros.`,
          dadosContexto: {
            quantidadeAtual: quantidade,
            mediaPeriodo: mediaLitros,
            percentualAumento: percentualAumento.toFixed(1),
            limitePercentual: percentualLimite,
          },
        });
      }
    }

    return alertas;
  }

  private async verificarValorAcimaMedia(
    prefeituraId: number,
    percentualLimite: number | null,
    periodo: number,
    dataInicio: Date,
  ): Promise<any[]> {
    if (!percentualLimite) return [];

    // Similar ao anterior, mas para valor
    const mediaPorVeiculo = await this.prisma.abastecimento.groupBy({
      by: ['veiculoId'],
      where: {
        veiculo: {
          prefeituraId,
        },
        data_abastecimento: {
          gte: dataInicio,
        },
        status: StatusAbastecimento.Aprovado,
        ativo: true,
      },
      _avg: {
        valor_total: true,
      },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alertas = [];
    for (const media of mediaPorVeiculo) {
      if (!media._avg.valor_total) continue;

      const mediaValor = Number(media._avg.valor_total);
      const limiteValor = mediaValor * (1 + percentualLimite / 100);

      const abastecimentosHoje = await this.prisma.abastecimento.findMany({
        where: {
          veiculoId: media.veiculoId,
          data_abastecimento: {
            gte: hoje,
          },
          status: StatusAbastecimento.Aprovado,
          ativo: true,
          valor_total: {
            gt: limiteValor,
          },
        },
        include: {
          veiculo: {
            select: { nome: true, placa: true },
          },
        },
      });

      for (const abastecimento of abastecimentosHoje) {
        const valor = Number(abastecimento.valor_total);
        const percentualAumento = ((valor - mediaValor) / mediaValor) * 100;

        alertas.push({
          veiculoId: media.veiculoId,
          titulo: `Valor de abastecimento acima da média`,
          mensagem: `O veículo ${abastecimento.veiculo.nome} (${abastecimento.veiculo.placa}) teve um abastecimento de R$ ${valor.toFixed(2)}, ${percentualAumento.toFixed(1)}% acima da média de R$ ${mediaValor.toFixed(2)}.`,
          dadosContexto: {
            valorAtual: valor,
            mediaPeriodo: mediaValor,
            percentualAumento: percentualAumento.toFixed(1),
            limitePercentual: percentualLimite,
          },
        });
      }
    }

    return alertas;
  }

  private async verificarAumentoPercentualGasto(
    prefeituraId: number,
    percentualLimite: number | null,
    periodo: number,
    dataInicio: Date,
  ): Promise<any[]> {
    if (!percentualLimite) return [];

    // Comparar gasto diário atual com período anterior
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const periodoAnteriorInicio = new Date(dataInicio);
    periodoAnteriorInicio.setDate(periodoAnteriorInicio.getDate() - periodo);

    // Gasto médio diário no período anterior
    const gastoMedioPeriodo = await this.prisma.abastecimento.groupBy({
      by: ['veiculoId'],
      where: {
        veiculo: {
          prefeituraId,
        },
        data_abastecimento: {
          gte: periodoAnteriorInicio,
          lt: dataInicio,
        },
        status: StatusAbastecimento.Aprovado,
        ativo: true,
      },
      _sum: {
        valor_total: true,
      },
    });

    // Gasto de hoje
    const gastoHoje = await this.prisma.abastecimento.groupBy({
      by: ['veiculoId'],
      where: {
        veiculo: {
          prefeituraId,
        },
        data_abastecimento: {
          gte: hoje,
        },
        status: StatusAbastecimento.Aprovado,
        ativo: true,
      },
      _sum: {
        valor_total: true,
      },
    });

    const alertas = [];
    for (const gasto of gastoHoje) {
      const gastoHojeValor = Number(gasto._sum.valor_total || 0);
      const mediaPeriodo = gastoMedioPeriodo.find((m) => m.veiculoId === gasto.veiculoId);
      const mediaPeriodoValor = mediaPeriodo ? Number(mediaPeriodo._sum.valor_total || 0) / periodo : 0;

      if (mediaPeriodoValor > 0) {
        const percentualAumento = ((gastoHojeValor - mediaPeriodoValor) / mediaPeriodoValor) * 100;

        if (percentualAumento >= percentualLimite) {
          const veiculo = await this.prisma.veiculo.findUnique({
            where: { id: gasto.veiculoId },
            select: { nome: true, placa: true },
          });

          if (veiculo) {
            alertas.push({
              veiculoId: gasto.veiculoId,
              titulo: `Aumento percentual no gasto diário`,
              mensagem: `O veículo ${veiculo.nome} (${veiculo.placa}) registrou um aumento de ${percentualAumento.toFixed(1)}% a mais no gasto diário com combustível.`,
              dadosContexto: {
                gastoHoje: gastoHojeValor,
                mediaDiaria: mediaPeriodoValor,
                percentualAumento: percentualAumento.toFixed(1),
                limitePercentual: percentualLimite,
              },
            });
          }
        }
      }
    }

    return alertas;
  }

  private async verificarAbastecimentoForaPadrao(
    prefeituraId: number,
    percentualLimite: number | null,
    periodo: number,
    dataInicio: Date,
  ): Promise<any[]> {
    // Verificar se quantidade abastecida está muito acima da capacidade do tanque
    const veiculos = await this.prisma.veiculo.findMany({
      where: {
        prefeituraId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        placa: true,
        capacidade_tanque: true,
      },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alertas = [];
    for (const veiculo of veiculos) {
      const capacidade = Number(veiculo.capacidade_tanque);
      const limiteMaximo = capacidade * 1.1; // 10% acima da capacidade

      const abastecimentos = await this.prisma.abastecimento.findMany({
        where: {
          veiculoId: veiculo.id,
          data_abastecimento: {
            gte: hoje,
          },
          status: StatusAbastecimento.Aprovado,
          ativo: true,
          quantidade: {
            gt: limiteMaximo,
          },
        },
      });

      for (const abastecimento of abastecimentos) {
        const quantidade = Number(abastecimento.quantidade);
        const percentualAcima = ((quantidade - capacidade) / capacidade) * 100;

        alertas.push({
          veiculoId: veiculo.id,
          titulo: `Abastecimento fora do padrão`,
          mensagem: `O veículo ${veiculo.nome} (${veiculo.placa}) foi abastecido com ${quantidade.toFixed(2)} litros, ${percentualAcima.toFixed(1)}% acima da capacidade do tanque (${capacidade.toFixed(2)} litros).`,
          dadosContexto: {
            quantidade: quantidade,
            capacidadeTanque: capacidade,
            percentualAcima: percentualAcima.toFixed(1),
          },
        });
      }
    }

    return alertas;
  }

  async marcarComoResolvido(id: number, usuarioId: number) {
    const alerta = await this.prisma.alerta.findUnique({
      where: { id },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta não encontrado');
    }

    const alertaAtualizado = await this.prisma.alerta.update({
      where: { id },
      data: {
        status: StatusAlerta.RESOLVIDO,
        dataResolucao: new Date(),
        resolvidoPor: usuarioId,
      },
    });

    return {
      message: 'Alerta marcado como resolvido',
      alerta: alertaAtualizado,
    };
  }
}

