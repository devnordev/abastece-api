import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminPrefeituraDashboardQueryDto } from './dto/admin-prefeitura-dashboard-query.dto';
import { AdminEmpresaDashboardQueryDto } from './dto/admin-empresa-dashboard-query.dto';
import { StatusAbastecimento } from '@prisma/client';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminPrefeituraDashboard(user: any, query: AdminPrefeituraDashboardQueryDto) {
    const prefeituraId = user?.prefeitura?.id ?? user?.prefeituraId;
    if (!prefeituraId) {
      throw new ForbiddenException('Usuário não está vinculado a uma prefeitura.');
    }
    const usuarioNome = user?.nome ?? user?.email ?? 'Usuário';

    const limit =
      query?.abastecimentosLimit && query.abastecimentosLimit > 0 ? query.abastecimentosLimit : 10;

    const [
      veiculosCount,
      motoristasCount,
      processosCount,
      abastecimentosAggregate,
      abastecimentos,
      cotasOrgaoRaw,
      veiculosGroup,
    ] = await Promise.all([
      this.prisma.veiculo.count({ where: { prefeituraId } }),
      this.prisma.motorista.count({ where: { prefeituraId } }),
      this.prisma.processo.count({ where: { prefeituraId } }),
      this.prisma.abastecimento.aggregate({
        where: {
          veiculo: {
            prefeituraId,
          },
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.findMany({
        where: {
          veiculo: {
            prefeituraId,
          },
        },
        orderBy: {
          data_abastecimento: 'desc',
        },
        take: limit,
        include: {
          empresa: {
            select: {
              id: true,
              nome: true,
            },
          },
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              orgao: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      this.prisma.cotaOrgao.findMany({
        where: {
          orgao: {
            prefeituraId,
          },
        },
        select: {
          orgaoId: true,
          quantidade_utilizada: true,
          orgao: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      this.prisma.abastecimento.groupBy({
        by: ['veiculoId'],
        where: {
          status: StatusAbastecimento.Aprovado,
          veiculo: {
            prefeituraId,
          },
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
    ]);

    const totalQuantidadeAbastecida = Number(
      abastecimentosAggregate._sum.quantidade?.toString() ?? 0,
    );
    const totalValorAbastecido = Number(
      abastecimentosAggregate._sum.valor_total?.toString() ?? 0,
    );

    const cotasOrgaoMap = new Map<
      number,
      {
        orgaoId: number;
        orgaoNome: string;
        quantidadeUtilizada: number;
      }
    >();

    cotasOrgaoRaw.forEach((cota) => {
      const quantidade = Number(cota.quantidade_utilizada?.toString() ?? 0);
      const existing = cotasOrgaoMap.get(cota.orgaoId);
      if (existing) {
        existing.quantidadeUtilizada += quantidade;
      } else {
        cotasOrgaoMap.set(cota.orgaoId, {
          orgaoId: cota.orgao.id,
          orgaoNome: cota.orgao.nome,
          quantidadeUtilizada: quantidade,
        });
      }
    });

    const cotasPorOrgao = Array.from(cotasOrgaoMap.values());

    const veiculoIds = veiculosGroup.map((item) => item.veiculoId);

    const veiculosDetalhes = veiculoIds.length
      ? await this.prisma.veiculo.findMany({
          where: { id: { in: veiculoIds } },
          select: {
            id: true,
            nome: true,
            placa: true,
            combustiveis: {
              where: { ativo: true },
              select: {
                combustivel: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const veiculosDetalhesMap = new Map(
      veiculosDetalhes.map((veiculo) => [veiculo.id, veiculo]),
    );

    const veiculosComAbastecimentoAprovado = veiculosGroup.map((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      return {
        veiculoId: veiculo.veiculoId,
        nome: detalhes?.nome ?? null,
        placa: detalhes?.placa ?? null,
        combustiveis: detalhes?.combustiveis?.map((item) => item.combustivel.nome) ?? [],
        quantidadeTotal: Number(veiculo._sum.quantidade?.toString() ?? 0),
        valorTotal: Number(veiculo._sum.valor_total?.toString() ?? 0),
      };
    });

    const abastecimentosDetalhados = abastecimentos.map((abastecimento) => ({
      id: abastecimento.id,
      data_abastecimento: abastecimento.data_abastecimento,
      empresa: abastecimento.empresa?.nome ?? null,
      veiculo: {
        id: abastecimento.veiculo?.id ?? null,
        nome: abastecimento.veiculo?.nome ?? null,
        placa: abastecimento.veiculo?.placa ?? null,
      },
      orgao: abastecimento.veiculo?.orgao?.nome ?? null,
      motorista: abastecimento.motorista?.nome ?? null,
      combustivel: abastecimento.combustivel?.nome ?? null,
      quantidade: Number(abastecimento.quantidade?.toString() ?? 0),
      valor_total: Number(abastecimento.valor_total?.toString() ?? 0),
      preco_empresa: abastecimento.preco_empresa
        ? Number(abastecimento.preco_empresa.toString())
        : null,
      status: abastecimento.status,
    }));

    return {
      prefeituraId,
      usuario: {
        id: user?.id ?? null,
        nome: usuarioNome,
        email: user?.email ?? null,
      },
      cards: {
        totalVeiculos: veiculosCount,
        totalMotoristas: motoristasCount,
        totalProcessos: processosCount,
        totalQuantidadeAbastecida,
        totalValorAbastecido,
      },
      abastecimentos: {
        totalRegistros: abastecimentos.length,
        limiteAplicado: limit,
        dados: abastecimentosDetalhados,
      },
      cotasPorOrgao,
      veiculosComAbastecimentosAprovados: veiculosComAbastecimentoAprovado,
    };
  }

  async getAdminEmpresaDashboard(user: any, query: AdminEmpresaDashboardQueryDto) {
    const empresaId = user?.empresa?.id ?? user?.empresaId;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não está vinculado a uma empresa.');
    }

    const limit =
      query?.abastecimentosLimit && query.abastecimentosLimit > 0 ? query.abastecimentosLimit : 10;

    // Calcular períodos para comparação
    const agora = new Date();
    const mesAtualInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mesAtualFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    const mesAnteriorInicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);
    const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Contagens gerais
      totalAbastecimentos,
      abastecimentosAprovados,
      abastecimentosAguardando,
      abastecimentosRejeitados,
      veiculosDistinct,
      motoristasDistinct,
      prefeiturasDistinct,
      contratosCount,
      contratosAtivos,
      
      // Agregações gerais
      abastecimentosAggregate,
      abastecimentosMesAtual,
      abastecimentosMesAnterior,
      abastecimentosUltimos30Dias,
      
      // Dados detalhados
      abastecimentos,
      groupVeiculos,
      groupCombustiveis,
      groupStatus,
    ] = await Promise.all([
      // Contagens
      this.prisma.abastecimento.count({
        where: { empresaId, ativo: true },
      }),
      this.prisma.abastecimento.count({
        where: { empresaId, status: StatusAbastecimento.Aprovado, ativo: true },
      }),
      this.prisma.abastecimento.count({
        where: { empresaId, status: StatusAbastecimento.Aguardando, ativo: true },
      }),
      this.prisma.abastecimento.count({
        where: { empresaId, status: StatusAbastecimento.Rejeitado, ativo: true },
      }),
      this.prisma.abastecimento.findMany({
        where: { empresaId, ativo: true },
        distinct: ['veiculoId'],
        select: { veiculoId: true },
      }),
      this.prisma.abastecimento.findMany({
        where: {
          empresaId,
          motoristaId: { not: null },
          ativo: true,
        },
        distinct: ['motoristaId'],
        select: { motoristaId: true },
      }),
      this.prisma.abastecimento.findMany({
        where: { empresaId, ativo: true },
        include: {
          veiculo: {
            select: { prefeituraId: true },
          },
        },
      }).then((abs) => {
        const prefeituraIds = new Set(
          abs.map((a) => a.veiculo?.prefeituraId).filter((id): id is number => id !== null && id !== undefined),
        );
        return prefeituraIds.size;
      }),
      this.prisma.contrato.count({
        where: { empresaId },
      }),
      this.prisma.contrato.count({
        where: { empresaId, ativo: true },
      }),
      
      // Agregações
      this.prisma.abastecimento.aggregate({
        where: { empresaId, ativo: true },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.aggregate({
        where: {
          empresaId,
          ativo: true,
          data_abastecimento: {
            gte: mesAtualInicio,
            lte: mesAtualFim,
          },
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.aggregate({
        where: {
          empresaId,
          ativo: true,
          data_abastecimento: {
            gte: mesAnteriorInicio,
            lte: mesAnteriorFim,
          },
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.aggregate({
        where: {
          empresaId,
          ativo: true,
          data_abastecimento: {
            gte: ultimos30Dias,
          },
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      
      // Dados detalhados
      this.prisma.abastecimento.findMany({
        where: { empresaId, ativo: true },
        orderBy: { data_abastecimento: 'desc' },
        take: limit,
        include: {
          empresa: {
            select: { id: true, nome: true },
          },
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              orgao: {
                select: { id: true, nome: true, sigla: true },
              },
              prefeitura: {
                select: { id: true, nome: true },
              },
            },
          },
          motorista: {
            select: { id: true, nome: true },
          },
          combustivel: {
            select: { id: true, nome: true, sigla: true },
          },
        },
      }),
      this.prisma.abastecimento.groupBy({
        by: ['veiculoId'],
        where: { empresaId, ativo: true },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.groupBy({
        by: ['combustivelId'],
        where: { empresaId, ativo: true },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.groupBy({
        by: ['status'],
        where: { empresaId, ativo: true },
        _count: { id: true },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
    ]);

    // Buscar detalhes dos veículos
    const veiculoIds = groupVeiculos.map((item) => item.veiculoId);
    const veiculosDetalhes = veiculoIds.length
      ? await this.prisma.veiculo.findMany({
          where: { id: { in: veiculoIds } },
          select: {
            id: true,
            nome: true,
            placa: true,
            orgao: {
              select: { id: true, nome: true, sigla: true },
            },
            prefeitura: {
              select: { id: true, nome: true },
            },
          },
        })
      : [];

    const veiculosDetalhesMap = new Map(
      veiculosDetalhes.map((veiculo) => [veiculo.id, veiculo]),
    );

    // Buscar detalhes dos combustíveis
    const combustivelIds = groupCombustiveis.map((item) => item.combustivelId);
    const combustiveisDetalhes = combustivelIds.length
      ? await this.prisma.combustivel.findMany({
          where: { id: { in: combustivelIds } },
          select: { id: true, nome: true, sigla: true },
        })
      : [];

    const combustiveisDetalhesMap = new Map(
      combustiveisDetalhes.map((comb) => [comb.id, comb]),
    );

    // Calcular totais
    const totalQuantidadeAbastecida = Number(
      abastecimentosAggregate._sum.quantidade?.toString() ?? 0,
    );
    const totalValorAbastecido = Number(
      abastecimentosAggregate._sum.valor_total?.toString() ?? 0,
    );

    const quantidadeMesAtual = Number(
      abastecimentosMesAtual._sum.quantidade?.toString() ?? 0,
    );
    const valorMesAtual = Number(
      abastecimentosMesAtual._sum.valor_total?.toString() ?? 0,
    );

    const quantidadeMesAnterior = Number(
      abastecimentosMesAnterior._sum.quantidade?.toString() ?? 0,
    );
    const valorMesAnterior = Number(
      abastecimentosMesAnterior._sum.valor_total?.toString() ?? 0,
    );

    const quantidadeUltimos30Dias = Number(
      abastecimentosUltimos30Dias._sum.quantidade?.toString() ?? 0,
    );
    const valorUltimos30Dias = Number(
      abastecimentosUltimos30Dias._sum.valor_total?.toString() ?? 0,
    );

    // Calcular crescimento
    const crescimentoQuantidade =
      quantidadeMesAnterior > 0
        ? ((quantidadeMesAtual - quantidadeMesAnterior) / quantidadeMesAnterior) * 100
        : quantidadeMesAtual > 0
          ? 100
          : 0;

    const crescimentoValor =
      valorMesAnterior > 0
        ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100
        : valorMesAtual > 0
          ? 100
          : 0;

    // Processar abastecimentos detalhados
    const abastecimentosDetalhados = abastecimentos.map((abastecimento) => ({
      id: abastecimento.id,
      data_abastecimento: abastecimento.data_abastecimento,
      posto: abastecimento.empresa?.nome ?? null,
      veiculo: {
        id: abastecimento.veiculo?.id ?? null,
        nome: abastecimento.veiculo?.nome ?? null,
        placa: abastecimento.veiculo?.placa ?? null,
      },
      prefeitura: {
        id: abastecimento.veiculo?.prefeitura?.id ?? null,
        nome: abastecimento.veiculo?.prefeitura?.nome ?? null,
      },
      orgao: {
        id: abastecimento.veiculo?.orgao?.id ?? null,
        nome: abastecimento.veiculo?.orgao?.nome ?? null,
        sigla: abastecimento.veiculo?.orgao?.sigla ?? null,
      },
      motorista: abastecimento.motorista?.nome ?? null,
      combustivel: {
        id: abastecimento.combustivel?.id ?? null,
        nome: abastecimento.combustivel?.nome ?? null,
        sigla: abastecimento.combustivel?.sigla ?? null,
      },
      quantidade: Number(abastecimento.quantidade?.toString() ?? 0),
      valor_total: Number(abastecimento.valor_total?.toString() ?? 0),
      preco_empresa: abastecimento.preco_empresa
        ? Number(abastecimento.preco_empresa.toString())
        : null,
      status: abastecimento.status,
    }));

    // Top veículos
    const veiculosOrdenados = [...groupVeiculos].sort((a, b) => {
      const aQuantidade = Number(a._sum.quantidade?.toString() ?? 0);
      const bQuantidade = Number(b._sum.quantidade?.toString() ?? 0);
      return bQuantidade - aQuantidade;
    });

    const topVeiculos = veiculosOrdenados.slice(0, 10).map((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      return {
        veiculoId: veiculo.veiculoId,
        nome: detalhes?.nome ?? null,
        placa: detalhes?.placa ?? null,
        quantidadeTotal: Number(veiculo._sum.quantidade?.toString() ?? 0),
        valorTotal: Number(veiculo._sum.valor_total?.toString() ?? 0),
        orgao: detalhes?.orgao?.nome ?? null,
        prefeitura: detalhes?.prefeitura?.nome ?? null,
      };
    });

    // Top combustíveis
    const combustiveisOrdenados = [...groupCombustiveis].sort((a, b) => {
      const aValor = Number(a._sum.valor_total?.toString() ?? 0);
      const bValor = Number(b._sum.valor_total?.toString() ?? 0);
      return bValor - aValor;
    });

    const topCombustiveis = combustiveisOrdenados.map((combustivel) => {
      const detalhes = combustiveisDetalhesMap.get(combustivel.combustivelId);
      const quantidade = Number(combustivel._sum.quantidade?.toString() ?? 0);
      const valor = Number(combustivel._sum.valor_total?.toString() ?? 0);
      return {
        combustivelId: combustivel.combustivelId,
        nome: detalhes?.nome ?? null,
        sigla: detalhes?.sigla ?? null,
        quantidadeTotal: quantidade,
        valorTotal: valor,
        percentualQuantidade:
          totalQuantidadeAbastecida > 0
            ? Number(((quantidade / totalQuantidadeAbastecida) * 100).toFixed(2))
            : 0,
        percentualValor:
          totalValorAbastecido > 0
            ? Number(((valor / totalValorAbastecido) * 100).toFixed(2))
            : 0,
      };
    });

    // Estatísticas por status
    const estatisticasPorStatus = groupStatus.map((item) => ({
      status: item.status,
      quantidade: item._count.id,
      quantidadeLitros: Number(item._sum.quantidade?.toString() ?? 0),
      valorTotal: Number(item._sum.valor_total?.toString() ?? 0),
    }));

    // Consumo por órgão
    const orgaosQuantidadeMap = new Map<
      number,
      {
        orgaoId: number;
        orgaoNome: string;
        orgaoSigla: string | null;
        quantidadeTotal: number;
        valorTotal: number;
      }
    >();

    veiculosOrdenados.forEach((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      const orgaoId = detalhes?.orgao?.id;
      if (!orgaoId) return;

      const quantidade = Number(veiculo._sum.quantidade?.toString() ?? 0);
      const valor = Number(veiculo._sum.valor_total?.toString() ?? 0);
      const existente = orgaosQuantidadeMap.get(orgaoId);
      if (existente) {
        existente.quantidadeTotal += quantidade;
        existente.valorTotal += valor;
      } else {
        orgaosQuantidadeMap.set(orgaoId, {
          orgaoId,
          orgaoNome: detalhes?.orgao?.nome ?? '',
          orgaoSigla: detalhes?.orgao?.sigla ?? null,
          quantidadeTotal: quantidade,
          valorTotal: valor,
        });
      }
    });

    const consumoPorOrgao = Array.from(orgaosQuantidadeMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);

    // Consumo por prefeitura
    const prefeiturasMap = new Map<
      number,
      {
        prefeituraId: number;
        prefeituraNome: string;
        quantidadeTotal: number;
        valorTotal: number;
        veiculosCount: number;
      }
    >();

    veiculosOrdenados.forEach((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      const prefeituraId = detalhes?.prefeitura?.id;
      if (!prefeituraId) return;

      const quantidade = Number(veiculo._sum.quantidade?.toString() ?? 0);
      const valor = Number(veiculo._sum.valor_total?.toString() ?? 0);
      const existente = prefeiturasMap.get(prefeituraId);
      if (existente) {
        existente.quantidadeTotal += quantidade;
        existente.valorTotal += valor;
        existente.veiculosCount += 1;
      } else {
        prefeiturasMap.set(prefeituraId, {
          prefeituraId,
          prefeituraNome: detalhes?.prefeitura?.nome ?? '',
          quantidadeTotal: quantidade,
          valorTotal: valor,
          veiculosCount: 1,
        });
      }
    });

    const consumoPorPrefeitura = Array.from(prefeiturasMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);

    // Calcular ticket médio
    const ticketMedio =
      totalAbastecimentos > 0 ? totalValorAbastecido / totalAbastecimentos : 0;
    const ticketMedioMesAtual =
      abastecimentosMesAtual._sum.valor_total && abastecimentosMesAtual._sum.quantidade
        ? Number(abastecimentosMesAtual._sum.valor_total.toString()) /
          Number(abastecimentosMesAtual._sum.quantidade.toString())
        : 0;

    return {
      empresaId,
      usuario: {
        id: user?.id ?? null,
        nome: user?.nome ?? user?.email ?? 'Usuário',
        email: user?.email ?? null,
      },
      cards: {
        totalAbastecimentos,
        abastecimentosAprovados,
        abastecimentosAguardando,
        abastecimentosRejeitados,
        veiculosAbastecidos: veiculosDistinct.length,
        motoristasAtendidos: motoristasDistinct.length,
        prefeiturasAtendidas: prefeiturasDistinct,
        contratosVinculados: contratosCount,
        contratosAtivos,
        totalQuantidadeAbastecida: Number(totalQuantidadeAbastecida.toFixed(2)),
        totalValorAbastecido: Number(totalValorAbastecido.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
      },
      periodo: {
        mesAtual: {
          quantidade: Number(quantidadeMesAtual.toFixed(2)),
          valor: Number(valorMesAtual.toFixed(2)),
          ticketMedio: Number(ticketMedioMesAtual.toFixed(2)),
        },
        mesAnterior: {
          quantidade: Number(quantidadeMesAnterior.toFixed(2)),
          valor: Number(valorMesAnterior.toFixed(2)),
        },
        ultimos30Dias: {
          quantidade: Number(quantidadeUltimos30Dias.toFixed(2)),
          valor: Number(valorUltimos30Dias.toFixed(2)),
        },
        crescimento: {
          quantidade: Number(crescimentoQuantidade.toFixed(2)),
          valor: Number(crescimentoValor.toFixed(2)),
        },
      },
      abastecimentos: {
        totalRegistros: abastecimentos.length,
        limiteAplicado: limit,
        dados: abastecimentosDetalhados,
      },
      estatisticasPorStatus,
      topVeiculos,
      topCombustiveis,
      consumoPorOrgao,
      consumoPorPrefeitura,
    };
  }
}

