import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AcaoLog } from '@prisma/client';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 10,
    tabela?: string,
    acao?: AcaoLog,
    executadoPor?: number,
    dataInicial?: string,
    dataFinal?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (tabela) {
      where.tabela = {
        contains: tabela,
        mode: 'insensitive' as any,
      };
    }

    if (acao) {
      where.acao = acao;
    }

    if (executadoPor) {
      where.executado_por = executadoPor;
    }

    if (dataInicial || dataFinal) {
      where.executado_em = {};
      if (dataInicial) {
        where.executado_em.gte = new Date(dataInicial);
      }
      if (dataFinal) {
        where.executado_em.lte = new Date(dataFinal);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.logsAlteracoes.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          executado_em: 'desc',
        },
      }),
      this.prisma.logsAlteracoes.count({ where }),
    ]);

    return {
      message: 'Logs encontrados com sucesso',
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const log = await this.prisma.logsAlteracoes.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log não encontrado');
    }

    return {
      message: 'Log encontrado com sucesso',
      log,
    };
  }

  async findByTabela(tabela: string, registroId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.logsAlteracoes.findMany({
        where: {
          tabela,
          registro_id: registroId,
        },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          executado_em: 'desc',
        },
      }),
      this.prisma.logsAlteracoes.count({
        where: {
          tabela,
          registro_id: registroId,
        },
      }),
    ]);

    return {
      message: 'Logs encontrados com sucesso',
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTabelasDisponiveis() {
    const tabelas = await this.prisma.logsAlteracoes.findMany({
      select: {
        tabela: true,
      },
      distinct: ['tabela'],
      orderBy: {
        tabela: 'asc',
      },
    });

    return {
      message: 'Tabelas disponíveis encontradas',
      tabelas: tabelas.map(t => t.tabela),
    };
  }

  async getEstatisticas() {
    const [total, porAcao, porTabela] = await Promise.all([
      this.prisma.logsAlteracoes.count(),
      this.prisma.logsAlteracoes.groupBy({
        by: ['acao'],
        _count: {
          id: true,
        },
      }),
      this.prisma.logsAlteracoes.groupBy({
        by: ['tabela'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      message: 'Estatísticas de logs encontradas',
      estatisticas: {
        total,
        porAcao: porAcao.map(item => ({
          acao: item.acao,
          quantidade: item._count.id,
        })),
        topTabelas: porTabela.map(item => ({
          tabela: item.tabela,
          quantidade: item._count.id,
        })),
      },
    };
  }
}
