import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import {
  StatusAbastecimento,
  StatusSolicitacao,
  StatusProcesso,
  TipoContrato,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém o prefeituraId do usuário
   */
  private obterPrefeituraId(user: any): number {
    const prefeituraId = user?.prefeitura?.id ?? user?.prefeituraId;
    if (!prefeituraId) {
      throw new ForbiddenException('Usuário não está vinculado a uma prefeitura.');
    }
    return prefeituraId;
  }

  /**
   * Obtém o empresaId do usuário
   */
  private obterEmpresaId(user: any): number {
    const empresaId = user?.empresa?.id ?? user?.empresaId;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não está vinculado a uma empresa.');
    }
    return empresaId;
  }

  /**
   * Constrói filtros baseados no DTO e no tipo de usuário
   */
  private construirFiltrosAbastecimento(
    prefeituraId: number,
    empresaId?: number,
    filter?: FilterRelatorioDto,
  ): Prisma.AbastecimentoWhereInput {
    const where: Prisma.AbastecimentoWhereInput = {
      ativo: true,
      veiculo: {
        prefeituraId,
      },
    };

    if (empresaId) {
      where.empresaId = empresaId;
    }

    if (filter?.dataInicio || filter?.dataFim) {
      where.data_abastecimento = {};
      if (filter.dataInicio) {
        where.data_abastecimento.gte = new Date(filter.dataInicio);
      }
      if (filter.dataFim) {
        where.data_abastecimento.lte = new Date(filter.dataFim);
      }
    }

    if (filter?.orgaoId) {
      where.veiculo = {
        prefeituraId,
        orgaoId: filter.orgaoId,
        ...(where.veiculo as any),
      };
    }

    if (filter?.combustivelId) {
      where.combustivelId = filter.combustivelId;
    }

    if (filter?.veiculoId) {
      where.veiculoId = filter.veiculoId;
    }

    return where;
  }

  /**
   * Constrói filtros para solicitações
   */
  private construirFiltrosSolicitacao(
    prefeituraId: number,
    empresaId?: number,
    filter?: FilterRelatorioDto,
  ): Prisma.SolicitacaoAbastecimentoWhereInput {
    const where: Prisma.SolicitacaoAbastecimentoWhereInput = {
      ativo: true,
      prefeituraId,
    };

    if (empresaId) {
      where.empresaId = empresaId;
    }

    if (filter?.dataInicio || filter?.dataFim) {
      where.data_solicitacao = {};
      if (filter.dataInicio) {
        where.data_solicitacao.gte = new Date(filter.dataInicio);
      }
      if (filter.dataFim) {
        where.data_solicitacao.lte = new Date(filter.dataFim);
      }
    }

    if (filter?.orgaoId) {
      where.veiculo = {
        orgaoId: filter.orgaoId,
      };
    }

    if (filter?.combustivelId) {
      where.combustivelId = filter.combustivelId;
    }

    if (filter?.veiculoId) {
      where.veiculoId = filter.veiculoId;
    }

    return where;
  }

  /**
   * Converte Decimal para número
   */
  private toNumber(value: Decimal | null | undefined): number {
    if (!value) return 0;
    return Number(value.toString());
  }

  /**
   * Calcula período anterior para comparação
   */
  private calcularPeriodoAnterior(dataInicio?: Date, dataFim?: Date): { inicio: Date; fim: Date } {
    const agora = new Date();
    const meses = 12; // Padrão: últimos 12 meses

    if (dataInicio && dataFim) {
      const duracao = dataFim.getTime() - dataInicio.getTime();
      return {
        inicio: new Date(dataInicio.getTime() - duracao),
        fim: dataInicio,
      };
    }

    // Se não especificado, usar últimos 12 meses
    const fim = dataFim || agora;
    const inicio = dataInicio || new Date(fim.getTime() - meses * 30 * 24 * 60 * 60 * 1000);

    const duracao = fim.getTime() - inicio.getTime();
    return {
      inicio: new Date(inicio.getTime() - duracao),
      fim: inicio,
    };
  }

  /**
   * Relatório para Admin Prefeitura
   */
  async getAdminPrefeituraRelatorio(user: any, filter?: FilterRelatorioDto) {
    const prefeituraId = this.obterPrefeituraId(user);
    const meses = filter?.meses || 12;

    // Calcular período
    const dataFim = filter?.dataFim ? new Date(filter.dataFim) : new Date();
    const dataInicio = filter?.dataInicio
      ? new Date(filter.dataInicio)
      : new Date(dataFim.getTime() - meses * 30 * 24 * 60 * 60 * 1000);

    const periodoAnterior = this.calcularPeriodoAnterior(dataInicio, dataFim);

    // Filtros
    const whereAbastecimento = this.construirFiltrosAbastecimento(prefeituraId, undefined, {
      ...filter,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
    });

    const whereSolicitacao = this.construirFiltrosSolicitacao(prefeituraId, undefined, {
      ...filter,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
    });

    // Buscar todos os dados em paralelo
    const [
      despesaAtual,
      despesaAnterior,
      litrosAtual,
      litrosAnterior,
      abastecimentosCount,
      solicitacoesStatus,
      taxaAprovacao,
      saldoCota,
      benchmarkPrecos,
      fluxoSolicitacoes,
      tendenciaAbastecimentos,
      mixCombustiveis,
      usoCotas,
      compliance,
      coberturaContratos,
      redeFornecedores,
      veiculosImpacto,
    ] = await Promise.all([
      // 1. Despesa com abastecimentos (atual)
      this.prisma.abastecimento.aggregate({
        where: whereAbastecimento,
        _sum: { valor_total: true },
      }),

      // 2. Despesa com abastecimentos (período anterior)
      this.prisma.abastecimento.aggregate({
        where: {
          ...this.construirFiltrosAbastecimento(prefeituraId, undefined, {
            dataInicio: periodoAnterior.inicio.toISOString(),
            dataFim: periodoAnterior.fim.toISOString(),
          }),
        },
        _sum: { valor_total: true },
      }),

      // 3. Litros abastecidos (atual)
      this.prisma.abastecimento.aggregate({
        where: whereAbastecimento,
        _sum: { quantidade: true },
        _count: { id: true },
      }),

      // 4. Litros abastecidos (período anterior)
      this.prisma.abastecimento.aggregate({
        where: {
          ...this.construirFiltrosAbastecimento(prefeituraId, undefined, {
            dataInicio: periodoAnterior.inicio.toISOString(),
            dataFim: periodoAnterior.fim.toISOString(),
          }),
        },
        _sum: { quantidade: true },
      }),

      // 5. Contagem de abastecimentos
      this.prisma.abastecimento.count({
        where: whereAbastecimento,
      }),

      // 6. Status das solicitações
      this.prisma.solicitacaoAbastecimento.groupBy({
        by: ['status'],
        where: whereSolicitacao,
        _count: { id: true },
      }),

      // 7. Taxa de aprovação
      this.calcularTaxaAprovacao(whereSolicitacao),

      // 8. Saldo de cota disponível
      this.calcularSaldoCota(prefeituraId, filter),

      // 9. Benchmark de preços
      this.calcularBenchmarkPrecos(prefeituraId, filter),

      // 10. Fluxo de solicitações
      this.calcularFluxoSolicitacoes(whereSolicitacao),

      // 11. Tendência de abastecimentos
      this.calcularTendenciaAbastecimentos(prefeituraId, dataInicio, dataFim, filter),

      // 12. Mix de combustíveis
      this.calcularMixCombustiveis(prefeituraId, whereAbastecimento),

      // 13. Uso de cotas
      this.calcularUsoCotas(prefeituraId, filter),

      // 14. Compliance e auditoria
      this.calcularCompliance(prefeituraId, filter),

      // 15. Cobertura de contratos
      this.calcularCoberturaContratos(prefeituraId, filter),

      // 16. Rede de fornecedores
      this.calcularRedeFornecedores(prefeituraId, whereAbastecimento),

      // 17. Veículos com maior impacto
      this.calcularVeiculosImpacto(prefeituraId, whereAbastecimento),
    ]);

    // Calcular ticket médio
    const ticketMedio =
      abastecimentosCount > 0
        ? this.toNumber(despesaAtual._sum.valor_total) / abastecimentosCount
        : 0;

    // Calcular variação
    const despesaAtualNum = this.toNumber(despesaAtual._sum.valor_total);
    const despesaAnteriorNum = this.toNumber(despesaAnterior._sum.valor_total);
    const variacaoDespesa = despesaAnteriorNum > 0 ? despesaAtualNum - despesaAnteriorNum : 0;

    const litrosAtualNum = this.toNumber(litrosAtual._sum.quantidade);
    const litrosAnteriorNum = this.toNumber(litrosAnterior._sum.quantidade);
    const variacaoLitros = litrosAnteriorNum > 0 ? litrosAtualNum - litrosAnteriorNum : 0;

    return {
      despesaAbastecimentos: {
        valor: despesaAtualNum,
        variacao: variacaoDespesa,
        periodoAnterior: despesaAnteriorNum,
      },
      litrosAbastecidos: {
        valor: litrosAtualNum,
        variacao: variacaoLitros,
        periodoAnterior: litrosAnteriorNum,
        quantidadeAbastecimentos: abastecimentosCount,
        ticketMedio: this.arredondar(ticketMedio, 2),
      },
      taxaAprovacao,
      saldoCota,
      benchmarkPrecos,
      fluxoSolicitacoes,
      tendenciaAbastecimentos,
      mixCombustiveis,
      usoCotas,
      compliance,
      coberturaContratos,
      redeFornecedores,
      veiculosImpacto,
    };
  }

  /**
   * Calcula taxa de aprovação
   */
  private async calcularTaxaAprovacao(
    where: Prisma.SolicitacaoAbastecimentoWhereInput,
  ): Promise<any> {
    const [total, aprovadas] = await Promise.all([
      this.prisma.solicitacaoAbastecimento.count({
        where: {
          ...where,
          status: {
            in: [StatusSolicitacao.PENDENTE, StatusSolicitacao.APROVADA, StatusSolicitacao.REJEITADA],
          },
        },
      }),
      this.prisma.solicitacaoAbastecimento.count({
        where: {
          ...where,
          status: StatusSolicitacao.APROVADA,
        },
      }),
    ]);

    const taxa = total > 0 ? (aprovadas / total) * 100 : 0;

    // Calcular tempo médio de resposta
    const solicitacoesAprovadas = await this.prisma.solicitacaoAbastecimento.findMany({
      where: {
        ...where,
        status: StatusSolicitacao.APROVADA,
        data_aprovacao: { not: null },
      },
      select: {
        data_solicitacao: true,
        data_aprovacao: true,
        valor_total: true,
      },
      take: 1000, // Limitar para performance
    });

    let tempoMedio = 0;
    if (solicitacoesAprovadas.length > 0) {
      const tempos = solicitacoesAprovadas
        .map((s) => {
          if (s.data_aprovacao) {
            return (s.data_aprovacao.getTime() - s.data_solicitacao.getTime()) / (1000 * 60 * 60); // horas
          }
          return 0;
        })
        .filter((t) => t > 0);
      tempoMedio = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    }

    const valorMedioAprovado =
      solicitacoesAprovadas.length > 0
        ? solicitacoesAprovadas.reduce(
            (sum, s) => sum + this.toNumber(s.valor_total),
            0,
          ) / solicitacoesAprovadas.length
        : 0;

    const pendentes = await this.prisma.solicitacaoAbastecimento.count({
      where: {
        ...where,
        status: StatusSolicitacao.PENDENTE,
      },
    });

    return {
      taxa: this.arredondar(taxa, 1),
      tempoMedio: this.arredondar(tempoMedio, 1),
      valorMedioAprovado: this.arredondar(valorMedioAprovado, 2),
      pendentes,
    };
  }

  /**
   * Calcula saldo de cota disponível
   */
  private async calcularSaldoCota(prefeituraId: number, filter?: FilterRelatorioDto): Promise<any> {
    const cotas = await this.prisma.cotaOrgao.findMany({
      where: {
        orgao: {
          prefeituraId,
        },
        ativa: true,
        ...(filter?.orgaoId && { orgaoId: filter.orgaoId }),
        ...(filter?.combustivelId && { combustivelId: filter.combustivelId }),
      },
      select: {
        quantidade: true,
        quantidade_utilizada: true,
        saldo_disponivel_cota: true,
        restante: true,
      },
    });

    const saldoTotal = cotas.reduce(
      (sum, cota) => sum + this.toNumber(cota.saldo_disponivel_cota || cota.restante),
      0,
    );
    const quantidadeTotal = cotas.reduce((sum, cota) => sum + this.toNumber(cota.quantidade), 0);
    const quantidadeUtilizada = cotas.reduce(
      (sum, cota) => sum + this.toNumber(cota.quantidade_utilizada),
      0,
    );
    const percentualUtilizado =
      quantidadeTotal > 0 ? (quantidadeUtilizada / quantidadeTotal) * 100 : 0;

    return {
      saldo: this.arredondar(saldoTotal, 1),
      quantidadeTotal: this.arredondar(quantidadeTotal, 1),
      quantidadeUtilizada: this.arredondar(quantidadeUtilizada, 1),
      percentualUtilizado: this.arredondar(percentualUtilizado, 1),
      coberturaDias: 0, // TODO: Calcular baseado no consumo médio
    };
  }

  /**
   * Calcula benchmark de preços
   */
  private async calcularBenchmarkPrecos(
    prefeituraId: number,
    filter?: FilterRelatorioDto,
  ): Promise<any> {
    // Buscar abastecimentos com preços
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: {
        ...this.construirFiltrosAbastecimento(prefeituraId, undefined, filter),
        preco_empresa: { not: null },
        preco_anp: { not: null },
      },
      select: {
        empresa: {
          select: {
            id: true,
            nome: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        preco_empresa: true,
        preco_anp: true,
      },
      take: 1000,
    });

    // Agrupar por empresa e combustível
    const benchmark: Record<
      string,
      {
        empresa: { id: number; nome: string };
        combustivel: { id: number; nome: string; sigla: string };
        precoPraticado: number;
        precoTeto: number;
        variacaoTeto: number;
        variacaoAnp: number;
        status: string;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const key = `${abastecimento.empresa.id}-${abastecimento.combustivel.id}`;
      const precoPraticado = this.toNumber(abastecimento.preco_empresa);
      const precoAnp = this.toNumber(abastecimento.preco_anp);

      // Buscar teto do processo ativo
      const processo = await this.prisma.processo.findFirst({
        where: {
          prefeituraId,
          status: StatusProcesso.ATIVO,
          ativo: true,
        },
        include: {
          combustiveis: {
            where: {
              combustivelId: abastecimento.combustivel.id,
            },
          },
        },
      });

      const precoTeto = processo?.combustiveis[0]?.valor_unitario
        ? this.toNumber(processo.combustiveis[0].valor_unitario)
        : precoAnp;

      const variacaoTeto = precoTeto > 0 ? ((precoPraticado - precoTeto) / precoTeto) * 100 : 0;
      const variacaoAnp = precoAnp > 0 ? ((precoPraticado - precoAnp) / precoAnp) * 100 : 0;

      let status = 'Dentro do teto';
      if (variacaoTeto > 0) {
        status = 'Acima do teto';
      } else if (variacaoTeto < -5) {
        status = 'Abaixo do teto';
      }

      if (!benchmark[key]) {
        benchmark[key] = {
          empresa: abastecimento.empresa,
          combustivel: abastecimento.combustivel,
          precoPraticado,
          precoTeto,
          variacaoTeto: this.arredondar(variacaoTeto, 1),
          variacaoAnp: this.arredondar(variacaoAnp, 1),
          status,
        };
      }
    }

    const valores = Object.values(benchmark);
    const acimaTeto = valores.filter((v) => v.status === 'Acima do teto').length;
    const dentroTeto = valores.filter((v) => v.status === 'Dentro do teto').length;
    const abaixoTeto = valores.filter((v) => v.status === 'Abaixo do teto').length;

    return {
      resumo: {
        acimaTeto,
        dentroTeto,
        abaixoTeto,
      },
      detalhes: valores,
    };
  }

  /**
   * Calcula fluxo de solicitações
   */
  private async calcularFluxoSolicitacoes(
    where: Prisma.SolicitacaoAbastecimentoWhereInput,
  ): Promise<any> {
    const [pendentes, aprovadas, rejeitadas] = await Promise.all([
      this.prisma.solicitacaoAbastecimento.count({
        where: { ...where, status: StatusSolicitacao.PENDENTE },
      }),
      this.prisma.solicitacaoAbastecimento.count({
        where: { ...where, status: StatusSolicitacao.APROVADA },
      }),
      this.prisma.solicitacaoAbastecimento.count({
        where: { ...where, status: StatusSolicitacao.REJEITADA },
      }),
    ]);

    // Motivos de rejeição
    const rejeicoes = await this.prisma.solicitacaoAbastecimento.findMany({
      where: {
        ...where,
        status: StatusSolicitacao.REJEITADA,
        motivo_rejeicao: { not: null },
      },
      select: {
        motivo_rejeicao: true,
      },
      take: 1000,
    });

    const motivos: Record<string, number> = {};
    for (const rejeicao of rejeicoes) {
      const motivo = rejeicao.motivo_rejeicao || 'Sem motivo';
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    }

    const principaisMotivos = Object.entries(motivos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([motivo, count]) => ({ motivo, quantidade: count }));

    return {
      pendentes,
      aprovadas,
      rejeitadas,
      principaisMotivos,
    };
  }

  /**
   * Calcula tendência de abastecimentos
   */
  private async calcularTendenciaAbastecimentos(
    prefeituraId: number,
    dataInicio: Date,
    dataFim: Date,
    filter?: FilterRelatorioDto,
  ): Promise<any> {
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: {
        ...this.construirFiltrosAbastecimento(prefeituraId, undefined, {
          ...filter,
          dataInicio: dataInicio.toISOString(),
          dataFim: dataFim.toISOString(),
        }),
        data_abastecimento: { not: null },
      },
      select: {
        data_abastecimento: true,
        quantidade: true,
        valor_total: true,
      },
      orderBy: {
        data_abastecimento: 'asc',
      },
    });

    // Agrupar por mês
    const porMes: Record<string, { litros: number; valor: number }> = {};

    for (const abastecimento of abastecimentos) {
      if (abastecimento.data_abastecimento) {
        const mes = abastecimento.data_abastecimento.toISOString().substring(0, 7); // YYYY-MM
        if (!porMes[mes]) {
          porMes[mes] = { litros: 0, valor: 0 };
        }
        porMes[mes].litros += this.toNumber(abastecimento.quantidade);
        porMes[mes].valor += this.toNumber(abastecimento.valor_total);
      }
    }

    const tendencia = Object.entries(porMes)
      .map(([mes, dados]) => ({
        mes,
        litros: this.arredondar(dados.litros, 2),
        valor: this.arredondar(dados.valor, 2),
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    return tendencia;
  }

  /**
   * Calcula mix de combustíveis
   */
  private async calcularMixCombustiveis(
    prefeituraId: number,
    where: Prisma.AbastecimentoWhereInput,
  ): Promise<any> {
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where,
      select: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        quantidade: true,
        valor_total: true,
      },
    });

    const porCombustivel: Record<
      number,
      {
        combustivel: { id: number; nome: string; sigla: string };
        litros: number;
        valor: number;
      }
    > = {};

    let totalLitros = 0;
    let totalValor = 0;

    for (const abastecimento of abastecimentos) {
      const id = abastecimento.combustivel.id;
      if (!porCombustivel[id]) {
        porCombustivel[id] = {
          combustivel: abastecimento.combustivel,
          litros: 0,
          valor: 0,
        };
      }
      const litros = this.toNumber(abastecimento.quantidade);
      const valor = this.toNumber(abastecimento.valor_total);
      porCombustivel[id].litros += litros;
      porCombustivel[id].valor += valor;
      totalLitros += litros;
      totalValor += valor;
    }

    const mix = Object.values(porCombustivel).map((item) => ({
      ...item,
      litros: this.arredondar(item.litros, 1),
      valor: this.arredondar(item.valor, 2),
      percentualLitros:
        totalLitros > 0 ? this.arredondar((item.litros / totalLitros) * 100, 1) : 0,
      percentualValor: totalValor > 0 ? this.arredondar((item.valor / totalValor) * 100, 1) : 0,
    }));

    return {
      totalLitros: this.arredondar(totalLitros, 1),
      totalValor: this.arredondar(totalValor, 2),
      mix: mix.sort((a, b) => b.litros - a.litros),
    };
  }

  /**
   * Calcula uso de cotas
   */
  private async calcularUsoCotas(prefeituraId: number, filter?: FilterRelatorioDto): Promise<any> {
    const cotas = await this.prisma.cotaOrgao.findMany({
      where: {
        orgao: {
          prefeituraId,
        },
        ativa: true,
        ...(filter?.orgaoId && { orgaoId: filter.orgaoId }),
        ...(filter?.combustivelId && { combustivelId: filter.combustivelId }),
      },
      include: {
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
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

    const uso = cotas.map((cota) => {
      const quantidade = this.toNumber(cota.quantidade);
      const utilizada = this.toNumber(cota.quantidade_utilizada);
      const disponivel = this.toNumber(cota.saldo_disponivel_cota || cota.restante);
      const percentual = quantidade > 0 ? (utilizada / quantidade) * 100 : 0;

      let status = 'Regular';
      if (percentual >= 100) {
        status = 'Crítico';
      } else if (percentual >= 80) {
        status = 'Atenção';
      }

      return {
        orgao: cota.orgao,
        combustivel: cota.combustivel,
        quantidade: this.arredondar(quantidade, 1),
        utilizada: this.arredondar(utilizada, 1),
        disponivel: this.arredondar(disponivel, 1),
        percentual: this.arredondar(percentual, 1),
        coberturaDias: 0, // TODO: Calcular baseado no consumo médio
        status,
      };
    });

    return uso.sort((a, b) => b.utilizada - a.utilizada);
  }

  /**
   * Calcula compliance e auditoria
   */
  private async calcularCompliance(prefeituraId: number, filter?: FilterRelatorioDto): Promise<any> {
    // Buscar abastecimentos sem NF-e nos últimos 72h
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 72);

    const abastecimentosSemNfe = await this.prisma.abastecimento.findMany({
      where: {
        ...this.construirFiltrosAbastecimento(prefeituraId, undefined, filter),
        data_abastecimento: {
          gte: dataLimite,
        },
        OR: [
          { nfe_chave_acesso: null },
          { nfe_chave_acesso: '' },
        ],
      },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      take: 100,
    });

    const empresasSemNfe = new Map<number, { empresa: any; quantidade: number }>();
    for (const abastecimento of abastecimentosSemNfe) {
      const empresaId = abastecimento.empresa.id;
      if (!empresasSemNfe.has(empresaId)) {
        empresasSemNfe.set(empresaId, {
          empresa: abastecimento.empresa,
          quantidade: 0,
        });
      }
      empresasSemNfe.get(empresaId)!.quantidade++;
    }

    const alertas = Array.from(empresasSemNfe.values()).map((item) => ({
      tipo: 'NF-e pendente',
      descricao: `Fornecedor ${item.empresa.nome} sem envio de notas fiscais nos últimos 72h`,
      status: 'Risco moderado',
      responsavel: 'Financeiro',
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      quantidade: item.quantidade,
    }));

    return {
      riscos: {
        alto: alertas.filter((a) => a.status === 'Risco alto').length,
        medio: alertas.filter((a) => a.status === 'Risco moderado').length,
        baixo: alertas.filter((a) => a.status === 'Risco baixo').length,
      },
      alertas,
    };
  }

  /**
   * Calcula cobertura de contratos
   */
  private async calcularCoberturaContratos(
    prefeituraId: number,
    filter?: FilterRelatorioDto,
  ): Promise<any> {
    const processos = await this.prisma.processo.findMany({
      where: {
        prefeituraId,
        ativo: true,
        status: StatusProcesso.ATIVO,
      },
      include: {
        combustiveis: {
          include: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        cotasOrgao: {
          include: {
            abastecimentos: {
              include: {
                empresa: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
              take: 100,
            },
          },
        },
      },
    });

    const cobertura = await Promise.all(
      processos.map(async (processo) => {
        const litrosDesejados = this.toNumber(processo.litros_desejados);
        const valorUtilizado = this.toNumber(processo.valor_utilizado);
        const valorDisponivel = this.toNumber(processo.valor_disponivel);
        const valorPrevisto = valorDisponivel + valorUtilizado;

        const execucaoFinanceira = valorPrevisto > 0 ? (valorUtilizado / valorPrevisto) * 100 : 0;
        const economia = valorPrevisto - valorUtilizado;

        // Calcular saldo de litros (aproximado)
        const saldoLitros = processo.combustiveis.reduce((sum, pc) => {
          return sum + (pc.saldo_disponivel_processo ? this.toNumber(pc.saldo_disponivel_processo) : 0);
        }, 0);

        // Buscar fornecedor mais frequente dos abastecimentos relacionados
        const empresasMap = new Map<number, { nome: string; count: number }>();
        for (const cota of processo.cotasOrgao) {
          for (const abastecimento of cota.abastecimentos) {
            const empresaId = abastecimento.empresa.id;
            if (!empresasMap.has(empresaId)) {
              empresasMap.set(empresaId, {
                nome: abastecimento.empresa.nome,
                count: 0,
              });
            }
            empresasMap.get(empresaId)!.count++;
          }
        }

        const fornecedorMaisFrequente = Array.from(empresasMap.entries())
          .sort(([, a], [, b]) => b.count - a.count)[0];

        return {
          processo: {
            id: processo.id,
            numero: processo.numero_processo,
          },
          fornecedor: fornecedorMaisFrequente
            ? fornecedorMaisFrequente[1].nome
            : 'Não informado',
          executado: this.arredondar(valorUtilizado, 2),
          saldoLitros: this.arredondar(saldoLitros, 1),
          status: execucaoFinanceira < 100 ? 'Regular' : 'Crítico',
          vigencia: processo.data_encerramento.toISOString().split('T')[0],
          execucaoFinanceira: this.arredondar(execucaoFinanceira, 1),
          economia: this.arredondar(economia, 2),
          percentualEconomia: valorPrevisto > 0 ? this.arredondar((economia / valorPrevisto) * 100, 1) : 0,
        };
      }),
    );

    const totalExecutado = cobertura.reduce((sum, c) => sum + c.executado, 0);
    const totalSaldoLitros = cobertura.reduce((sum, c) => sum + c.saldoLitros, 0);
    const totalEconomia = cobertura.reduce((sum, c) => sum + c.economia, 0);

    return {
      execucaoFinanceira: cobertura.length > 0
        ? this.arredondar(
            cobertura.reduce((sum, c) => sum + c.execucaoFinanceira, 0) / cobertura.length,
            1,
          )
        : 0,
      economia: this.arredondar(totalEconomia, 2),
      saldoLitros: this.arredondar(totalSaldoLitros, 1),
      processos: cobertura,
    };
  }

  /**
   * Calcula rede de fornecedores
   */
  private async calcularRedeFornecedores(
    prefeituraId: number,
    where: Prisma.AbastecimentoWhereInput,
  ): Promise<any> {
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    const porEmpresa: Record<
      number,
      {
        empresa: any;
        litros: number;
        valor: number;
        quantidade: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const id = abastecimento.empresa.id;
      if (!porEmpresa[id]) {
        porEmpresa[id] = {
          empresa: abastecimento.empresa,
          litros: 0,
          valor: 0,
          quantidade: 0,
        };
      }
      porEmpresa[id].litros += this.toNumber(abastecimento.quantidade);
      porEmpresa[id].valor += this.toNumber(abastecimento.valor_total);
      porEmpresa[id].quantidade++;
    }

    const fornecedores = Object.values(porEmpresa).map((item) => ({
      empresa: item.empresa,
      litros: this.arredondar(item.litros, 1),
      valor: this.arredondar(item.valor, 2),
      quantidade: item.quantidade,
      ticketMedio: item.quantidade > 0 ? this.arredondar(item.valor / item.quantidade, 2) : 0,
      precoMedio: item.litros > 0 ? this.arredondar(item.valor / item.litros, 2) : 0,
      status: 'ativo',
    }));

    const totalLitros = fornecedores.reduce((sum, f) => sum + f.litros, 0);
    const totalValor = fornecedores.reduce((sum, f) => sum + f.valor, 0);

    return {
      quantidade: fornecedores.length,
      volumeMonitorado: {
        litros: this.arredondar(totalLitros, 1),
        valor: this.arredondar(totalValor, 2),
      },
      fornecedores: fornecedores.sort((a, b) => b.litros - a.litros),
    };
  }

  /**
   * Calcula veículos com maior impacto
   */
  private async calcularVeiculosImpacto(
    prefeituraId: number,
    where: Prisma.AbastecimentoWhereInput,
  ): Promise<any> {
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where,
      include: {
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
      },
    });

    const porVeiculo: Record<
      number,
      {
        veiculo: any;
        motorista: any;
        litros: number;
        valor: number;
        quantidade: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const id = abastecimento.veiculo.id;
      if (!porVeiculo[id]) {
        porVeiculo[id] = {
          veiculo: abastecimento.veiculo,
          motorista: abastecimento.motorista,
          litros: 0,
          valor: 0,
          quantidade: 0,
        };
      }
      porVeiculo[id].litros += this.toNumber(abastecimento.quantidade);
      porVeiculo[id].valor += this.toNumber(abastecimento.valor_total);
      porVeiculo[id].quantidade++;
    }

    const veiculos = Object.values(porVeiculo)
      .map((item) => ({
        veiculo: {
          id: item.veiculo.id,
          nome: item.veiculo.nome,
          placa: item.veiculo.placa,
        },
        motorista: item.motorista
          ? {
              id: item.motorista.id,
              nome: item.motorista.nome,
            }
          : null,
        orgao: item.veiculo.orgao,
        litros: this.arredondar(item.litros, 1),
        valor: this.arredondar(item.valor, 2),
        eficiencia: 0, // TODO: Calcular baseado em odômetro
        variacao: 0, // TODO: Comparar com período anterior
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Top 10

    return veiculos;
  }

  /**
   * Arredonda número para N casas decimais
   */
  private arredondar(valor: number, casas: number = 2): number {
    const multiplicador = Math.pow(10, casas);
    return Math.round(valor * multiplicador) / multiplicador;
  }

  // Métodos para outros tipos de usuários (serão implementados depois)
  async getColaboradorPrefeituraRelatorio(user: any, filter?: FilterRelatorioDto) {
    // Mesma lógica do admin, mas com filtros adicionais baseados no usuário
    return this.getAdminPrefeituraRelatorio(user, filter);
  }

  async getAdminEmpresaRelatorio(user: any, filter?: FilterRelatorioDto) {
    const empresaId = this.obterEmpresaId(user);
    // Implementar lógica específica para empresa
    return {
      message: 'Relatório de empresa - em desenvolvimento',
    };
  }

  async getColaboradorEmpresaRelatorio(user: any, filter?: FilterRelatorioDto) {
    return this.getAdminEmpresaRelatorio(user, filter);
  }

  // Métodos para painel de faturamento
  async getPainelFaturamentoAdminPrefeitura(user: any, filter?: FilterRelatorioDto) {
    return {
      message: 'Painel de faturamento - em desenvolvimento',
    };
  }

  async getPainelFaturamentoColaboradorPrefeitura(user: any, filter?: FilterRelatorioDto) {
    return this.getPainelFaturamentoAdminPrefeitura(user, filter);
  }

  async getPainelFaturamentoAdminEmpresa(user: any, filter?: FilterRelatorioDto) {
    return {
      message: 'Painel de faturamento empresa - em desenvolvimento',
    };
  }

  async getPainelFaturamentoColaboradorEmpresa(user: any, filter?: FilterRelatorioDto) {
    return this.getPainelFaturamentoAdminEmpresa(user, filter);
  }
}

