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

    // Calcular período baseado nos filtros
    let dataInicio: Date;
    let dataFim: Date;

    if (filter?.dataInicio && filter?.dataFim) {
      dataInicio = new Date(filter.dataInicio);
      dataFim = new Date(filter.dataFim);
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Se não especificado, usar mês atual
      const agora = new Date();
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Filtros para abastecimentos aprovados
    const whereAbastecimento = this.construirFiltrosAbastecimento(prefeituraId, undefined, {
      ...filter,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
    });
    whereAbastecimento.status = StatusAbastecimento.Aprovado;

    // Buscar processo ativo
    const processoAtivo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        status: StatusProcesso.ATIVO,
        ativo: true,
        tipo_contrato: TipoContrato.OBJETIVO,
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
      },
    });

    // Calcular KPIs do processo ativo
    const processoAtivoKpis = processoAtivo
      ? processoAtivo.combustiveis.map((pc) => {
          const quantidadeTotal = this.toNumber(pc.quantidade_litros);
          const saldoDisponivel = pc.saldo_disponivel_processo
            ? this.toNumber(pc.saldo_disponivel_processo)
            : 0;
          const quantidadeUsada = quantidadeTotal - saldoDisponivel;
          const percentualUtilizado =
            quantidadeTotal > 0 ? (quantidadeUsada / quantidadeTotal) * 100 : 0;

          return {
            combustivel: {
              id: pc.combustivel.id,
              nome: pc.combustivel.nome,
              sigla: pc.combustivel.sigla,
            },
            usado: this.arredondar(quantidadeUsada, 1),
            total: this.arredondar(quantidadeTotal, 1),
            percentual_utilizado: this.arredondar(percentualUtilizado, 1),
          };
        })
      : [];

    // Buscar todos os abastecimentos para análises
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: whereAbastecimento,
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            uf: true,
            endereco_completo: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
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
                sigla: true,
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
      orderBy: {
        data_abastecimento: 'asc',
      },
    });

    // 1. Consumo por Órgãos (gráfico de barras)
    const consumoPorOrgao: Record<
      number,
      {
        orgao: { id: number; nome: string; sigla: string };
        litros: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const orgaoId = abastecimento.veiculo.orgao?.id;
      if (!orgaoId) continue;

      if (!consumoPorOrgao[orgaoId]) {
        consumoPorOrgao[orgaoId] = {
          orgao: abastecimento.veiculo.orgao!,
          litros: 0,
        };
      }
      consumoPorOrgao[orgaoId].litros += this.toNumber(abastecimento.quantidade);
    }

    const consumoPorOrgaoArray = Object.values(consumoPorOrgao)
      .map((item) => ({
        orgao_nome: item.orgao.nome,
        litros: this.arredondar(item.litros, 1),
      }))
      .sort((a, b) => b.litros - a.litros);

    // 2. Abastecimentos ao Longo do Tempo (gráfico de linha)
    const abastecimentosPorPeriodo: Record<string, number> = {};
    for (const abastecimento of abastecimentos) {
      if (!abastecimento.data_abastecimento) continue;
      const data = new Date(abastecimento.data_abastecimento);
      const chave = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!abastecimentosPorPeriodo[chave]) {
        abastecimentosPorPeriodo[chave] = 0;
      }
      abastecimentosPorPeriodo[chave] += this.toNumber(abastecimento.quantidade);
    }

    const evolucaoAbastecimentos = Object.entries(abastecimentosPorPeriodo)
      .map(([data, litros]) => ({
        data,
        litros: this.arredondar(litros, 1),
      }))
      .sort((a, b) => {
        const [diaA, mesA] = a.data.split('/').map(Number);
        const [diaB, mesB] = b.data.split('/').map(Number);
        if (mesA !== mesB) return mesA - mesB;
        return diaA - diaB;
      });

    // 3. Variação de Preços dos Combustíveis (gráfico de linha)
    const precosPorCombustivel: Record<
      number,
      Record<string, { preco: number; data: string }[]>
    > = {};

    for (const abastecimento of abastecimentos) {
      if (!abastecimento.data_abastecimento || !abastecimento.preco_empresa) continue;
      const combustivelId = abastecimento.combustivel.id;
      const data = new Date(abastecimento.data_abastecimento);
      const chave = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!precosPorCombustivel[combustivelId]) {
        precosPorCombustivel[combustivelId] = {};
      }
      if (!precosPorCombustivel[combustivelId][chave]) {
        precosPorCombustivel[combustivelId][chave] = [];
      }
      precosPorCombustivel[combustivelId][chave].push({
        preco: this.toNumber(abastecimento.preco_empresa),
        data: chave,
      });
    }

    const evolucaoPrecos = Object.entries(precosPorCombustivel).map(([combustivelIdStr, precos]) => {
      const combustivelId = Number(combustivelIdStr);
      const abastecimentoComCombustivel = abastecimentos.find(
        (a) => a.combustivel.id === combustivelId,
      );
      const combustivel = abastecimentoComCombustivel?.combustivel;
      const precosMedios = Object.entries(precos).map(([data, valores]) => {
        const precoMedio =
          valores.reduce((sum, v) => sum + v.preco, 0) / valores.length;
        return {
          data,
          preco: this.arredondar(precoMedio, 2),
        };
      });
      return {
        combustivel: {
          id: combustivel?.id || 0,
          nome: combustivel?.nome || '',
          sigla: combustivel?.sigla || '',
        },
        precos: precosMedios.sort((a, b) => {
          const [diaA, mesA] = a.data.split('/').map(Number);
          const [diaB, mesB] = b.data.split('/').map(Number);
          if (mesA !== mesB) return mesA - mesB;
          return diaA - diaB;
        }),
      };
    });

    // 4. Top 10 veículos por quantidade abastecida
    const porVeiculo: Record<
      number,
      {
        veiculo: { id: number; nome: string; placa: string };
        litros: number;
        valor: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const veiculoId = abastecimento.veiculo.id;
      if (!porVeiculo[veiculoId]) {
        porVeiculo[veiculoId] = {
          veiculo: abastecimento.veiculo,
          litros: 0,
          valor: 0,
        };
      }
      porVeiculo[veiculoId].litros += this.toNumber(abastecimento.quantidade);
      porVeiculo[veiculoId].valor += this.toNumber(abastecimento.valor_total);
    }

    const topVeiculos = Object.values(porVeiculo)
      .map((item, index) => ({
        posicao: index + 1,
        placa: item.veiculo.placa,
        nome: item.veiculo.nome,
        litros: this.arredondar(item.litros, 1),
        valor: this.arredondar(item.valor, 2),
      }))
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 10);

    // 5. Top 10 motoristas por quantidade abastecida
    const porMotorista: Record<
      number,
      {
        motorista: { id: number; nome: string };
        litros: number;
        valor: number;
        abastecimentos: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      if (!abastecimento.motorista) continue;
      const motoristaId = abastecimento.motorista.id;
      if (!porMotorista[motoristaId]) {
        porMotorista[motoristaId] = {
          motorista: abastecimento.motorista,
          litros: 0,
          valor: 0,
          abastecimentos: 0,
        };
      }
      porMotorista[motoristaId].litros += this.toNumber(abastecimento.quantidade);
      porMotorista[motoristaId].valor += this.toNumber(abastecimento.valor_total);
      porMotorista[motoristaId].abastecimentos++;
    }

    const topMotoristas = Object.values(porMotorista)
      .map((item, index) => ({
        posicao: index + 1,
        nome: item.motorista.nome,
        litros: this.arredondar(item.litros, 1),
        valor: this.arredondar(item.valor, 2),
        abastecimentos: item.abastecimentos,
      }))
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 10);

    // 6. Top 10 veículos por quilometragem rodada (com odômetro)
    const veiculosComOdometro = abastecimentos
      .filter((a) => a.odometro && a.odometro > 0)
      .map((a) => ({
        veiculo: a.veiculo,
        odometro: a.odometro!,
        litros: this.toNumber(a.quantidade),
      }));

    const porVeiculoOdometro: Record<
      number,
      {
        veiculo: { id: number; nome: string; placa: string };
        km: number;
        litros: number;
      }
    > = {};

    for (const item of veiculosComOdometro) {
      const veiculoId = item.veiculo.id;
      if (!porVeiculoOdometro[veiculoId]) {
        porVeiculoOdometro[veiculoId] = {
          veiculo: item.veiculo,
          km: item.odometro,
          litros: 0,
        };
      }
      porVeiculoOdometro[veiculoId].km = Math.max(porVeiculoOdometro[veiculoId].km, item.odometro);
      porVeiculoOdometro[veiculoId].litros += item.litros;
    }

    const topVeiculosOdometro = Object.values(porVeiculoOdometro)
      .map((item, index) => ({
        posicao: index + 1,
        placa: item.veiculo.placa,
        nome: item.veiculo.nome,
        km: item.km,
        litros: this.arredondar(item.litros, 1),
      }))
      .sort((a, b) => b.km - a.km)
      .slice(0, 10);

    // 7. Abastecimentos por Dia da Semana (gráfico de pizza)
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const porDiaSemana: Record<number, number> = {};

    for (const abastecimento of abastecimentos) {
      if (!abastecimento.data_abastecimento) continue;
      const data = new Date(abastecimento.data_abastecimento);
      const diaSemana = data.getDay();
      if (!porDiaSemana[diaSemana]) {
        porDiaSemana[diaSemana] = 0;
      }
      porDiaSemana[diaSemana] += this.toNumber(abastecimento.quantidade);
    }

    const totalLitrosSemana = Object.values(porDiaSemana).reduce((sum, litros) => sum + litros, 0);
    const distribuicaoPorDiaSemana = diasSemana.map((dia, index) => {
      const litros = porDiaSemana[index] || 0;
      const percentual = totalLitrosSemana > 0 ? (litros / totalLitrosSemana) * 100 : 0;
      return {
        dia,
        litros: this.arredondar(litros, 1),
        percentual: this.arredondar(percentual, 1),
      };
    });

    // 8. Redes Credenciadas (agrupado por localização e empresa)
    const porLocalizacaoEmpresa: Record<
      string,
      Record<
        number,
        {
          empresa: { id: number; nome: string; uf: string };
          combustiveis: Record<
            number,
            {
              combustivel: { id: number; nome: string; sigla: string };
              litros: number;
              valor: number;
            }
          >;
          totalValor: number;
        }
      >
    > = {};

    for (const abastecimento of abastecimentos) {
      // Extrair cidade do endereço completo ou usar UF como fallback
      const cidade = abastecimento.empresa.endereco_completo
        ? abastecimento.empresa.endereco_completo.split(',')[0] || 'Sem cidade'
        : 'Sem cidade';
      const localizacao = `${cidade} - ${abastecimento.empresa.uf}`;
      const empresaId = abastecimento.empresa.id;
      const combustivelId = abastecimento.combustivel.id;

      if (!porLocalizacaoEmpresa[localizacao]) {
        porLocalizacaoEmpresa[localizacao] = {};
      }
      if (!porLocalizacaoEmpresa[localizacao][empresaId]) {
        porLocalizacaoEmpresa[localizacao][empresaId] = {
          empresa: {
            id: abastecimento.empresa.id,
            nome: abastecimento.empresa.nome,
            uf: abastecimento.empresa.uf,
          },
          combustiveis: {},
          totalValor: 0,
        };
      }
      if (!porLocalizacaoEmpresa[localizacao][empresaId].combustiveis[combustivelId]) {
        porLocalizacaoEmpresa[localizacao][empresaId].combustiveis[combustivelId] = {
          combustivel: {
            id: abastecimento.combustivel.id,
            nome: abastecimento.combustivel.nome,
            sigla: abastecimento.combustivel.sigla,
          },
          litros: 0,
          valor: 0,
        };
      }

      const litros = this.toNumber(abastecimento.quantidade);
      const valor = this.toNumber(abastecimento.valor_total);
      porLocalizacaoEmpresa[localizacao][empresaId].combustiveis[combustivelId].litros += litros;
      porLocalizacaoEmpresa[localizacao][empresaId].combustiveis[combustivelId].valor += valor;
      porLocalizacaoEmpresa[localizacao][empresaId].totalValor += valor;
    }

    const redesCredenciadas = Object.entries(porLocalizacaoEmpresa).map(([localizacao, empresas]) => {
      const empresasArray = Object.values(empresas).map((empresa) => ({
        empresa_nome: empresa.empresa.nome,
        total_valor: this.arredondar(empresa.totalValor, 2),
        combustiveis: Object.values(empresa.combustiveis).map((comb) => ({
          combustivel_nome: comb.combustivel.nome,
          litros: this.arredondar(comb.litros, 1),
          valor: this.arredondar(comb.valor, 2),
        })),
      }));

      const totalLocalizacao = empresasArray.reduce((sum, e) => sum + e.total_valor, 0);

      return {
        localizacao,
        total_valor: this.arredondar(totalLocalizacao, 2),
        empresas: empresasArray,
      };
    });

    return {
      periodo: {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      },
      processo_ativo: processoAtivo
        ? {
            id: processoAtivo.id,
            numero_processo: processoAtivo.numero_processo,
            tipo_contrato: processoAtivo.tipo_contrato,
            kpis: processoAtivoKpis,
          }
        : null,
      consumo_por_orgao: consumoPorOrgaoArray,
      evolucao_abastecimentos: evolucaoAbastecimentos,
      evolucao_precos: evolucaoPrecos,
      top_veiculos: topVeiculos,
      top_motoristas: topMotoristas,
      top_veiculos_odometro: topVeiculosOdometro,
      distribuicao_por_dia_semana: distribuicaoPorDiaSemana,
      redes_credenciadas: redesCredenciadas,
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
    const prefeituraId = this.obterPrefeituraId(user);

    // Calcular período baseado nos filtros
    let dataInicio: Date;
    let dataFim: Date;

    if (filter?.dataInicio && filter?.dataFim) {
      dataInicio = new Date(filter.dataInicio);
      dataFim = new Date(filter.dataFim);
      // Ajustar para incluir o dia inteiro
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Se não especificado, usar mês atual
      const agora = new Date();
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Construir filtros para abastecimentos aprovados
    const whereAbastecimento: Prisma.AbastecimentoWhereInput = {
      ativo: true,
      status: StatusAbastecimento.Aprovado,
      veiculo: {
        prefeituraId,
      },
      data_abastecimento: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // Aplicar filtros adicionais
    if (filter?.orgaoId) {
      whereAbastecimento.veiculo = {
        prefeituraId,
        orgaoId: filter.orgaoId,
      };
    }

    if (filter?.combustivelId) {
      whereAbastecimento.combustivelId = filter.combustivelId;
    }

    if (filter?.veiculoId) {
      whereAbastecimento.veiculoId = filter.veiculoId;
    }

    if (filter?.empresaId) {
      whereAbastecimento.empresaId = filter.empresaId;
    }

    // Buscar todos os abastecimentos do período
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: whereAbastecimento,
      include: {
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
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    // Calcular overview
    const totalAbastecido = abastecimentos.reduce(
      (sum, a) => sum + this.toNumber(a.quantidade),
      0,
    );
    const valorGasto = abastecimentos.reduce(
      (sum, a) => sum + this.toNumber(a.valor_total),
      0,
    );
    const quantidadeAbastecimentos = abastecimentos.length;
    const ticketMedio = quantidadeAbastecimentos > 0 ? valorGasto / quantidadeAbastecimentos : 0;

    // Agrupar por empresa
    const porEmpresa: Record<
      number,
      {
        empresa: { id: number; nome: string };
        abastecimentos: number;
        litros: number;
        valor: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const empresaId = abastecimento.empresa.id;
      if (!porEmpresa[empresaId]) {
        porEmpresa[empresaId] = {
          empresa: abastecimento.empresa,
          abastecimentos: 0,
          litros: 0,
          valor: 0,
        };
      }
      porEmpresa[empresaId].abastecimentos++;
      porEmpresa[empresaId].litros += this.toNumber(abastecimento.quantidade);
      porEmpresa[empresaId].valor += this.toNumber(abastecimento.valor_total);
    }

    const faturamentoPorEmpresa = Object.values(porEmpresa)
      .map((item) => ({
        empresa_nome: item.empresa.nome,
        abastecimentos_count: item.abastecimentos,
        litros: this.arredondar(item.litros, 2),
        valor: this.arredondar(item.valor, 2),
      }))
      .sort((a, b) => b.valor - a.valor);

    // Agrupar por combustível
    const porCombustivel: Record<
      number,
      {
        combustivel: { id: number; nome: string; sigla: string };
        abastecimentos: number;
        litros: number;
        valor: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const combustivelId = abastecimento.combustivel.id;
      if (!porCombustivel[combustivelId]) {
        porCombustivel[combustivelId] = {
          combustivel: abastecimento.combustivel,
          abastecimentos: 0,
          litros: 0,
          valor: 0,
        };
      }
      porCombustivel[combustivelId].abastecimentos++;
      porCombustivel[combustivelId].litros += this.toNumber(abastecimento.quantidade);
      porCombustivel[combustivelId].valor += this.toNumber(abastecimento.valor_total);
    }

    const faturamentoPorCombustivel = Object.values(porCombustivel)
      .map((item) => ({
        combustivel_nome: item.combustivel.nome,
        abastecimentos_count: item.abastecimentos,
        litros: this.arredondar(item.litros, 2),
        valor: this.arredondar(item.valor, 2),
      }))
      .sort((a, b) => b.valor - a.valor);

    // Agrupar por órgão
    const porOrgao: Record<
      number,
      {
        orgao: { id: number; nome: string; sigla: string } | null;
        abastecimentos: number;
        litros: number;
        valor: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const orgaoId = abastecimento.veiculo.orgao?.id;
      if (!orgaoId) continue;

      if (!porOrgao[orgaoId]) {
        porOrgao[orgaoId] = {
          orgao: abastecimento.veiculo.orgao,
          abastecimentos: 0,
          litros: 0,
          valor: 0,
        };
      }
      porOrgao[orgaoId].abastecimentos++;
      porOrgao[orgaoId].litros += this.toNumber(abastecimento.quantidade);
      porOrgao[orgaoId].valor += this.toNumber(abastecimento.valor_total);
    }

    const faturamentoPorOrgao = Object.values(porOrgao)
      .map((item) => ({
        orgao_nome: item.orgao?.nome || 'Sem órgão',
        abastecimentos_count: item.abastecimentos,
        litros: this.arredondar(item.litros, 2),
        valor: this.arredondar(item.valor, 2),
      }))
      .sort((a, b) => b.valor - a.valor);

    // Agrupar por conta de faturamento
    const porConta: Record<
      number,
      {
        conta: { id: number; nome: string } | null;
        abastecimentos: number;
        litros: number;
        valor: number;
      }
    > = {};

    for (const abastecimento of abastecimentos) {
      const contaId = abastecimento.contaFaturamento?.id;
      if (!contaId) continue;

      if (!porConta[contaId]) {
        porConta[contaId] = {
          conta: abastecimento.contaFaturamento,
          abastecimentos: 0,
          litros: 0,
          valor: 0,
        };
      }
      porConta[contaId].abastecimentos++;
      porConta[contaId].litros += this.toNumber(abastecimento.quantidade);
      porConta[contaId].valor += this.toNumber(abastecimento.valor_total);
    }

    const faturamentoPorConta = Object.values(porConta)
      .map((item) => ({
        conta_nome: item.conta?.nome || 'Sem conta',
        abastecimentos_count: item.abastecimentos,
        litros: this.arredondar(item.litros, 2),
        valor: this.arredondar(item.valor, 2),
      }))
      .sort((a, b) => b.valor - a.valor);

    // Formatar período para exibição
    const meses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    const periodoFormatado = `${meses[dataInicio.getMonth()]} de ${dataInicio.getFullYear()}`;

    return {
      periodo: periodoFormatado,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      overview: {
        total_abastecido_litros: this.arredondar(totalAbastecido, 2),
        total_abastecimentos_count: quantidadeAbastecimentos,
        valor_gasto_total: this.arredondar(valorGasto, 2),
        ticket_medio: this.arredondar(ticketMedio, 2),
      },
      faturamento_por_empresa: faturamentoPorEmpresa,
      faturamento_por_combustivel: faturamentoPorCombustivel,
      faturamento_por_orgao: faturamentoPorOrgao,
      faturamento_por_conta: faturamentoPorConta,
    };
  }

  async getPainelFaturamentoColaboradorPrefeitura(user: any, filter?: FilterRelatorioDto) {
    return this.getPainelFaturamentoAdminPrefeitura(user, filter);
  }

  async getPainelFaturamentoAdminEmpresa(user: any, filter?: FilterRelatorioDto) {
    const empresaId = this.obterEmpresaId(user);

    // Calcular período baseado nos filtros
    let dataInicio: Date;
    let dataFim: Date;

    if (filter?.dataInicio && filter?.dataFim) {
      dataInicio = new Date(filter.dataInicio);
      dataFim = new Date(filter.dataFim);
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Se não especificado, usar últimos 7 dias
      const agora = new Date();
      dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 6, 0, 0, 0, 0);
    }

    // Construir filtros para abastecimentos aprovados da empresa
    const whereAbastecimento: Prisma.AbastecimentoWhereInput = {
      ativo: true,
      status: StatusAbastecimento.Aprovado,
      empresaId,
      data_abastecimento: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // Aplicar filtros adicionais
    if (filter?.prefeituraId || filter?.orgaoId) {
      whereAbastecimento.veiculo = {
        ...(whereAbastecimento.veiculo as any),
        ...(filter?.prefeituraId && { prefeituraId: filter.prefeituraId }),
        ...(filter?.orgaoId && { orgaoId: filter.orgaoId }),
      };
    }

    if (filter?.combustivelId) {
      whereAbastecimento.combustivelId = filter.combustivelId;
    }

    if (filter?.veiculoId) {
      whereAbastecimento.veiculoId = filter.veiculoId;
    }

    // Buscar todos os abastecimentos do período
    const abastecimentos = await this.prisma.abastecimento.findMany({
      where: whereAbastecimento,
      include: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
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
                sigla: true,
              },
            },
          },
        },
      },
    });

    // 1. CALCULAR OVERVIEW (Cards principais)
    const totalFaturado = abastecimentos.reduce(
      (sum, a) => sum + this.toNumber(a.valor_total),
      0,
    );
    const totalLitros = abastecimentos.reduce(
      (sum, a) => sum + this.toNumber(a.quantidade),
      0,
    );
    const quantidadeAbastecimentos = abastecimentos.length;
    const ticketMedio = quantidadeAbastecimentos > 0 ? totalFaturado / quantidadeAbastecimentos : 0;

    // 2. FATURAMENTO POR PERÍODO (Últimos 7 dias)
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const faturamentoPorDia: Record<string, { faturamento: number; meta: number }> = {};

    // Inicializar todos os dias do período
    const periodoDias: Date[] = [];
    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
      periodoDias.push(new Date(d));
    }

    periodoDias.forEach((dia) => {
      const chave = dia.toISOString().split('T')[0];
      faturamentoPorDia[chave] = { faturamento: 0, meta: 0 };
    });

    // Calcular faturamento real por dia
    abastecimentos.forEach((abastecimento) => {
      if (abastecimento.data_abastecimento) {
        const data = new Date(abastecimento.data_abastecimento);
        const chave = data.toISOString().split('T')[0];
        if (faturamentoPorDia[chave]) {
          faturamentoPorDia[chave].faturamento += this.toNumber(abastecimento.valor_total);
        }
      }
    });

    // Calcular meta diária (média do período / número de dias)
    const metaDiaria = periodoDias.length > 0 ? totalFaturado / periodoDias.length : 0;
    Object.keys(faturamentoPorDia).forEach((chave) => {
      faturamentoPorDia[chave].meta = metaDiaria;
    });

    const faturamentoPorPeriodo = periodoDias.map((dia) => {
      const chave = dia.toISOString().split('T')[0];
      const dados = faturamentoPorDia[chave] || { faturamento: 0, meta: 0 };
      return {
        dia: diasSemana[dia.getDay()],
        data: chave,
        faturamento_real: this.arredondar(dados.faturamento, 2),
        meta_diaria: this.arredondar(dados.meta, 2),
      };
    });

    // 3. VENDAS POR COMBUSTÍVEL
    const porCombustivel: Record<
      number,
      {
        combustivel: { id: number; nome: string; sigla: string };
        litros: number;
        valor: number;
      }
    > = {};

    abastecimentos.forEach((abastecimento) => {
      const combustivelId = abastecimento.combustivel.id;
      if (!porCombustivel[combustivelId]) {
        porCombustivel[combustivelId] = {
          combustivel: abastecimento.combustivel,
          litros: 0,
          valor: 0,
        };
      }
      porCombustivel[combustivelId].litros += this.toNumber(abastecimento.quantidade);
      porCombustivel[combustivelId].valor += this.toNumber(abastecimento.valor_total);
    });

    const vendasPorCombustivel = Object.values(porCombustivel)
      .map((item) => ({
        combustivel_id: item.combustivel.id,
        combustivel_nome: item.combustivel.nome,
        combustivel_sigla: item.combustivel.sigla,
        litros: this.arredondar(item.litros, 2),
        valor: this.arredondar(item.valor, 2),
        percentual: totalFaturado > 0 ? this.arredondar((item.valor / totalFaturado) * 100, 2) : 0,
      }))
      .sort((a, b) => b.valor - a.valor);

    // 4. TOP CLIENTES (ÓRGÃOS)
    const porOrgao: Record<
      number,
      {
        orgao: { id: number; nome: string; sigla: string } | null;
        valor: number;
        litros: number;
        abastecimentos: number;
      }
    > = {};

    abastecimentos.forEach((abastecimento) => {
      const orgaoId = abastecimento.veiculo.orgao?.id;
      if (!orgaoId) return;

      if (!porOrgao[orgaoId]) {
        porOrgao[orgaoId] = {
          orgao: abastecimento.veiculo.orgao,
          valor: 0,
          litros: 0,
          abastecimentos: 0,
        };
      }
      porOrgao[orgaoId].valor += this.toNumber(abastecimento.valor_total);
      porOrgao[orgaoId].litros += this.toNumber(abastecimento.quantidade);
      porOrgao[orgaoId].abastecimentos++;
    });

    const topClientes = Object.values(porOrgao)
      .map((item) => ({
        orgao_id: item.orgao?.id || 0,
        orgao_nome: item.orgao?.nome || 'Sem órgão',
        orgao_sigla: item.orgao?.sigla || '',
        valor: this.arredondar(item.valor, 2),
        litros: this.arredondar(item.litros, 2),
        abastecimentos: item.abastecimentos,
        percentual: totalFaturado > 0 ? this.arredondar((item.valor / totalFaturado) * 100, 2) : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    // 5. INDICADORES DE PERFORMANCE
    // Calcular período anterior para comparação
    const duracaoPeriodo = dataFim.getTime() - dataInicio.getTime();
    const periodoAnteriorInicio = new Date(dataInicio.getTime() - duracaoPeriodo);
    const periodoAnteriorFim = new Date(dataInicio.getTime() - 1);

    const abastecimentosAnteriores = await this.prisma.abastecimento.findMany({
      where: {
        ...whereAbastecimento,
        data_abastecimento: {
          gte: periodoAnteriorInicio,
          lte: periodoAnteriorFim,
        },
      },
    });

    const totalFaturadoAnterior = abastecimentosAnteriores.reduce(
      (sum, a) => sum + this.toNumber(a.valor_total),
      0,
    );

    // Crescimento
    const crescimento =
      totalFaturadoAnterior > 0
        ? ((totalFaturado - totalFaturadoAnterior) / totalFaturadoAnterior) * 100
        : totalFaturado > 0
          ? 100
          : 0;

    // Meta Atingida (assumindo que a meta é o total faturado do período anterior ou uma meta fixa)
    // Por enquanto, vamos usar 100% se não houver meta definida
    const metaAtingida = totalFaturadoAnterior > 0 ? (totalFaturado / totalFaturadoAnterior) * 100 : 0;

    // Melhor Dia
    const melhorDia = faturamentoPorPeriodo.reduce(
      (melhor, atual) =>
        atual.faturamento_real > melhor.faturamento_real ? atual : melhor,
      faturamentoPorPeriodo[0] || { dia: 'Nenhum', faturamento_real: 0 },
    );

    // Melhor Combustível
    const melhorCombustivel =
      vendasPorCombustivel.length > 0
        ? vendasPorCombustivel[0].combustivel_nome
        : 'Nenhum';

    // 6. VENDAS POR DIA DA SEMANA
    const vendasPorDiaSemana: Record<number, number> = {};
    diasSemana.forEach((_, index) => {
      vendasPorDiaSemana[index] = 0;
    });

    abastecimentos.forEach((abastecimento) => {
      if (abastecimento.data_abastecimento) {
        const dia = new Date(abastecimento.data_abastecimento).getDay();
        vendasPorDiaSemana[dia] += this.toNumber(abastecimento.valor_total);
      }
    });

    const vendasPorDiaSemanaArray = diasSemana.map((dia, index) => ({
      dia,
      valor: this.arredondar(vendasPorDiaSemana[index] || 0, 2),
    }));

    return {
      periodo: {
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        dias: periodoDias.length,
      },
      overview: {
        total_faturado: this.arredondar(totalFaturado, 2),
        total_litros: this.arredondar(totalLitros, 2),
        total_abastecimentos: quantidadeAbastecimentos,
        ticket_medio: this.arredondar(ticketMedio, 2),
      },
      faturamento_por_periodo: faturamentoPorPeriodo,
      vendas_por_combustivel: vendasPorCombustivel,
      top_clientes: topClientes,
      indicadores_performance: {
        crescimento: this.arredondar(crescimento, 1),
        meta_atingida: this.arredondar(metaAtingida, 1),
        melhor_dia: melhorDia.dia !== 'Nenhum' ? melhorDia.dia : 'Nenhum',
        melhor_combustivel: melhorCombustivel,
      },
      vendas_por_dia_semana: vendasPorDiaSemanaArray,
    };
  }

  async getPainelFaturamentoColaboradorEmpresa(user: any, filter?: FilterRelatorioDto) {
    return this.getPainelFaturamentoAdminEmpresa(user, filter);
  }
}

