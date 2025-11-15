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

    const [
      totalAbastecimentos,
      veiculosDistinct,
      motoristasDistinct,
      contratosCount,
      abastecimentosAggregate,
      abastecimentos,
      groupVeiculos,
    ] = await Promise.all([
      this.prisma.abastecimento.count({
        where: {
          empresaId,
        },
      }),
      this.prisma.abastecimento.findMany({
        where: {
          empresaId,
        },
        distinct: ['veiculoId'],
        select: {
          veiculoId: true,
        },
      }),
      this.prisma.abastecimento.findMany({
        where: {
          empresaId,
          motoristaId: {
            not: null,
          },
        },
        distinct: ['motoristaId'],
        select: {
          motoristaId: true,
        },
      }),
      this.prisma.contrato.count({
        where: { empresaId },
      }),
      this.prisma.abastecimento.aggregate({
        where: {
          empresaId,
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
      this.prisma.abastecimento.findMany({
        where: {
          empresaId,
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
      this.prisma.abastecimento.groupBy({
        by: ['veiculoId'],
        where: {
          empresaId,
        },
        _sum: {
          quantidade: true,
          valor_total: true,
        },
      }),
    ]);

    const veiculoIds = groupVeiculos.map((item) => item.veiculoId);
    const veiculosDetalhes = veiculoIds.length
      ? await this.prisma.veiculo.findMany({
          where: { id: { in: veiculoIds } },
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
        })
      : [];

    const veiculosDetalhesMap = new Map(
      veiculosDetalhes.map((veiculo) => [veiculo.id, veiculo]),
    );

    const totalQuantidadeAbastecida = Number(
      abastecimentosAggregate._sum.quantidade?.toString() ?? 0,
    );
    const totalValorAbastecido = Number(
      abastecimentosAggregate._sum.valor_total?.toString() ?? 0,
    );

    const abastecimentosDetalhados = abastecimentos.map((abastecimento) => ({
      id: abastecimento.id,
      data_abastecimento: abastecimento.data_abastecimento,
      posto: abastecimento.empresa?.nome ?? null,
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

    const veiculosOrdenados = [...groupVeiculos].sort((a, b) => {
      const aQuantidade = Number(a._sum.quantidade?.toString() ?? 0);
      const bQuantidade = Number(b._sum.quantidade?.toString() ?? 0);
      return bQuantidade - aQuantidade;
    });

    const topVeiculos = veiculosOrdenados.slice(0, 5).map((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      return {
        veiculoId: veiculo.veiculoId,
        nome: detalhes?.nome ?? null,
        placa: detalhes?.placa ?? null,
        quantidadeTotal: Number(veiculo._sum.quantidade?.toString() ?? 0),
        valorTotal: Number(veiculo._sum.valor_total?.toString() ?? 0),
      };
    });

    const orgaosQuantidadeMap = new Map<
      number,
      {
        orgaoId: number;
        orgaoNome: string;
        quantidadeTotal: number;
      }
    >();

    veiculosOrdenados.forEach((veiculo) => {
      const detalhes = veiculosDetalhesMap.get(veiculo.veiculoId);
      const orgaoId = detalhes?.orgao?.id;
      if (!orgaoId) {
        return;
      }
      const quantidade = Number(veiculo._sum.quantidade?.toString() ?? 0);
      const existente = orgaosQuantidadeMap.get(orgaoId);
      if (existente) {
        existente.quantidadeTotal += quantidade;
      } else {
        orgaosQuantidadeMap.set(orgaoId, {
          orgaoId,
          orgaoNome: detalhes?.orgao?.nome ?? '',
          quantidadeTotal: quantidade,
        });
      }
    });

    return {
      empresaId,
      usuario: {
        id: user?.id ?? null,
        nome: user?.nome ?? user?.email ?? 'Usuário',
        email: user?.email ?? null,
      },
      cards: {
        totalAbastecimentos,
        veiculosAbastecidos: veiculosDistinct.length,
        motoristasAtendidos: motoristasDistinct.length,
        contratosVinculados: contratosCount,
        totalQuantidadeAbastecida,
        totalValorAbastecido,
      },
      abastecimentos: {
        totalRegistros: abastecimentos.length,
        limiteAplicado: limit,
        dados: abastecimentosDetalhados,
      },
      topVeiculos,
      consumoPorOrgao: Array.from(orgaosQuantidadeMap.values()),
    };
  }
}

