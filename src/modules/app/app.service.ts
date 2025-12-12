import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  StatusProcesso,
  TipoContrato,
  StatusPreco,
  TipoAbastecimentoVeiculo,
  Periodicidade,
  AcaoLog,
  StatusSolicitacaoQrCodeVeiculo,
} from '@prisma/client';
import { AbastecimentoService } from '../abastecimento/abastecimento.service';
import { UploadService } from '../upload/upload.service';
import { CreateAbastecimentoFromQrCodeVeiculoAppDto } from './dto/create-abastecimento-from-qrcode-veiculo.dto';
import { CreateAbastecimentoFromQrCodeVeiculoDto } from '../abastecimento/dto/create-abastecimento-from-qrcode-veiculo.dto';
import { CreateAbastecimentoFromSolicitacaoAppDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from '../abastecimento/dto/create-abastecimento-from-solicitacao.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abastecimentoService: AbastecimentoService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Lista os combustíveis permitidos para solicitação de abastecimento de um veículo
   * Retorna os combustíveis que estão tanto cadastrados no veículo quanto na cota do órgão
   * Também retorna todos os combustíveis da cota do órgão
   * Apenas permite acesso a veículos da prefeitura do usuário logado
   */
  async listarCombustiveisPermitidosParaVeiculo(
    veiculoId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
  ) {
    // Buscar veículo com órgão, combustíveis, motoristas e informações de cota
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            imagem_perfil: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            prefeituraId: true,
          },
        },
        combustiveis: {
          where: {
            ativo: true,
          },
          select: {
            combustivelId: true,
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        motoristas: {
          where: {
            ativo: true,
          },
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${veiculoId} não encontrado`);
    }

    // Validar se o veículo pertence à prefeitura do usuário logado
    const prefeituraIdUsuario = user?.prefeitura?.id;
    if (prefeituraIdUsuario && veiculo.prefeituraId !== prefeituraIdUsuario) {
      throw new ForbiddenException(
        `Você não tem permissão para acessar veículos de outras prefeituras. Este veículo pertence à prefeitura ID ${veiculo.prefeituraId}.`,
      );
    }

    if (!veiculo.orgaoId || !veiculo.orgao) {
      const motoristasSemOrgao = veiculo.motoristas.map((vm) => ({
        id: vm.motorista.id,
        nome: vm.motorista.nome,
        cpf: vm.motorista.cpf,
      }));

      const respostaSemOrgao: any = {
        message: 'Combustíveis permitidos recuperados com sucesso',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          capacidade_tanque: veiculo.capacidade_tanque ? Number(veiculo.capacidade_tanque) : null,
          tipo_abastecimento: veiculo.tipo_abastecimento,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
          conta_faturamento_orgao_id: veiculo.contaFaturamentoOrgaoId,
          orgao: null,
          prefeitura: veiculo.prefeitura
            ? {
                id: veiculo.prefeitura.id,
                nome: veiculo.prefeitura.nome,
                imagem_perfil: veiculo.prefeitura.imagem_perfil,
              }
            : null,
        },
        motoristas: motoristasSemOrgao,
        combustiveisPermitidos: [],
        cotaVeiculo: null,
      };

      // Se for COTA, buscar cota mesmo sem órgão
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
        const dataAtual = new Date();
        const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
          where: {
            veiculoId: veiculo.id,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: { lte: dataAtual },
            data_fim_periodo: { gte: dataAtual },
            ativo: true,
          },
          orderBy: {
            data_inicio_periodo: 'desc',
          },
        });

        const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

        if (cotaPeriodo) {
          respostaSemOrgao.cotaVeiculo = {
            id: cotaPeriodo.id,
            periodicidade: cotaPeriodo.periodicidade,
            data_inicio_periodo: cotaPeriodo.data_inicio_periodo,
            data_fim_periodo: cotaPeriodo.data_fim_periodo,
            quantidade_permitida: Number(cotaPeriodo.quantidade_permitida),
            quantidade_utilizada: Number(cotaPeriodo.quantidade_utilizada),
            quantidade_disponivel: Number(cotaPeriodo.quantidade_disponivel),
            ativo: cotaPeriodo.ativo,
          };
        } else {
          const quantidadePermitida = veiculo.quantidade ? Number(veiculo.quantidade) : null;
          respostaSemOrgao.cotaVeiculo = {
            id: null,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: inicio,
            data_fim_periodo: fim,
            quantidade_permitida: quantidadePermitida,
            quantidade_utilizada: null,
            quantidade_disponivel: quantidadePermitida,
            ativo: false,
            observacao: 'Cota período não encontrada. Os valores são baseados na configuração do veículo.',
          };
        }
      }

      return respostaSemOrgao;
    }

    const orgaoId = veiculo.orgaoId;
    const prefeituraId = veiculo.orgao.prefeituraId;

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
      select: {
        id: true,
        numero_processo: true,
        status: true,
      },
    });

    if (!processo) {
      const motoristasSemProcesso = veiculo.motoristas.map((vm) => ({
        id: vm.motorista.id,
        nome: vm.motorista.nome,
        cpf: vm.motorista.cpf,
      }));

      const respostaSemProcesso: any = {
        message: 'Combustíveis permitidos recuperados com sucesso',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          capacidade_tanque: veiculo.capacidade_tanque ? Number(veiculo.capacidade_tanque) : null,
          tipo_abastecimento: veiculo.tipo_abastecimento,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
          conta_faturamento_orgao_id: veiculo.contaFaturamentoOrgaoId,
          orgao: {
            id: veiculo.orgao.id,
            nome: veiculo.orgao.nome,
            sigla: veiculo.orgao.sigla,
          },
          prefeitura: veiculo.prefeitura
            ? {
                id: veiculo.prefeitura.id,
                nome: veiculo.prefeitura.nome,
                imagem_perfil: veiculo.prefeitura.imagem_perfil,
              }
            : null,
        },
        motoristas: motoristasSemProcesso,
        combustiveisPermitidos: [],
        cotaVeiculo: null,
      };

      // Se for COTA, buscar cota mesmo sem processo
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
        const dataAtual = new Date();
        const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
          where: {
            veiculoId: veiculo.id,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: { lte: dataAtual },
            data_fim_periodo: { gte: dataAtual },
            ativo: true,
          },
          orderBy: {
            data_inicio_periodo: 'desc',
          },
        });

        const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

        if (cotaPeriodo) {
          respostaSemProcesso.cotaVeiculo = {
            id: cotaPeriodo.id,
            periodicidade: cotaPeriodo.periodicidade,
            data_inicio_periodo: cotaPeriodo.data_inicio_periodo,
            data_fim_periodo: cotaPeriodo.data_fim_periodo,
            quantidade_permitida: Number(cotaPeriodo.quantidade_permitida),
            quantidade_utilizada: Number(cotaPeriodo.quantidade_utilizada),
            quantidade_disponivel: Number(cotaPeriodo.quantidade_disponivel),
            ativo: cotaPeriodo.ativo,
          };
        } else {
          const quantidadePermitida = veiculo.quantidade ? Number(veiculo.quantidade) : null;
          respostaSemProcesso.cotaVeiculo = {
            id: null,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: inicio,
            data_fim_periodo: fim,
            quantidade_permitida: quantidadePermitida,
            quantidade_utilizada: null,
            quantidade_disponivel: quantidadePermitida,
            ativo: false,
            observacao: 'Cota período não encontrada. Os valores são baseados na configuração do veículo.',
          };
        }
      }

      return respostaSemProcesso;
    }

    // Buscar todas as cotas ativas do órgão no processo
    const cotasOrgao = await this.prisma.cotaOrgao.findMany({
      where: {
        processoId: processo.id,
        orgaoId,
        ativa: true,
      },
      include: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        processo: {
          select: {
            id: true,
            numero_processo: true,
            status: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    // IDs dos combustíveis na cota do órgão
    const combustiveisIdsCotaOrgao = new Set(cotasOrgao.map((cota) => cota.combustivelId));

    // Combustíveis permitidos = interseção entre combustíveis do veículo e cota do órgão
    const combustiveisPermitidos = veiculo.combustiveis.filter((vc) =>
      combustiveisIdsCotaOrgao.has(vc.combustivelId),
    );

    // Todos os combustíveis da cota do órgão com todos os dados
    const combustiveisCotaOrgao = cotasOrgao.map((cota) => ({
      id: cota.id,
      processoId: cota.processoId,
      orgaoId: cota.orgaoId,
      combustivelId: cota.combustivelId,
      quantidade: Number(cota.quantidade),
      quantidade_utilizada: Number(cota.quantidade_utilizada),
      valor_utilizado: Number(cota.valor_utilizado),
      restante: cota.restante ? Number(cota.restante) : null,
      saldo_disponivel_cota: cota.saldo_disponivel_cota ? Number(cota.saldo_disponivel_cota) : null,
      ativa: cota.ativa,
      combustivel: cota.combustivel,
      processo: cota.processo,
      orgao: cota.orgao,
    }));

    // Verificar preços dos combustíveis na empresa do usuário (se houver empresa vinculada)
    const empresaId = user?.empresa?.id;
    const todosCombustiveisIds = [
      ...combustiveisPermitidos.map((vc) => vc.combustivelId),
      ...combustiveisCotaOrgao.map((cota) => cota.combustivelId),
    ];
    const combustiveisIdsUnicos = [...new Set(todosCombustiveisIds)];

    let precosCombustiveis = new Map<number, any>();

    if (empresaId && combustiveisIdsUnicos.length > 0) {
      // Buscar todos os preços ativos dos combustíveis na empresa
      const precos = await this.prisma.empresaPrecoCombustivel.findMany({
        where: {
          empresa_id: empresaId,
          combustivel_id: { in: combustiveisIdsUnicos },
          status: StatusPreco.ACTIVE,
        },
        select: {
          combustivel_id: true,
          preco_atual: true,
          teto_vigente: true,
          anp_base: true,
          anp_base_valor: true,
          margem_app_pct: true,
          uf_referencia: true,
          status: true,
          updated_at: true,
          updated_by: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });

      // Agrupar por combustivel_id (pegando o mais recente)
      for (const preco of precos) {
        if (!precosCombustiveis.has(preco.combustivel_id)) {
          precosCombustiveis.set(preco.combustivel_id, {
            possuiPreco: true,
            preco_atual: Number(preco.preco_atual),
            teto_vigente: Number(preco.teto_vigente),
            anp_base: preco.anp_base,
            anp_base_valor: Number(preco.anp_base_valor),
            margem_app_pct: Number(preco.margem_app_pct),
            uf_referencia: preco.uf_referencia,
            status: preco.status,
            updated_at: preco.updated_at,
            updated_by: preco.updated_by,
          });
        }
      }
    }

    // Adicionar informação de preço aos combustíveis permitidos
    const combustiveisPermitidosComPreco = combustiveisPermitidos.map((vc) => {
      const precoInfo = precosCombustiveis.get(vc.combustivelId);
      return {
        combustivelId: vc.combustivelId,
        combustivel: vc.combustivel,
        possuiPreco: precoInfo ? precoInfo.possuiPreco : false,
        preco: precoInfo || null,
      };
    });

    // Adicionar informação de preço aos combustíveis da cota do órgão
    const combustiveisCotaOrgaoComPreco = combustiveisCotaOrgao.map((cota) => {
      const precoInfo = precosCombustiveis.get(cota.combustivelId);
      return {
        ...cota,
        possuiPreco: precoInfo ? precoInfo.possuiPreco : false,
        preco: precoInfo || null,
      };
    });

    // Mapear motoristas
    const motoristas = veiculo.motoristas.map((vm) => ({
      id: vm.motorista.id,
      nome: vm.motorista.nome,
      cpf: vm.motorista.cpf,
    }));

    // Ajustar combustíveis permitidos com preco_empresa e cota_id
    const combustiveisPermitidosFormatados = combustiveisPermitidos.map((vc) => {
      const cotaOrgao = cotasOrgao.find((c) => c.combustivelId === vc.combustivelId);
      const precoInfo = precosCombustiveis.get(vc.combustivelId);

      // Buscar quantidade disponível da cota do veículo se for tipo COTA
      let qtdDisponivelCotaVeiculo: number | null = null;
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA) {
        // Será preenchido depois quando buscar cotaVeiculo
      }

      return {
        combustivelId: vc.combustivelId,
        combustivel: vc.combustivel,
        qtd_disponivel_cota_orgao: cotaOrgao?.quantidade
          ? Number(cotaOrgao.quantidade)
          : 0,
        qtd_disponivel_cota_veiculo: qtdDisponivelCotaVeiculo,
        preco_atual: precoInfo?.preco_atual || null,
        preco_empresa: precoInfo?.preco_atual || null,
        cota_id: cotaOrgao?.id || null,
      };
    });

    // Preparar resposta base
    const resposta: any = {
      message: 'Combustíveis permitidos recuperados com sucesso',
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        capacidade_tanque: veiculo.capacidade_tanque ? Number(veiculo.capacidade_tanque) : null,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
        conta_faturamento_orgao_id: veiculo.contaFaturamentoOrgaoId,
        orgao: veiculo.orgao
          ? {
              id: veiculo.orgao.id,
              nome: veiculo.orgao.nome,
              sigla: veiculo.orgao.sigla,
            }
          : null,
        prefeitura: veiculo.prefeitura
          ? {
              id: veiculo.prefeitura.id,
              nome: veiculo.prefeitura.nome,
              imagem_perfil: veiculo.prefeitura.imagem_perfil,
            }
          : null,
      },
      motoristas,
      combustiveisPermitidos: combustiveisPermitidosFormatados,
      cotaVeiculo: null,
    };

    // Se o veículo for do tipo COTA, buscar dados da cota período e preencher qtd_disponivel_cota_veiculo
    if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
      const dataAtual = new Date();
      const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
        where: {
          veiculoId: veiculo.id,
          periodicidade: veiculo.periodicidade,
          data_inicio_periodo: { lte: dataAtual },
          data_fim_periodo: { gte: dataAtual },
          ativo: true,
        },
        orderBy: {
          data_inicio_periodo: 'desc',
        },
      });

      // Calcular intervalo do período atual
      const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

      let quantidadeDisponivelCotaVeiculo: number | null = null;

      if (cotaPeriodo) {
        quantidadeDisponivelCotaVeiculo = Number(cotaPeriodo.quantidade_disponivel);
        resposta.cotaVeiculo = {
          id: cotaPeriodo.id,
          periodicidade: cotaPeriodo.periodicidade,
          data_inicio_periodo: cotaPeriodo.data_inicio_periodo,
          data_fim_periodo: cotaPeriodo.data_fim_periodo,
          quantidade_permitida: Number(cotaPeriodo.quantidade_permitida),
          quantidade_utilizada: Number(cotaPeriodo.quantidade_utilizada),
          quantidade_disponivel: Number(cotaPeriodo.quantidade_disponivel),
          ativo: cotaPeriodo.ativo,
        };
      } else {
        // Se não encontrou cota período, retornar informações baseadas na configuração do veículo
        const quantidadePermitida = veiculo.quantidade ? Number(veiculo.quantidade) : null;
        quantidadeDisponivelCotaVeiculo = quantidadePermitida;
        resposta.cotaVeiculo = {
          id: null,
          periodicidade: veiculo.periodicidade,
          data_inicio_periodo: inicio,
          data_fim_periodo: fim,
          quantidade_permitida: quantidadePermitida,
          quantidade_utilizada: null,
          quantidade_disponivel: quantidadePermitida,
          ativo: false,
          observacao: 'Cota período não encontrada. Os valores são baseados na configuração do veículo.',
        };
      }

      // Atualizar qtd_disponivel_cota_veiculo em todos os combustíveis permitidos
      resposta.combustiveisPermitidos = resposta.combustiveisPermitidos.map((comb: any) => ({
        ...comb,
        qtd_disponivel_cota_veiculo: quantidadeDisponivelCotaVeiculo,
      }));
    }

    return resposta;
  }

  /**
   * Retorna logs de edição (UPDATE) feitos por colaboradores de uma empresa em registros de Abastecimento
   */
  async getLogsEdicaoAbastecimentoColabEmpresa(
    user: {
      id: number;
      tipo_usuario: string;
      empresa?: { id: number; nome: string; cnpj: string };
    },
    page: number = 1,
    limit: number = 20,
    dataInicial?: string,
    dataFinal?: string,
    abastecimentoId?: number,
  ) {
    if (!user?.empresa?.id) {
      throw new ForbiddenException('Usuário não está vinculado a nenhuma empresa');
    }

    const empresaId = user.empresa.id;
    const skip = (page - 1) * limit;

    const where: any = {
      tabela: 'abastecimento',
      acao: AcaoLog.UPDATE,
      usuario: {
        empresaId,
        tipo_usuario: 'COLABORADOR_EMPRESA',
      },
    };

    if (abastecimentoId) {
      where.registro_id = abastecimentoId;
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
              empresaId: true,
              tipo_usuario: true,
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
      message: 'Logs de edição de abastecimentos por colaboradores da empresa encontrados com sucesso',
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calcula o intervalo de período baseado na periodicidade
   */
  private obterIntervaloPeriodo(data: Date, periodicidade: Periodicidade) {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    if (periodicidade === Periodicidade.Diario) {
      return { inicio, fim };
    }

    if (periodicidade === Periodicidade.Semanal) {
      const diaSemana = inicio.getDay();
      const diffParaSegunda = (diaSemana + 6) % 7;
      inicio.setDate(inicio.getDate() - diffParaSegunda);

      fim.setTime(inicio.getTime());
      fim.setDate(inicio.getDate() + 6);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }

    if (periodicidade === Periodicidade.Mensal) {
      inicio.setDate(1);
      fim.setMonth(inicio.getMonth() + 1, 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }

    return { inicio, fim };
  }

  /**
   * Verifica se a empresa do usuário logado tem preço cadastrado para um combustível
   * Retorna informações do preço se existir, caso contrário retorna erro
   */
  async verificarPrecoCombustivelEmpresa(
    combustivelId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
  ) {
    const empresaId = user?.empresa?.id;
    
    if (!empresaId) {
      throw new ForbiddenException('Usuário não está vinculado a uma empresa');
    }

    // Verificar se o combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
      },
    });

    if (!combustivel) {
      throw new NotFoundException(`Combustível com ID ${combustivelId} não encontrado`);
    }

    if (!combustivel.ativo) {
      throw new NotFoundException(`Combustível com ID ${combustivelId} está inativo`);
    }

    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        ativo: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${empresaId} não encontrada`);
    }

    if (!empresa.ativo) {
      throw new NotFoundException(`Empresa com ID ${empresaId} está inativa`);
    }

    // Buscar preço ativo do combustível para a empresa
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      select: {
        id: true,
        empresa_id: true,
        combustivel_id: true,
        preco_atual: true,
        teto_vigente: true,
        anp_base: true,
        anp_base_valor: true,
        margem_app_pct: true,
        uf_referencia: true,
        status: true,
        updated_at: true,
        updated_by: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    if (!precoCombustivel || !precoCombustivel.preco_atual) {
      return {
        message: 'Preço não encontrado para este combustível na empresa',
        possuiPreco: false,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          cnpj: empresa.cnpj,
        },
        combustivel: {
          id: combustivel.id,
          nome: combustivel.nome,
          sigla: combustivel.sigla,
        },
      };
    }

    return {
      message: 'Preço encontrado com sucesso',
      possuiPreco: true,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
      },
      combustivel: {
        id: combustivel.id,
        nome: combustivel.nome,
        sigla: combustivel.sigla,
      },
      preco: {
        id: precoCombustivel.id,
        preco_atual: Number(precoCombustivel.preco_atual),
        teto_vigente: Number(precoCombustivel.teto_vigente),
        anp_base: precoCombustivel.anp_base,
        anp_base_valor: Number(precoCombustivel.anp_base_valor),
        margem_app_pct: Number(precoCombustivel.margem_app_pct),
        uf_referencia: precoCombustivel.uf_referencia,
        status: precoCombustivel.status,
        updated_at: precoCombustivel.updated_at,
        updated_by: precoCombustivel.updated_by,
      },
    };
  }

  /**
   * Lista os combustíveis permitidos para um veículo em uma empresa específica
   * Retorna apenas combustíveis que:
   * - Estão cadastrados no veículo
   * - Estão na cota do órgão
   * - Têm saldo disponível na cota do órgão
   * - Têm preço cadastrado na empresa
   */
  async listarCombustiveisPermitidosParaVeiculoEmpresa(
    veiculoId: number,
    empresaId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
  ) {
    // Buscar veículo com todos os dados necessários
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            imagem_perfil: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        combustiveis: {
          where: {
            ativo: true,
          },
          select: {
            combustivelId: true,
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        motoristas: {
          where: {
            ativo: true,
          },
          select: {
            motorista: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
          orderBy: {
            data_inicio: 'desc',
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${veiculoId} não encontrado`);
    }

    // Validar se o veículo pertence à prefeitura do usuário logado
    const prefeituraIdUsuario = user?.prefeitura?.id;
    if (prefeituraIdUsuario && veiculo.prefeituraId !== prefeituraIdUsuario) {
      throw new ForbiddenException(
        `Você não tem permissão para acessar veículos de outras prefeituras. Este veículo pertence à prefeitura ID ${veiculo.prefeituraId}.`,
      );
    }

    // Validar se a empresa existe e está ativa
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        ativo: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${empresaId} não encontrada`);
    }

    if (!empresa.ativo) {
      throw new NotFoundException(`Empresa com ID ${empresaId} está inativa`);
    }

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId: veiculo.prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    // Buscar motoristas vinculados ao veículo
    const motoristasVinculados = veiculo.motoristas.map((vm) => ({
      id: vm.motorista.id,
      nome: vm.motorista.nome,
      cpf: vm.motorista.cpf,
    }));

    if (!processo || !veiculo.orgaoId || !veiculo.orgao) {
      return {
        message: 'Combustíveis permitidos recuperados com sucesso',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          capacidade_tanque: veiculo.capacidade_tanque ? Number(veiculo.capacidade_tanque) : null,
          tipo_abastecimento: veiculo.tipo_abastecimento,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
          conta_faturamento_orgao_id: veiculo.contaFaturamentoOrgaoId,
          orgao: veiculo.orgao,
          prefeitura: veiculo.prefeitura,
        },
        motoristas: motoristasVinculados,
        combustiveisPermitidos: [],
      };
    }

    // Buscar todas as cotas ativas do órgão no processo
    const cotasOrgao = await this.prisma.cotaOrgao.findMany({
      where: {
        processoId: processo.id,
        orgaoId: veiculo.orgaoId,
        ativa: true,
        saldo_disponivel_cota: {
          gt: 0,
        },
      },
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

    // IDs dos combustíveis na cota do órgão com saldo disponível
    const combustiveisIdsCotaOrgao = new Set(cotasOrgao.map((cota) => cota.combustivelId));

    // Combustíveis permitidos = interseção entre combustíveis do veículo e cota do órgão
    const combustiveisPermitidosInicial = veiculo.combustiveis.filter((vc) =>
      combustiveisIdsCotaOrgao.has(vc.combustivelId),
    );

    // Buscar preços da empresa para os combustíveis permitidos
    const combustiveisIdsPermitidos = combustiveisPermitidosInicial.map((vc) => vc.combustivelId);

    const precosEmpresa = await this.prisma.empresaPrecoCombustivel.findMany({
      where: {
        empresa_id: empresaId,
        combustivel_id: { in: combustiveisIdsPermitidos },
        status: StatusPreco.ACTIVE,
      },
      select: {
        combustivel_id: true,
        preco_atual: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    // Criar mapa de preços (pegando o mais recente por combustível)
    const precosMap = new Map<number, number>();
    for (const preco of precosEmpresa) {
      if (!precosMap.has(preco.combustivel_id) && preco.preco_atual) {
        precosMap.set(preco.combustivel_id, Number(preco.preco_atual));
      }
    }

    // Buscar cota período do veículo se for tipo COTA
    let cotaVeiculoPeriodo: any = null;
    if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
      const dataAtual = new Date();
      const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
        where: {
          veiculoId: veiculo.id,
          periodicidade: veiculo.periodicidade,
          data_inicio_periodo: { lte: dataAtual },
          data_fim_periodo: { gte: dataAtual },
          ativo: true,
        },
        orderBy: {
          data_inicio_periodo: 'desc',
        },
      });

      if (cotaPeriodo) {
        cotaVeiculoPeriodo = {
          quantidade_disponivel: Number(cotaPeriodo.quantidade_disponivel),
        };
      }
    }

    // Criar mapa de quantidades da cota do órgão e IDs das cotas
    const quantidadesCotaOrgaoMap = new Map<number, number>();
    const cotasOrgaoMap = new Map<number, number>(); // Map combustivelId -> cotaId
    for (const cota of cotasOrgao) {
      if (cota.quantidade) {
        quantidadesCotaOrgaoMap.set(cota.combustivelId, Number(cota.quantidade));
        cotasOrgaoMap.set(cota.combustivelId, cota.id);
      }
    }

    // Filtrar combustíveis que têm preço na empresa e montar resposta
    const combustiveisPermitidos = combustiveisPermitidosInicial
      .filter((vc) => precosMap.has(vc.combustivelId))
      .map((vc) => {
        const cotaOrgao = cotasOrgao.find((c) => c.combustivelId === vc.combustivelId);
        const qtdDisponivelCotaOrgao = quantidadesCotaOrgaoMap.get(vc.combustivelId) || 0;
        const precoAtual = precosMap.get(vc.combustivelId) || 0;
        const cotaId = cotasOrgaoMap.get(vc.combustivelId) || null;

        const resultado: any = {
          combustivelId: vc.combustivelId,
          combustivel: vc.combustivel,
          qtd_disponivel_cota_orgao: qtdDisponivelCotaOrgao,
          preco_atual: precoAtual,
          preco_empresa: precoAtual, // preco_empresa é o mesmo que preco_atual
          cota_orgao_veiculo_id: cotaId, // ID da cota do órgão do veículo para este combustível
        };

        // Se for tipo COTA, adicionar quantidade disponível da cota do veículo
        if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && cotaVeiculoPeriodo) {
          resultado.qtd_disponivel_cota_veiculo = cotaVeiculoPeriodo.quantidade_disponivel;
        } else {
          resultado.qtd_disponivel_cota_veiculo = null;
        }

        return resultado;
      });

    return {
      message: 'Combustíveis permitidos recuperados com sucesso',
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        capacidade_tanque: veiculo.capacidade_tanque ? Number(veiculo.capacidade_tanque) : null,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
        conta_faturamento_orgao_id: veiculo.contaFaturamentoOrgaoId,
        orgao: veiculo.orgao,
        prefeitura: veiculo.prefeitura,
      },
      motoristas: motoristasVinculados,
      combustiveisPermitidos,
    };
  }

  /**
   * Cria abastecimento a partir de dados fornecidos diretamente (sem QR code)
   * Esta rota recebe todos os dados do abastecimento diretamente no body
   */
  async createAbastecimentoFromQrCodeVeiculo(
    createDto: CreateAbastecimentoFromQrCodeVeiculoAppDto,
    user: any,
  ) {
    // Buscar veículo pelo ID para obter o código QR code
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: createDto.veiculoId },
      include: {
        solicitacoesQrCode: {
          where: {
            status: {
              in: [
                StatusSolicitacaoQrCodeVeiculo.Aprovado,
                StatusSolicitacaoQrCodeVeiculo.Em_Producao,
                StatusSolicitacaoQrCodeVeiculo.Integracao,
                StatusSolicitacaoQrCodeVeiculo.Concluida,
              ],
            },
          },
          take: 1,
          orderBy: {
            data_cadastro: 'desc',
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${createDto.veiculoId} não encontrado`);
    }

    if (!veiculo.ativo) {
      throw new NotFoundException(`Veículo com ID ${createDto.veiculoId} está inativo`);
    }

    // Verificar se existe QR code válido para o veículo
    if (!veiculo.solicitacoesQrCode || veiculo.solicitacoesQrCode.length === 0) {
      throw new NotFoundException(
        `Nenhum QR code válido encontrado para o veículo com ID ${createDto.veiculoId}`,
      );
    }

    const codigoQrcode = veiculo.solicitacoesQrCode[0].codigo_qrcode;

    // Converter DTO do app para DTO do abastecimento
    const abastecimentoDto: CreateAbastecimentoFromQrCodeVeiculoDto = {
      codigo_qrcode: codigoQrcode,
      combustivelId: createDto.combustivelId,
      tipo_abastecimento: createDto.tipo_abastecimento,
      quantidade: createDto.quantidade,
      preco_anp: createDto.preco_anp,
      preco_empresa: createDto.preco_empresa,
      desconto: createDto.desconto,
      valor_total: createDto.valor_total,
      odometro: createDto.odometro,
      orimetro: createDto.orimetro,
      nfe_chave_acesso: createDto.nfe_chave_acesso,
      nfe_img_url: createDto.nfe_img_url,
      nfe_link: createDto.nfe_link,
      observacao: createDto.observacao,
      conta_faturamento_orgao_id: createDto.conta_faturamento_orgao_id,
      empresaId: createDto.empresaId,
      motoristaId: createDto.motoristaId,
    };

    // Chamar o serviço de abastecimento
    return this.abastecimentoService.createFromQrCodeVeiculo(abastecimentoDto, user);
  }

  /**
   * Cria abastecimento a partir de uma solicitação de abastecimento
   * Esta rota recebe o ID da solicitação e cria o abastecimento usando o serviço existente
   * Se uma imagem NFe for enviada, faz upload para o Supabase Storage antes de criar o abastecimento
   */
  async createAbastecimentoFromSolicitacao(
    createDto: CreateAbastecimentoFromSolicitacaoAppDto,
    user: any,
    nfeImgFile?: Express.Multer.File,
  ) {
    // Upload da imagem da NFE, se enviada
    let nfe_img_url = createDto.nfe_img_url;
    if (nfeImgFile) {
      // Buscar o veiculoId da solicitação para usar no nome do arquivo
      const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
        where: { id: createDto.solicitacaoId },
        select: { veiculoId: true },
      });

      const veiculoId = solicitacao?.veiculoId || 'unknown';
      const uniqueFileName = `nfe-${veiculoId}-${Date.now()}`;
      const uploadedUrl = await this.uploadService.uploadImage(nfeImgFile, 'abastecimentos/nfe', uniqueFileName);
      nfe_img_url = uploadedUrl || undefined;
    }

    // Converter DTO do app para DTO do abastecimento
    const abastecimentoDto: CreateAbastecimentoFromSolicitacaoDto = {
      solicitacaoId: createDto.solicitacaoId,
      data_abastecimento: createDto.data_abastecimento,
      motoristaId: createDto.motoristaId,
      nfe_chave_acesso: createDto.nfe_chave_acesso,
      nfe_img_url: nfe_img_url,
      status: createDto.status,
      odometro: createDto.odometro,
      orimetro: createDto.orimetro,
      validadorId: createDto.validadorId,
      abastecedorId: createDto.abastecedorId,
      desconto: createDto.desconto,
      preco_anp: createDto.preco_anp,
      abastecido_por: createDto.abastecido_por,
      nfe_link: createDto.nfe_link,
      observacao: createDto.observacao,
      ativo: createDto.ativo,
    };

    // Chamar o serviço de abastecimento
    return this.abastecimentoService.createFromSolicitacao(abastecimentoDto, user);
  }
}

