import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { CreateAbastecimentoFromQrCodeVeiculoDto } from './dto/create-abastecimento-from-qrcode-veiculo.dto';
import { Prisma, StatusAbastecimento, StatusSolicitacao, TipoAbastecimento, Periodicidade, TipoAbastecimentoVeiculo, TipoContrato, StatusProcesso, StatusPreco } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AbastecimentoNotFoundException,
  AbastecimentoVeiculoNotFoundException,
  AbastecimentoCombustivelNotFoundException,
  AbastecimentoEmpresaNotFoundException,
  AbastecimentoMotoristaNotFoundException,
  AbastecimentoValidadorNotFoundException,
  AbastecimentoAbastecedorNotFoundException,
  AbastecimentoContaFaturamentoNotFoundException,
  AbastecimentoCotaNotFoundException,
  AbastecimentoSolicitacaoNotFoundException,
  AbastecimentoUsuarioSemEmpresaException,
  AbastecimentoEmpresaDiferenteException,
  AbastecimentoEmpresaInativaException,
  AbastecimentoSolicitacaoExpiradaException,
  AbastecimentoSolicitacaoRejeitadaException,
  AbastecimentoSolicitacaoEfetivadaException,
  AbastecimentoSolicitacaoInativaException,
  AbastecimentoSolicitacaoEmpresaDiferenteException,
  AbastecimentoSolicitacaoJaPossuiAbastecimentoException,
  AbastecimentoJaAprovadoException,
  AbastecimentoJaRejeitadoException,
  AbastecimentoNaoAguardandoAprovacaoException,
  AbastecimentoMotivoRejeicaoObrigatorioException,
  AbastecimentoQuantidadeInvalidaException,
  AbastecimentoValorTotalInvalidoException,
  AbastecimentoDataAbastecimentoFuturaException,
  AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException,
  AbastecimentoNFEChaveAcessoInvalidaException,
  AbastecimentoNFEUrlInvalidaException,
  AbastecimentoDescontoMaiorQueValorException,
  AbastecimentoVeiculoInativoException,
  AbastecimentoCombustivelInativoException,
  AbastecimentoCotaInativaException,
  AbastecimentoMotoristaNaoPertencePrefeituraException,
  AbastecimentoValorTotalInconsistenteException,
  AbastecimentoCombustivelNaoVinculadoVeiculoException,
  AbastecimentoCanceladoException,
  AbastecimentoInativoException,
} from '../../common/exceptions';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AbastecimentoService {
  // Quando a data vem sem timezone, tratamos como UTC puro para evitar adiantar 3h na gravação
  private readonly defaultTimezoneOffset = 'Z';
  private readonly timezoneSuffixRegex = /([zZ]|[+\-]\d{2}:\d{2})$/;

  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  /**
   * Busca CotaOrgao automaticamente baseado em veiculoId, prefeituraId e combustivelId
   */
  private async buscarCotaOrgao(
    tx: Prisma.TransactionClient,
    veiculoId: number,
    prefeituraId: number,
    combustivelId: number,
  ): Promise<number | null> {
    // Buscar veículo com órgão
    const veiculo = await tx.veiculo.findUnique({
      where: { id: veiculoId },
      select: {
        orgaoId: true,
      },
    });

    if (!veiculo || !veiculo.orgaoId) {
      return null;
    }

    // Buscar processo ativo da prefeitura
    const processo = await tx.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!processo) {
      return null;
    }

    // Buscar CotaOrgao para o órgão, combustível e processo
    const cotaOrgao = await tx.cotaOrgao.findFirst({
      where: {
        processoId: processo.id,
        orgaoId: veiculo.orgaoId,
        combustivelId,
        ativa: true,
      },
      select: {
        id: true,
      },
    });

    return cotaOrgao?.id || null;
  }

  /**
   * Valida e normaliza valores numéricos para cálculos
   */
  private validarEConverterValor(valor: any, nomeCampo: string, permiteNegativo = false): number {
    if (valor === null || valor === undefined) {
      return 0;
    }

    const valorNumero = typeof valor === 'string' ? parseFloat(valor) : Number(valor);

    if (isNaN(valorNumero) || !isFinite(valorNumero)) {
      throw new Error(`Valor inválido para ${nomeCampo}: ${valor}`);
    }

    if (!permiteNegativo && valorNumero < 0) {
      throw new Error(`Valor negativo não permitido para ${nomeCampo}: ${valorNumero}`);
    }

    return valorNumero;
  }

  /**
   * Arredonda valor para precisão decimal adequada
   */
  private arredondarDecimal(valor: number, casasDecimais: number = 2): number {
    const multiplicador = Math.pow(10, casasDecimais);
    return Math.round(valor * multiplicador) / multiplicador;
  }

  private adicionarInfoOrgaoAbastecimento<
    T extends {
      veiculo?: {
        orgaoId?: number | null;
        orgao?: { id: number | null; nome: string | null } | null;
      } | null;
    },
  >(registro: T): T & { orgaoId: number | null; orgaoNome: string | null } {
    const orgaoId = registro?.veiculo?.orgao?.id ?? registro?.veiculo?.orgaoId ?? null;
    const orgaoNome = registro?.veiculo?.orgao?.nome ?? null;

    return {
      ...registro,
      orgaoId,
      orgaoNome,
    };
  }

  /**
   * Atualiza a cota do órgão após um abastecimento
   * Incrementa ou decrementa quantidade_utilizada e valor_utilizado
   * Recalcula restante = quantidade - quantidade_utilizada
   * Atualiza saldo_disponivel_cota = restante
   */
  private async atualizarCotaOrgao(
    tx: Prisma.TransactionClient,
    cotaId: number,
    quantidade: number,
    valorTotal: number,
  ): Promise<void> {
    // Validar valores de entrada
    const quantidadeValidada = this.validarEConverterValor(quantidade, 'quantidade', true);
    const valorTotalValidado = this.validarEConverterValor(valorTotal, 'valor_total', true);

    // Se não houver diferença, não faz nada
    if (quantidadeValidada === 0 && valorTotalValidado === 0) {
      return;
    }

    // Buscar cota atual dentro da transação (incluindo processoId)
    const cota = await tx.cotaOrgao.findUnique({
      where: { id: cotaId },
      select: {
        id: true,
        quantidade: true,
        quantidade_utilizada: true,
        valor_utilizado: true,
        processoId: true,
      },
    });

    if (!cota) {
      throw new AbastecimentoCotaNotFoundException(cotaId, {
        additionalInfo: {
          cotaId,
          message: 'Cota não encontrada ao tentar atualizar após abastecimento',
        },
      });
    }

    // Validar e converter valores da cota
    const quantidadeUtilizadaAtual = this.validarEConverterValor(
      cota.quantidade_utilizada,
      'quantidade_utilizada',
      false,
    );
    const valorUtilizadoAtual = this.validarEConverterValor(
      cota.valor_utilizado,
      'valor_utilizado',
      false,
    );
    const quantidadeTotal = this.validarEConverterValor(cota.quantidade, 'quantidade', false);

    if (quantidadeTotal <= 0) {
      throw new Error(`Quantidade total da cota deve ser maior que zero: ${quantidadeTotal}`);
    }

    // Calcular novos valores com arredondamento adequado
    // quantidade_utilizada: Decimal(10, 1) - 1 casa decimal
    let novaQuantidadeUtilizada = this.arredondarDecimal(
      quantidadeUtilizadaAtual + quantidadeValidada,
      1,
    );

    // Garantir que não fique negativa
    if (novaQuantidadeUtilizada < 0) {
      novaQuantidadeUtilizada = 0;
    }

    // valor_utilizado: Decimal(10, 2) - 2 casas decimais
    let novoValorUtilizado = this.arredondarDecimal(valorUtilizadoAtual + valorTotalValidado, 2);

    // Garantir que não fique negativo
    if (novoValorUtilizado < 0) {
      novoValorUtilizado = 0;
    }

    // restante e saldo_disponivel_cota: Decimal(10, 1) - 1 casa decimal
    const restante = Math.max(0, this.arredondarDecimal(quantidadeTotal - novaQuantidadeUtilizada, 1));

    // Validar que quantidade utilizada não excede a quantidade total
    if (novaQuantidadeUtilizada > quantidadeTotal) {
      console.warn(
        `Aviso: Quantidade utilizada (${novaQuantidadeUtilizada}) excede quantidade total (${quantidadeTotal}) na cota ${cotaId}. Restante será 0.`,
      );
    }

    // Atualizar cota
    await tx.cotaOrgao.update({
      where: { id: cotaId },
      data: {
        quantidade_utilizada: new Decimal(novaQuantidadeUtilizada),
        valor_utilizado: new Decimal(novoValorUtilizado),
        restante: new Decimal(restante),
        saldo_disponivel_cota: new Decimal(restante),
      },
    });

    // Atualizar Processo usando o processoId da cota
    if (cota.processoId) {
      await this.atualizarProcessoPorId(tx, cota.processoId, valorTotalValidado);
    }
  }

  /**
   * Atualiza o Processo após um abastecimento usando o processoId
   * Incrementa valor_utilizado com o valor_total do abastecimento
   * Recalcula valor_disponivel = litros_desejados - valor_utilizado
   */
  private async atualizarProcessoPorId(
    tx: Prisma.TransactionClient,
    processoId: number,
    valorTotal: number,
  ): Promise<void> {
    // Validar valor de entrada
    const valorTotalValidado = this.validarEConverterValor(valorTotal, 'valor_total', false);

    if (valorTotalValidado < 0) {
      throw new Error(`Valor total não pode ser negativo: ${valorTotalValidado}`);
    }

    // Buscar processo por ID
    const processo = await tx.processo.findUnique({
      where: { id: processoId },
      select: {
        id: true,
        litros_desejados: true,
        valor_utilizado: true,
      },
    });

    if (!processo) {
      // Se não encontrar processo, não lançar erro (pode não existir)
      console.warn(`Processo ${processoId} não encontrado ao tentar atualizar após abastecimento`);
      return;
    }

    // Validar e converter valores do processo
    const valorUtilizadoAtual = this.validarEConverterValor(
      processo.valor_utilizado,
      'valor_utilizado',
      false,
    );
    const litrosDesejados = this.validarEConverterValor(
      processo.litros_desejados,
      'litros_desejados',
      true, // Pode ser null/undefined
    );

    // Calcular novos valores com arredondamento adequado
    // valor_utilizado e valor_disponivel: Decimal(10, 2) - 2 casas decimais
    const novoValorUtilizado = this.arredondarDecimal(valorUtilizadoAtual + valorTotalValidado, 2);

    // valor_disponivel = litros_desejados - valor_utilizado
    // Nota: litros_desejados está em litros, mas valor_utilizado está em reais
    // O cálculo correto seria considerar o preço médio, mas seguindo a especificação:
    const valorDisponivel = Math.max(
      0,
      this.arredondarDecimal(litrosDesejados - novoValorUtilizado, 2),
    );

    // Validar que valor utilizado não excede litros desejados (considerando conversão)
    if (novoValorUtilizado > litrosDesejados && litrosDesejados > 0) {
      console.warn(
        `Aviso: Valor utilizado (${novoValorUtilizado}) excede litros desejados (${litrosDesejados}) no processo ${processoId}. Valor disponível será 0.`,
      );
    }

    // Atualizar processo
    await tx.processo.update({
      where: { id: processoId },
      data: {
        valor_utilizado: new Decimal(novoValorUtilizado),
        valor_disponivel: new Decimal(valorDisponivel),
      },
    });
  }

  /**
   * Atualiza o Processo após um abastecimento (método legado para compatibilidade)
   * Busca processo ativo da prefeitura e atualiza
   */
  private async atualizarProcesso(
    tx: Prisma.TransactionClient,
    prefeituraId: number,
    valorTotal: number,
  ): Promise<void> {
    // Buscar processo ativo da prefeitura
    const processo = await tx.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
      select: {
        id: true,
        litros_desejados: true,
        valor_utilizado: true,
      },
    });

    if (!processo) {
      // Se não encontrar processo ativo, não lançar erro (pode não existir)
      return;
    }

    // Usar o método atualizarProcessoPorId
    await this.atualizarProcessoPorId(tx, processo.id, valorTotal);
  }

  /**
   * Atualiza VeiculoCotaPeriodo ao criar um abastecimento
   * Incrementa quantidade_utilizada e decrementa quantidade_disponivel
   * Similar à lógica usada em solicitações de abastecimento
   */
  private async atualizarVeiculoCotaPeriodo(
    tx: Prisma.TransactionClient,
    veiculoId: number,
    periodicidade: Periodicidade,
    dataAbastecimento: Date,
    quantidade: number,
  ): Promise<void> {
    // Buscar a cota de período ativa que contém a data do abastecimento
    const cotaPeriodo = await tx.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId,
        periodicidade,
        data_inicio_periodo: { lte: dataAbastecimento },
        data_fim_periodo: { gte: dataAbastecimento },
        ativo: true,
      },
      orderBy: {
        data_inicio_periodo: 'desc',
      },
    });

    if (!cotaPeriodo) {
      // Se não encontrar período, não lançar erro (pode não existir para todos os veículos)
      console.warn(
        `Cota período não encontrada para veículo ${veiculoId}, periodicidade ${periodicidade}, data ${dataAbastecimento}`,
      );
      return;
    }

    const quantidadeUtilizadaAtual = this.validarEConverterValor(
      cotaPeriodo.quantidade_utilizada,
      'quantidade_utilizada',
      false,
    );
    const quantidadeDisponivelAtual = this.validarEConverterValor(
      cotaPeriodo.quantidade_disponivel,
      'quantidade_disponivel',
      false,
    );
    const quantidadeValidada = this.validarEConverterValor(quantidade, 'quantidade', true);

    // Calcular novos valores
    const novaQuantidadeUtilizada = this.arredondarDecimal(
      quantidadeUtilizadaAtual + quantidadeValidada,
      1,
    );
    const novaQuantidadeDisponivel = Math.max(
      0,
      this.arredondarDecimal(quantidadeDisponivelAtual - quantidadeValidada, 1),
    );

    // Atualizar VeiculoCotaPeriodo
    await tx.veiculoCotaPeriodo.update({
      where: { id: cotaPeriodo.id },
      data: {
        quantidade_utilizada: new Decimal(novaQuantidadeUtilizada),
        quantidade_disponivel: new Decimal(novaQuantidadeDisponivel),
      },
    });
  }

  async create(
    createAbastecimentoDto: CreateAbastecimentoDto,
    user: any,
    nfeImgFile?: Express.Multer.File,
  ) {
    const { veiculoId, combustivelId, empresaId, motoristaId, validadorId, abastecedorId, conta_faturamento_orgao_id, cota_id } = createAbastecimentoDto;

    // Verificar se o usuário pertence à empresa informada (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new AbastecimentoUsuarioSemEmpresaException({
        user: { id: user?.id, tipo: user?.tipo_usuario, email: user?.email },
        payload: createAbastecimentoDto,
      });
    }

    if (user.empresa.id !== empresaId) {
      throw new AbastecimentoEmpresaDiferenteException(empresaId, user.empresa.id, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se veículo existe
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: {
        orgao: {
          select: {
            id: true,
            prefeituraId: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new AbastecimentoVeiculoNotFoundException(veiculoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se veículo está ativo
    if (!veiculo.ativo) {
      throw new AbastecimentoVeiculoInativoException(veiculoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new AbastecimentoCombustivelNotFoundException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível está ativo
    if (!combustivel.ativo) {
      throw new AbastecimentoCombustivelInativoException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível está vinculado ao veículo
    const combustivelVinculado = await this.prisma.veiculoCombustivel.findFirst({
      where: {
        veiculoId: veiculoId,
        combustivelId: combustivelId,
        ativo: true,
      },
    });

    if (!combustivelVinculado) {
      throw new AbastecimentoCombustivelNaoVinculadoVeiculoException(veiculoId, combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new AbastecimentoEmpresaNotFoundException(empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se a empresa está ativa
    if (!empresa.ativo) {
      throw new AbastecimentoEmpresaInativaException(empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se motorista existe (se informado)
    if (motoristaId) {
      const motorista = await this.prisma.motorista.findUnique({
        where: { id: motoristaId },
        include: {
          prefeitura: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!motorista) {
        throw new AbastecimentoMotoristaNotFoundException(motoristaId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }

      // Verificar se motorista pertence à mesma prefeitura do veículo
      if (veiculo.orgao?.prefeituraId && motorista.prefeituraId !== veiculo.orgao.prefeituraId) {
        throw new AbastecimentoMotoristaNaoPertencePrefeituraException(motoristaId, veiculoId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se validador existe (se informado)
    if (validadorId) {
      const validador = await this.prisma.usuario.findUnique({
        where: { id: validadorId },
      });
      if (!validador) {
        throw new AbastecimentoValidadorNotFoundException(validadorId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // abastecedorId sempre será preenchido automaticamente com user.empresa.id
    // Não é necessário validar o abastecedorId do DTO, pois ele será ignorado
    // O abastecedorId é sempre a empresa do usuário logado

    // Verificar se conta de faturamento existe (se informado)
    if (conta_faturamento_orgao_id) {
      const contaFaturamento = await this.prisma.contaFaturamentoOrgao.findUnique({
        where: { id: conta_faturamento_orgao_id },
      });
      if (!contaFaturamento) {
        throw new AbastecimentoContaFaturamentoNotFoundException(conta_faturamento_orgao_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se cota existe (se informado)
    if (cota_id) {
      const cota = await this.prisma.cotaOrgao.findUnique({
        where: { id: cota_id },
      });
      if (!cota) {
        throw new AbastecimentoCotaNotFoundException(cota_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }

      // Verificar se cota está ativa
      if (!cota.ativa) {
        throw new AbastecimentoCotaInativaException(cota_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Buscar solicitação de abastecimento relacionada para obter solicitanteId
    let solicitanteIdParaUsar: number | undefined = createAbastecimentoDto.solicitanteId;
    if (!solicitanteIdParaUsar) {
      const solicitacao = await this.prisma.solicitacaoAbastecimento.findFirst({
        where: {
          veiculoId,
          combustivelId,
          empresaId,
          status: {
            in: [StatusSolicitacao.APROVADA, StatusSolicitacao.PENDENTE],
          },
          abastecimento_id: null, // Solicitação ainda não foi convertida em abastecimento
          ativo: true,
        },
        orderBy: {
          data_solicitacao: 'desc',
        },
        include: {
          // Nota: A solicitação não tem solicitanteId direto, mas podemos tentar buscar de outra forma se necessário
        },
      });

      // Se encontrou solicitação, manter para usar dados relacionados
      // Como não há solicitanteId direto na solicitação, vamos manter undefined se não foi informado
    }

    // Buscar EmpresaPrecoCombustivel para obter preco_anp (anp_base_valor) e preco_empresa (preco_atual)
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    // Preencher preco_anp e preco_empresa automaticamente se não foram informados
    let precoAnpParaUsar = createAbastecimentoDto.preco_anp;
    let precoEmpresaParaUsar = createAbastecimentoDto.preco_empresa;
    
    if (precoCombustivel) {
      if (!precoAnpParaUsar && precoCombustivel.anp_base_valor) {
        precoAnpParaUsar = Number(precoCombustivel.anp_base_valor);
      }
      if (!precoEmpresaParaUsar && precoCombustivel.preco_atual) {
        precoEmpresaParaUsar = Number(precoCombustivel.preco_atual);
      }
    }

    // Buscar CotaOrgao através do orgaoId do veículo e combustivelId
    let cotaIdParaUsar: number | undefined = createAbastecimentoDto.cota_id;
    if (!cotaIdParaUsar && veiculo.orgaoId) {
      // Buscar processo ativo da prefeitura
      const processo = await this.prisma.processo.findFirst({
        where: {
          prefeituraId: veiculo.prefeituraId,
          tipo_contrato: TipoContrato.OBJETIVO,
          status: StatusProcesso.ATIVO,
          ativo: true,
        },
      });

      if (processo) {
        const cotaOrgao = await this.prisma.cotaOrgao.findFirst({
          where: {
            processoId: processo.id,
            orgaoId: veiculo.orgaoId,
            combustivelId,
            ativa: true,
          },
        });

        if (cotaOrgao) {
          cotaIdParaUsar = cotaOrgao.id;
        }
      }
    }

    // Upload da imagem da NFE, se enviada
    let nfe_img_url = createAbastecimentoDto.nfe_img_url;
    if (nfeImgFile) {
      const uniqueFileName = `nfe-${veiculoId}-${Date.now()}`;
      const uploadedUrl = await this.uploadService.uploadImage(nfeImgFile, 'abastecimentos/nfe', uniqueFileName);
      nfe_img_url = uploadedUrl || undefined;
      createAbastecimentoDto.nfe_img_url = nfe_img_url;
    }

    // Validações de campos
    const { quantidade, valor_total, nfe_chave_acesso, nfe_link, desconto, preco_empresa } =
      createAbastecimentoDto;

    // Validar quantidade
    if (!quantidade || quantidade <= 0) {
      throw new AbastecimentoQuantidadeInvalidaException(quantidade || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar valor total
    if (!valor_total || valor_total < 0) {
      throw new AbastecimentoValorTotalInvalidoException(valor_total || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar quantidade vs capacidade do tanque
    if (veiculo.capacidade_tanque && quantidade > Number(veiculo.capacidade_tanque)) {
      throw new AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException(
        quantidade,
        Number(veiculo.capacidade_tanque),
        veiculoId,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        }
      );
    }

    // Validar chave de acesso NFE (deve ter 44 caracteres se informada)
    if (nfe_chave_acesso && (nfe_chave_acesso.length !== 44 || !/^\d+$/.test(nfe_chave_acesso))) {
      throw new AbastecimentoNFEChaveAcessoInvalidaException(nfe_chave_acesso, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar URLs da NFE
    if (nfe_img_url && !nfe_img_url.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_img_url', nfe_img_url, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    if (nfe_link && !nfe_link.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_link', nfe_link, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar nfe_link único por empresa (apenas para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (nfe_link && user?.tipo_usuario && 
        (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA')) {
      if (!user?.empresa?.id) {
        throw new AbastecimentoUsuarioSemEmpresaException({
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }

      // Verificar se já existe um abastecimento da mesma empresa com o mesmo nfe_link
      const abastecimentoComMesmoNfeLink = await this.prisma.abastecimento.findFirst({
        where: {
          empresaId: user.empresa.id,
          nfe_link: nfe_link,
        },
      });

      if (abastecimentoComMesmoNfeLink) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Link da NFE já está em uso',
          error: `Já existe um abastecimento da empresa com o nfe_link "${nfe_link}"`,
          details: 'O campo nfe_link deve ser único por empresa. Cada link de NFE só pode ser usado uma vez por empresa para evitar duplicidades. Verifique se você está tentando criar um abastecimento duplicado',
          nfeLink: nfe_link,
          empresaId: user.empresa.id,
          abastecimentoExistente: {
            id: abastecimentoComMesmoNfeLink.id,
            veiculoId: abastecimentoComMesmoNfeLink.veiculoId,
            dataAbastecimento: abastecimentoComMesmoNfeLink.data_abastecimento,
          },
          suggestion: 'Para resolver: 1) Verifique se você já criou um abastecimento com este nfe_link; 2) Se sim, consulte o abastecimento existente ao invés de criar um novo; 3) Se o nfe_link está correto mas você precisa criar um novo abastecimento, verifique se não está duplicando um abastecimento já registrado; 4) Se necessário, remova o campo nfe_link e informe um valor único ou deixe vazio.',
        });
      }
    }

    // Validar desconto (não pode ser maior que valor total)
    const descontoValor = desconto || 0;
    if (descontoValor > valor_total) {
      throw new AbastecimentoDescontoMaiorQueValorException(descontoValor, valor_total, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar consistência do valor total (se preco_empresa e quantidade estiverem informados)
    if (preco_empresa && quantidade) {
      const valorCalculado = quantidade * preco_empresa - descontoValor;
      // Permitir pequena diferença devido a arredondamentos (0.01)
      if (Math.abs(valor_total - valorCalculado) > 0.01) {
        throw new AbastecimentoValorTotalInconsistenteException(
          valor_total,
          quantidade,
          preco_empresa,
          descontoValor,
          {
            user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
            payload: createAbastecimentoDto,
          }
        );
      }
    }

    // Obter prefeituraId do veículo
    const prefeituraId = veiculo.prefeituraId;

    // Definir valores padrão para campos que devem ser preenchidos automaticamente
    // No schema, abastecedorId referencia Empresa; aqui usamos a mesma empresa do abastecimento
    const abastecedorIdParaUsar = empresaId;

    // Informação textual de quem realizou o abastecimento (usuário logado)
    const abastecidoPorParaUsar = user?.nome || user?.email || String(user.id);
    const statusParaUsar = StatusAbastecimento.Aprovado; // Status deve ir para APROVADO automaticamente
    const ativoParaUsar = true; // ativo fica como true ao abastecer

    // Normalizar e validar data de abastecimento (se informada)
    // Segue o mesmo padrão de data_solicitacao em solicitacao-abastecimento
    let dataAbastecimentoParaSalvar: Date;
    if (createAbastecimentoDto.data_abastecimento) {
      dataAbastecimentoParaSalvar = this.ensureDate(
        this.normalizeDateInput(createAbastecimentoDto.data_abastecimento),
        'data_abastecimento',
      );
    } else {
      // Usar data atual na timezone de Fortaleza
      dataAbastecimentoParaSalvar = this.getCurrentDateInFortaleza();
    }

    // Criar abastecimento e atualizar cota e processo em transação
    const abastecimento = await this.prisma.$transaction(async (tx) => {
      // Buscar CotaOrgao automaticamente se não foi encontrado antes
      if (!cotaIdParaUsar) {
        cotaIdParaUsar = await this.buscarCotaOrgao(tx, veiculoId, prefeituraId, combustivelId);
      }

      // Criar abastecimento
      // Preparar dados para criação, removendo campos undefined para evitar problemas no Prisma
      const dataCreate: any = {
        veiculoId: createAbastecimentoDto.veiculoId,
        combustivelId: createAbastecimentoDto.combustivelId,
        empresaId: createAbastecimentoDto.empresaId,
        tipo_abastecimento: createAbastecimentoDto.tipo_abastecimento,
        quantidade: createAbastecimentoDto.quantidade,
        valor_total: createAbastecimentoDto.valor_total,
        solicitanteId: solicitanteIdParaUsar,
        abastecedorId: abastecedorIdParaUsar,
        preco_anp: precoAnpParaUsar,
        preco_empresa: precoEmpresaParaUsar,
        abastecido_por: abastecidoPorParaUsar,
        status: statusParaUsar,
        cota_id: cotaIdParaUsar || undefined,
        ativo: ativoParaUsar,
        data_abastecimento: dataAbastecimentoParaSalvar,
      };

      // Adicionar campos opcionais apenas se estiverem definidos
      if (createAbastecimentoDto.motoristaId) {
        dataCreate.motoristaId = createAbastecimentoDto.motoristaId;
      }
      if (createAbastecimentoDto.validadorId) {
        dataCreate.validadorId = createAbastecimentoDto.validadorId;
      }
      if (createAbastecimentoDto.desconto) {
        dataCreate.desconto = createAbastecimentoDto.desconto;
      }
      if (createAbastecimentoDto.odometro) {
        dataCreate.odometro = createAbastecimentoDto.odometro;
      }
      if (createAbastecimentoDto.orimetro) {
        dataCreate.orimetro = createAbastecimentoDto.orimetro;
      }
      if (createAbastecimentoDto.motivo_rejeicao) {
        dataCreate.motivo_rejeicao = createAbastecimentoDto.motivo_rejeicao;
      }
      if (createAbastecimentoDto.nfe_chave_acesso) {
        dataCreate.nfe_chave_acesso = createAbastecimentoDto.nfe_chave_acesso;
      }
      if (nfe_img_url) {
        dataCreate.nfe_img_url = nfe_img_url;
      }
      if (createAbastecimentoDto.nfe_link) {
        dataCreate.nfe_link = createAbastecimentoDto.nfe_link;
      }
      if (createAbastecimentoDto.observacao) {
        dataCreate.observacao = createAbastecimentoDto.observacao;
      }
      if (createAbastecimentoDto.conta_faturamento_orgao_id) {
        dataCreate.conta_faturamento_orgao_id = createAbastecimentoDto.conta_faturamento_orgao_id;
      }

      const abastecimentoCriado = await tx.abastecimento.create({
        data: dataCreate,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
              orgaoId: true,
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
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          cota: {
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          },
        },
      });

      // Atualizar CotaOrgao se encontrada (isso também atualiza o Processo automaticamente)
      if (cotaIdParaUsar) {
        try {
          await this.atualizarCotaOrgao(tx, cotaIdParaUsar, quantidade, valor_total);
          
          // Buscar cota atualizada para incluir no resultado
          const cotaAtualizada = await tx.cotaOrgao.findUnique({
            where: { id: cotaIdParaUsar },
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          });
          
          // Atualizar cota no objeto retornado
          if (cotaAtualizada) {
            abastecimentoCriado.cota = cotaAtualizada;
          }
        } catch (error) {
          // Se for uma exceção conhecida, relançar
          if (error instanceof AbastecimentoCotaNotFoundException) {
            throw error;
          }
          // Caso contrário, transformar em erro mais descritivo
          console.error(`Erro ao atualizar CotaOrgao ${cotaIdParaUsar}:`, error);
          throw new Error(
            `Falha ao atualizar cota do órgão após abastecimento: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        // Se não há cota, ainda tenta atualizar processo por prefeitura (método legado)
        try {
          await this.atualizarProcesso(tx, prefeituraId, valor_total);
        } catch (error) {
          // Log do erro mas não falha a transação se processo não for encontrado
          console.warn(`Erro ao atualizar Processo para prefeitura ${prefeituraId}:`, error);
        }
      }

      return abastecimentoCriado;
    });

    return {
      message: 'Abastecimento criado com sucesso',
      abastecimento,
    };
  }

  async findAll(findAbastecimentoDto: FindAbastecimentoDto) {
    const {
      veiculoId,
      motoristaId,
      combustivelId,
      empresaId,
      prefeituraId,
      tipo_abastecimento,
      status,
      ativo,
      data_inicial,
      data_final,
      page = 1,
      limit = 10,
    } = findAbastecimentoDto;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (veiculoId) {
      where.veiculoId = veiculoId;
    }

    if (motoristaId) {
      where.motoristaId = motoristaId;
    }

    if (combustivelId) {
      where.combustivelId = combustivelId;
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    // Filtrar por prefeitura através do relacionamento com veículo
    if (prefeituraId) {
      // Se veiculoId também foi fornecido, combina os filtros
      if (veiculoId) {
        // Verificar se o veículo pertence à prefeitura especificada
        const veiculo = await this.prisma.veiculo.findUnique({
          where: { id: veiculoId },
          select: { prefeituraId: true },
        });
        
        if (!veiculo || veiculo.prefeituraId !== prefeituraId) {
          // Se o veículo não existe ou não pertence à prefeitura, retorna lista vazia
          return {
            message: 'Abastecimentos encontrados com sucesso',
            abastecimentos: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          };
        }
        // Se o veículo pertence à prefeitura, o filtro veiculoId já é suficiente
      } else {
        // Se apenas prefeituraId foi fornecido, filtra através do relacionamento
        where.veiculo = {
          prefeituraId: prefeituraId,
        };
      }
    }

    if (tipo_abastecimento) {
      where.tipo_abastecimento = tipo_abastecimento;
    }

    if (status) {
      where.status = status;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (data_inicial || data_final) {
      where.data_abastecimento = {};
      if (data_inicial) {
        where.data_abastecimento.gte = new Date(data_inicial);
      }
      if (data_final) {
        where.data_abastecimento.lte = new Date(data_final);
      }
    }

    // Buscar abastecimentos
    const [abastecimentos, total] = await Promise.all([
      this.prisma.abastecimento.findMany({
        where,
        skip,
        take: limit,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
              orgaoId: true,
              prefeituraId: true,
              orgao: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              prefeitura: {
                select: {
                  id: true,
                  nome: true,
                  imagem_perfil: true,
                },
              },
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          data_abastecimento: 'desc',
        },
      }),
      this.prisma.abastecimento.count({ where }),
    ]);

    const abastecimentosComOrgao = abastecimentos.map((item) =>
      this.adicionarInfoOrgaoAbastecimento(item),
    );

    return {
      message: 'Abastecimentos encontrados com sucesso',
      abastecimentos: abastecimentosComOrgao,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
            tipo_veiculo: true,
            prefeituraId: true,
            orgaoId: true,
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
                ativo: true,
                prefeituraId: true,
              },
            },
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            telefone: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            descricao: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            endereco_completo: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
          },
        },
        validador: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
      },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
      });
    }

    return {
      message: 'Abastecimento encontrado com sucesso',
      abastecimento,
    };
  }

  async findOneWithCotaPeriodo(id: number) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
          select: {
            id: true,
        veiculoId: true,
        data_abastecimento: true,
      },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
      });
    }

    // Buscar a cota do período do veículo
    // Se houver data_abastecimento, buscar o período que contém essa data
    // Caso contrário, buscar o período ativo mais recente
    let cotaPeriodo = null;
    
    if (abastecimento.data_abastecimento) {
      cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
        where: {
          veiculoId: abastecimento.veiculoId,
          ativo: true,
          data_inicio_periodo: { lte: abastecimento.data_abastecimento },
          data_fim_periodo: { gte: abastecimento.data_abastecimento },
        },
        orderBy: {
          data_inicio_periodo: 'desc',
        },
      });
    }

    // Se não encontrou período com a data, buscar o período ativo mais recente
    if (!cotaPeriodo) {
      cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
        where: {
          veiculoId: abastecimento.veiculoId,
          ativo: true,
        },
        orderBy: {
          data_inicio_periodo: 'desc',
        },
      });
    }

    return {
      message: 'Abastecimento encontrado com sucesso',
      abastecimento: {
        id: abastecimento.id,
        veiculoId: abastecimento.veiculoId,
        data_abastecimento: abastecimento.data_abastecimento,
        cota_periodo: cotaPeriodo
          ? {
              id: cotaPeriodo.id,
              quantidade_total: Number(cotaPeriodo.quantidade_permitida),
              quantidade_utilizada: Number(cotaPeriodo.quantidade_utilizada),
              quantidade_disponivel: Number(cotaPeriodo.quantidade_disponivel),
              data_inicio_periodo: cotaPeriodo.data_inicio_periodo,
              data_fim_periodo: cotaPeriodo.data_fim_periodo,
              periodicidade: cotaPeriodo.periodicidade,
            }
          : null,
      },
    };
  }

  async update(id: number, updateAbastecimentoDto: UpdateAbastecimentoDto, user?: any) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
    }

    // Verificar se abastecimento está cancelado
    if (existingAbastecimento.status === StatusAbastecimento.Cancelado) {
      throw new AbastecimentoCanceladoException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
    }

    // Verificar se abastecimento está inativo
    if (!existingAbastecimento.ativo) {
      throw new AbastecimentoInativoException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
    }

    // Preparar dados para atualização (apenas campos permitidos)
    const updateData: any = {};

    // Guardar valores antigos para ajuste de cota/processo
    const quantidadeAntiga = existingAbastecimento.quantidade
      ? Number((existingAbastecimento.quantidade as any).toString?.() ?? existingAbastecimento.quantidade)
      : 0;
    const valorTotalAntigo = existingAbastecimento.valor_total
      ? Number((existingAbastecimento.valor_total as any).toString?.() ?? existingAbastecimento.valor_total)
      : 0;

    let diffQuantidade = 0;
    let diffValorTotal = 0;

    // Validar e processar quantidade (se fornecida)
    if (updateAbastecimentoDto.quantidade !== undefined) {
      if (!updateAbastecimentoDto.quantidade || updateAbastecimentoDto.quantidade <= 0) {
        throw new AbastecimentoQuantidadeInvalidaException(updateAbastecimentoDto.quantidade || 0, {
          user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
          payload: updateAbastecimentoDto,
        });
      }

      // Recalcular valor_total baseado nos preços existentes
      const quantidadeNova = updateAbastecimentoDto.quantidade;
      const precoEmpresa = existingAbastecimento.preco_empresa
        ? Number((existingAbastecimento.preco_empresa as any).toString?.() ?? existingAbastecimento.preco_empresa)
        : null;
      const desconto = existingAbastecimento.desconto
        ? Number((existingAbastecimento.desconto as any).toString?.() ?? existingAbastecimento.desconto)
        : 0;

      if (precoEmpresa) {
        const novoValorTotalBruto = quantidadeNova * precoEmpresa - desconto;
        const novoValorTotal = Math.max(0, novoValorTotalBruto);

        updateData.quantidade = new Decimal(quantidadeNova);
        updateData.valor_total = new Decimal(novoValorTotal);

        diffQuantidade = quantidadeNova - quantidadeAntiga;
        diffValorTotal = novoValorTotal - valorTotalAntigo;
      } else {
        // Se não houver preco_empresa, apenas atualiza a quantidade
        updateData.quantidade = new Decimal(quantidadeNova);

        diffQuantidade = quantidadeNova - quantidadeAntiga;
        // Sem preco_empresa, não ajustamos valor_total nem cota em valor
        diffValorTotal = 0;
      }
    }

    // Validar e processar observacao (se fornecida)
    if (updateAbastecimentoDto.observacao !== undefined) {
      updateData.observacao = updateAbastecimentoDto.observacao;
    }

    // Validar e processar nfe_link (se fornecido)
    if (updateAbastecimentoDto.nfe_link !== undefined) {
      const nfeLinkAtual = existingAbastecimento.nfe_link;
      const nfeLinkNovo = updateAbastecimentoDto.nfe_link || null;

      // Se o nfe_link for igual ao existente, ignora (não atualiza e não valida)
      if (nfeLinkNovo === nfeLinkAtual) {
        // Não adiciona ao updateData, mantém o valor existente
      } else {
        // Se for diferente, valida e atualiza
        // Validar formato da URL (se não for null)
        if (nfeLinkNovo && !nfeLinkNovo.match(/^https?:\/\/.+/)) {
          throw new AbastecimentoNFEUrlInvalidaException('nfe_link', nfeLinkNovo, {
            user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
            payload: updateAbastecimentoDto,
          });
        }

        // Validar nfe_link único por empresa (apenas para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
        if (nfeLinkNovo && user?.tipo_usuario && 
            (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA')) {
          if (!user?.empresa?.id) {
            throw new AbastecimentoUsuarioSemEmpresaException({
              user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
              payload: updateAbastecimentoDto,
            });
          }

          // Verificar se existe outro abastecimento da mesma empresa com o mesmo nfe_link
          const abastecimentoComMesmoNfeLink = await this.prisma.abastecimento.findFirst({
            where: {
              empresaId: user.empresa.id,
              nfe_link: nfeLinkNovo,
              id: { not: id }, // Excluir o próprio abastecimento
            },
          });

          if (abastecimentoComMesmoNfeLink) {
            throw new BadRequestException(
              `Já existe um abastecimento da empresa com o nfe_link "${nfeLinkNovo}". O nfe_link deve ser único por empresa.`
            );
          }
        }

        // Adiciona ao updateData apenas se for diferente
        updateData.nfe_link = nfeLinkNovo;
      }
    }

    // Validar e processar nfe_img_url (se fornecido)
    if (updateAbastecimentoDto.nfe_img_url !== undefined) {
      // Validar formato da URL
      if (updateAbastecimentoDto.nfe_img_url && !updateAbastecimentoDto.nfe_img_url.match(/^https?:\/\/.+/)) {
        throw new AbastecimentoNFEUrlInvalidaException('nfe_img_url', updateAbastecimentoDto.nfe_img_url, {
          user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
          payload: updateAbastecimentoDto,
        });
      }

      updateData.nfe_img_url = updateAbastecimentoDto.nfe_img_url || null;
    }

    // Atualizar abastecimento (e cota/processo, se aplicável) em transação
    const abastecimento = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.abastecimento.update({
        where: { id },
        data: updateData,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      // Ajustar cota/processo se:
      // - o abastecimento está vinculado a uma cota
      // - houve alteração na quantidade
      // - o status é Aprovado (somente aprovados consomem cota)
      if (
        existingAbastecimento.cota_id &&
        diffQuantidade !== 0 &&
        existingAbastecimento.status === StatusAbastecimento.Aprovado
      ) {
        try {
          await this.atualizarCotaOrgao(tx, existingAbastecimento.cota_id, diffQuantidade, diffValorTotal);
        } catch (error) {
          // Se der erro específico de cota, relança; senão loga e segue
          if (error instanceof AbastecimentoCotaNotFoundException) {
            throw error;
          }
          console.warn(
            `Erro ao ajustar cota na atualização do abastecimento ${id}:`,
            (error as any)?.message || error,
          );
        }
      }

      return updated;
    });

    return {
      message: 'Abastecimento atualizado com sucesso',
      abastecimento,
    };
  }

  async remove(id: number, user?: any) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
      });
    }

    // Excluir abastecimento
    await this.prisma.abastecimento.delete({
      where: { id },
    });

    return {
      message: 'Abastecimento excluído com sucesso',
    };
  }

  async createFromSolicitacao(createDto: CreateAbastecimentoFromSolicitacaoDto, user: any) {
    const {
      solicitacaoId,
      data_abastecimento,
      motoristaId,
      nfe_chave_acesso,
      status,
      odometro,
      orimetro,
      validadorId,
      abastecedorId,
      desconto,
      preco_anp,
      abastecido_por,
      nfe_link,
      ativo,
    } = createDto;

    // Normalizar e validar data de abastecimento (se informada)
    // Segue o mesmo padrão de data_solicitacao em solicitacao-abastecimento
    let dataAbastecimentoParaSalvar: Date;
    if (data_abastecimento) {
      dataAbastecimentoParaSalvar = this.ensureDate(
        this.normalizeDateInput(data_abastecimento),
        'data_abastecimento',
      );
    } else {
      // Usar data atual na timezone de Fortaleza
      dataAbastecimentoParaSalvar = this.getCurrentDateInFortaleza();
    }

    // Verificar se o usuário pertence a uma empresa (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new AbastecimentoUsuarioSemEmpresaException({
        user: { id: user?.id, tipo: user?.tipo_usuario, email: user?.email },
        payload: createDto,
      });
    }

    // Buscar a solicitação
    const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id: solicitacaoId },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            orgaoId: true,
            orgao: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            ativo: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new AbastecimentoSolicitacaoNotFoundException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a empresa da solicitação corresponde à empresa do usuário
    if (solicitacao.empresaId !== user.empresa.id) {
      throw new AbastecimentoSolicitacaoEmpresaDiferenteException(
        solicitacaoId,
        solicitacao.empresaId,
        user.empresa.id,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Verificar se a empresa da solicitação está ativa
    if (!solicitacao.empresa.ativo) {
      throw new AbastecimentoEmpresaInativaException(solicitacao.empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação já tem um abastecimento vinculado
    if (solicitacao.abastecimento_id) {
      throw new AbastecimentoSolicitacaoJaPossuiAbastecimentoException(
        solicitacaoId,
        solicitacao.abastecimento_id,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Verificar se a solicitação está ativa
    if (!solicitacao.ativo) {
      throw new AbastecimentoSolicitacaoInativaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação não está expirada ou rejeitada
    if (solicitacao.status === StatusSolicitacao.EXPIRADA) {
      throw new AbastecimentoSolicitacaoExpiradaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    if (solicitacao.status === StatusSolicitacao.REJEITADA) {
      throw new AbastecimentoSolicitacaoRejeitadaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação já possui abastecimento vinculado
    if (solicitacao.abastecimento_id) {
      throw new AbastecimentoSolicitacaoEfetivadaException(
        solicitacaoId,
        solicitacao.abastecimento_id,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Se a solicitação estiver PENDENTE, será aprovada automaticamente antes de criar o abastecimento
    // Fluxo: PENDENTE → APROVADA → Criar Abastecimento → APROVADA (mantém status)
    const precisaAprovar = solicitacao.status === StatusSolicitacao.PENDENTE;

    // Mapear tipo de abastecimento
    const tipoAbastecimento: TipoAbastecimento = solicitacao.tipo_abastecimento as TipoAbastecimento;

    // Mapear status do abastecimento
    // Se não informado, usar Aprovado (pois a solicitação será aprovada)
    let statusAbastecimento: StatusAbastecimento = status || StatusAbastecimento.Aprovado;

    // Calcular valor total se não informado
    const valorTotal = solicitacao.valor_total 
      ? Number(solicitacao.valor_total) 
      : solicitacao.preco_empresa 
        ? Number(solicitacao.preco_empresa) * Number(solicitacao.quantidade) 
        : 0;

    // Buscar cota do órgão se necessário (para tipo COM_COTA)
    let cotaId: number | undefined = undefined;
    if (tipoAbastecimento === TipoAbastecimento.COM_COTA && solicitacao.veiculo.orgaoId) {
      // Buscar cota ativa para o órgão e combustível
      const cota = await this.prisma.cotaOrgao.findFirst({
        where: {
          orgaoId: solicitacao.veiculo.orgaoId,
          combustivelId: solicitacao.combustivelId,
          ativa: true,
        },
        orderBy: { id: 'desc' },
      });
      if (cota) {
        cotaId = cota.id;
      }
    }

    // Criar abastecimento
    // Usar 'any' para permitir definir abastecedorId diretamente (necessário até ajustar o schema)
    const abastecimentoData: any = {
      veiculo: {
        connect: { id: solicitacao.veiculoId },
      },
      combustivel: {
        connect: { id: solicitacao.combustivelId },
      },
      empresa: {
        connect: { id: solicitacao.empresaId },
      },
      tipo_abastecimento: tipoAbastecimento,
      quantidade: new Decimal(solicitacao.quantidade),
      valor_total: new Decimal(valorTotal),
      data_abastecimento: dataAbastecimentoParaSalvar,
      status: statusAbastecimento,
      ativo: ativo !== undefined ? ativo : true,
      nfe_chave_acesso: nfe_chave_acesso || solicitacao.nfe_chave_acesso || undefined,
      nfe_img_url: solicitacao.nfe_img_url || undefined,
      nfe_link: nfe_link || undefined,
      abastecido_por: abastecido_por || solicitacao.abastecido_por || 'Sistema',
      preco_empresa: solicitacao.preco_empresa ? new Decimal(solicitacao.preco_empresa) : undefined,
      preco_anp: preco_anp ? new Decimal(preco_anp) : undefined,
      desconto: desconto ? new Decimal(desconto) : undefined,
      odometro: odometro || undefined,
      orimetro: orimetro || undefined,
      contaFaturamento: solicitacao.conta_faturamento_orgao_id
        ? {
            connect: { id: solicitacao.conta_faturamento_orgao_id },
          }
        : undefined,
      cota: cotaId
        ? {
            connect: { id: cotaId },
          }
        : undefined,
    };

    // Adicionar relacionamentos opcionais
    const motoristaIdFinal = motoristaId || solicitacao.motoristaId;
    if (motoristaIdFinal) {
      abastecimentoData.motorista = {
        connect: { id: motoristaIdFinal },
      };
    }

    // Adicionar validador se fornecido
    if (validadorId) {
      abastecimentoData.validador = {
        connect: { id: validadorId },
      };
    } else if (user?.id) {
      // Se não houver validadorId explícito, usar user.id como validador
      abastecimentoData.validador = {
        connect: { id: user.id },
      };
    }

    // AbastecedorId: usar o informado no DTO, ou o ID do usuário logado
    // NOTA: abastecedorId é o ID do usuário, não da empresa
    const abastecedorIdParaUsar = abastecedorId || user?.id;
    
    // Validar se o usuário abastecedor existe antes de fazer o connect
    if (abastecedorIdParaUsar) {
      const usuarioAbastecedor = await this.prisma.usuario.findUnique({
        where: { id: abastecedorIdParaUsar },
        select: { id: true, nome: true, email: true },
      });

      if (!usuarioAbastecedor) {
        throw new AbastecimentoAbastecedorNotFoundException(
          abastecedorIdParaUsar,
          {
            user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
            payload: createDto,
          },
          {
            userEmpresaId: user?.empresa?.id,
            empresaIdFromDto: undefined, // Não há empresaId no createFromSolicitacaoDto
            abastecedorIdFromDto: abastecedorId,
            method: 'createFromSolicitacao',
            veiculoId: solicitacao?.veiculoId,
            combustivelId: solicitacao?.combustivelId,
            empresaId: solicitacao?.empresaId,
            payloadCompleto: createDto,
            consultaRealizada: `SELECT id, nome, email FROM Usuario WHERE id = ${abastecedorIdParaUsar}`,
            timestamp: new Date().toISOString(),
          },
        );
      }

      // ATENÇÃO: O schema relaciona abastecedorId com Empresa, mas queremos usar ID de Usuario
      // Como não podemos fazer connect com Empresa usando ID de Usuario, deixamos abastecedorId como null/undefined
      // Será necessário alterar o schema para referenciar Usuario em vez de Empresa para funcionar corretamente
      // Por enquanto, o campo abastecedorId será deixado como null/undefined
      // Não usar connect pois o schema espera Empresa mas estamos passando Usuario
      // abastecimentoData.abastecedor = { connect: { id: abastecedorIdParaUsar } };
      // O abastecedorId não será definido até que o schema seja ajustado
    }

    // Processar solicitação e criar abastecimento em transação
    // Fluxo: PENDENTE → Criar Abastecimento → EFETIVADA (com aprovação automática)
    // OU: APROVADA → Criar Abastecimento → EFETIVADA
    const resultado = await this.prisma.$transaction(async (tx) => {
      // PASSO 1: Criar registro na tabela de abastecimento com os dados da solicitação
      const abastecimento = await tx.abastecimento.create({
        data: abastecimentoData,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          cota: {
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          },
        },
      });

      // PASSO 2: SEMPRE atualizar solicitação vinculando o abastecimento criado e marcando como EFETIVADA
      // Esta atualização SEMPRE deve acontecer, independentemente do status anterior
      // Se estava PENDENTE, também preenche os campos de aprovação
      const dataAtualizacao: any = {
        abastecimento_id: abastecimento.id,
        status: StatusSolicitacao.EFETIVADA, // SEMPRE atualizar para EFETIVADA
        updated_at: new Date(),
      };

      // Se a solicitação estava PENDENTE, preencher os campos de aprovação também
      if (precisaAprovar) {
        dataAtualizacao.data_aprovacao = new Date();
        dataAtualizacao.aprovado_por = user.nome || user.email || 'Sistema';
        dataAtualizacao.aprovado_por_email = user.email || null;
        dataAtualizacao.aprovado_por_empresa = user.empresa?.nome || null;
      }

      // Log para depuração
      console.log(`[createFromSolicitacao] Atualizando solicitação ${solicitacaoId} para status EFETIVADA`, {
        solicitacaoId,
        abastecimentoId: abastecimento.id,
        statusAnterior: solicitacao.status,
        novoStatus: StatusSolicitacao.EFETIVADA,
        dataAtualizacao,
      });

      const solicitacaoAtualizada = await tx.solicitacaoAbastecimento.update({
        where: { id: solicitacaoId },
        data: dataAtualizacao,
        select: {
          id: true,
          status: true,
          abastecimento_id: true,
          data_solicitacao: true,
          data_expiracao: true,
          data_aprovacao: true,
          quantidade: true,
          tipo_abastecimento: true,
          aprovado_por: true,
          aprovado_por_email: true,
          aprovado_por_empresa: true,
        },
      });

      // PASSO 4: Buscar CotaOrgao automaticamente se não foi encontrado anteriormente
      const prefeituraIdSolicitacao = solicitacao.prefeituraId;
      let cotaIdParaUsar = cotaId;
      if (!cotaIdParaUsar) {
        cotaIdParaUsar = await this.buscarCotaOrgao(
          tx,
          solicitacao.veiculoId,
          prefeituraIdSolicitacao,
          solicitacao.combustivelId,
        );
      }

      // PASSO 5: Atualizar CotaOrgao se encontrada
      if (cotaIdParaUsar) {
        try {
          const quantidadeAbastecimento = Number(solicitacao.quantidade.toString());
          await this.atualizarCotaOrgao(tx, cotaIdParaUsar, quantidadeAbastecimento, valorTotal);
          
          // Atualizar cota_id no abastecimento se não estava vinculada
          if (!cotaId) {
            await tx.abastecimento.update({
              where: { id: abastecimento.id },
              data: {
                cota_id: cotaIdParaUsar,
              },
            });
          }
        } catch (error) {
          // Se for uma exceção conhecida, relançar
          if (error instanceof AbastecimentoCotaNotFoundException) {
            throw error;
          }
          // Caso contrário, transformar em erro mais descritivo
          console.error(`Erro ao atualizar CotaOrgao ${cotaIdParaUsar}:`, error);
          throw new Error(
            `Falha ao atualizar cota do órgão após abastecimento: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        
        // Buscar cota atualizada para incluir no resultado
        const cotaAtualizada = await tx.cotaOrgao.findUnique({
          where: { id: cotaIdParaUsar },
          select: {
            id: true,
            quantidade: true,
            quantidade_utilizada: true,
            valor_utilizado: true,
            restante: true,
            saldo_disponivel_cota: true,
          },
        });
        
        // Atualizar cota no objeto retornado
        if (cotaAtualizada) {
          abastecimento.cota = cotaAtualizada;
        }
      }

      // PASSO 6: Se não há cota, ainda tenta atualizar processo por prefeitura (método legado)
      if (!cotaIdParaUsar) {
        await this.atualizarProcesso(tx, prefeituraIdSolicitacao, valorTotal);
      }

      return {
        abastecimento,
        solicitacao: solicitacaoAtualizada,
      };
    });

    return {
      message: precisaAprovar 
        ? 'Solicitação aprovada e abastecimento criado com sucesso'
        : 'Abastecimento criado a partir da solicitação com sucesso',
      abastecimento: resultado.abastecimento,
      solicitacao: resultado.solicitacao,
      aprovada_automaticamente: precisaAprovar,
    };
  }

  async approve(id: number, userId: number, userEmail: string, user?: any) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Aprovado) {
      throw new AbastecimentoJaAprovadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Rejeitado) {
      throw new AbastecimentoJaRejeitadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status !== StatusAbastecimento.Aguardando) {
      throw new AbastecimentoNaoAguardandoAprovacaoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: StatusAbastecimento.Aprovado,
        data_aprovacao: new Date(),
        aprovado_por: userEmail,
        validadorId: userId,
      },
    });

    return {
      message: 'Abastecimento aprovado com sucesso',
      abastecimento: updatedAbastecimento,
    };
  }

  async reject(id: number, userId: number, userEmail: string, motivo: string, user?: any) {
    if (!motivo || motivo.trim().length === 0) {
      throw new AbastecimentoMotivoRejeicaoObrigatorioException({
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
        payload: { motivo },
      });
    }

    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Aprovado) {
      throw new AbastecimentoJaAprovadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Rejeitado) {
      throw new AbastecimentoJaRejeitadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status !== StatusAbastecimento.Aguardando) {
      throw new AbastecimentoNaoAguardandoAprovacaoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: StatusAbastecimento.Rejeitado,
        data_rejeicao: new Date(),
        rejeitado_por: userEmail,
        motivo_rejeicao: motivo,
        validadorId: userId,
      },
    });

    return {
      message: 'Abastecimento rejeitado com sucesso',
      abastecimento: updatedAbastecimento,
    };
  }

  /**
   * Verifica se a quantidade de litros informada excede a cota do veículo
   * Retorna informações sobre o consumo no período (diário, semanal ou mensal)
   */
  async verificarTipoAbastecimentoVeiculo(veiculoId: number, qntLitros: number) {
    // Buscar veículo com suas configurações
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      select: {
        id: true,
        nome: true,
        placa: true,
        tipo_abastecimento: true,
        periodicidade: true,
        quantidade: true,
      },
    });

    if (!veiculo) {
      throw new AbastecimentoVeiculoNotFoundException(veiculoId, {
        resourceId: veiculoId,
        additionalInfo: {
          veiculoId,
          qntLitros,
        },
      });
    }

    // Verificar se o veículo tem tipo de abastecimento com cota
    if (veiculo.tipo_abastecimento !== TipoAbastecimentoVeiculo.COTA) {
      return {
        message: 'Veículo não possui controle de cota',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          tipo_abastecimento: veiculo.tipo_abastecimento,
        },
        possuiCota: false,
        quantidadeSolicitada: qntLitros,
      };
    }

    // Verificar se tem periodicidade e quantidade configuradas
    if (!veiculo.periodicidade || !veiculo.quantidade) {
      return {
        message: 'Veículo possui controle de cota, mas não possui periodicidade ou quantidade configurada',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          tipo_abastecimento: veiculo.tipo_abastecimento,
          periodicidade: veiculo.periodicidade,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade.toString()) : null,
        },
        possuiCota: true,
        configuracaoIncompleta: true,
        quantidadeSolicitada: qntLitros,
      };
    }

    // Buscar a cota de período ativa que contém a data atual
    const dataAtual = new Date();
    const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId: veiculoId,
        periodicidade: veiculo.periodicidade,
        data_inicio_periodo: { lte: dataAtual },
        data_fim_periodo: { gte: dataAtual },
        ativo: true,
      },
      orderBy: {
        data_inicio_periodo: 'desc',
      },
    });

    // Calcular intervalo de período para uso no retorno
    const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

    // Se não encontrar cota período, calcular baseado em abastecimentos (fallback)
    let quantidadeUtilizada = 0;
    let quantidadeLimite = Number(veiculo.quantidade.toString());
    let quantidadeDisponivel = quantidadeLimite;
    let quantidadePermitida = quantidadeLimite;

    if (cotaPeriodo) {
      // Usar dados da tabela veiculo_cota_periodo
      quantidadeUtilizada = Number(cotaPeriodo.quantidade_utilizada.toString());
      quantidadePermitida = Number(cotaPeriodo.quantidade_permitida.toString());
      quantidadeDisponivel = Number(cotaPeriodo.quantidade_disponivel.toString());
      quantidadeLimite = quantidadePermitida;
    } else {
      // Fallback: calcular baseado em abastecimentos
      const abastecimentosPeriodo = await this.prisma.abastecimento.aggregate({
        _sum: {
          quantidade: true,
        },
        where: {
          veiculoId: veiculoId,
          data_abastecimento: {
            gte: inicio,
            lte: fim,
          },
          ativo: true,
          // Considerar apenas abastecimentos aprovados
          status: {
            in: [StatusAbastecimento.Aprovado],
          },
        },
      });

      quantidadeUtilizada = abastecimentosPeriodo._sum.quantidade
        ? Number(abastecimentosPeriodo._sum.quantidade.toString())
        : 0;
      quantidadeDisponivel = Math.max(0, quantidadeLimite - quantidadeUtilizada);
    }

    // Verificar se excedeu: quantidade solicitada deve ser <= quantidade_disponivel
    // Permitir quando quantidade_disponivel >= quantidade_solicitada (permite igualdade)
    const novaQuantidadeTotal = quantidadeUtilizada + qntLitros;
    const excedeu = qntLitros > quantidadeDisponivel;
    const excedeuPor = excedeu ? qntLitros - quantidadeDisponivel : 0;

    // Formatar nome da periodicidade
    const periodicidadeNome = {
      [Periodicidade.Diario]: 'Diária',
      [Periodicidade.Semanal]: 'Semanal',
      [Periodicidade.Mensal]: 'Mensal',
    }[veiculo.periodicidade] || veiculo.periodicidade;

    // Formatar mensagem
    let mensagem = '';
    if (excedeu) {
      mensagem = `A quantidade solicitada (${qntLitros} litros) excede a cota ${periodicidadeNome.toLowerCase()} do veículo. Cota disponível: ${quantidadeDisponivel.toFixed(2)} litros. Limite: ${quantidadeLimite.toFixed(2)} litros. Quantidade já utilizada no período: ${quantidadeUtilizada.toFixed(2)} litros. Excesso: ${excedeuPor.toFixed(2)} litros.`;
    } else {
      mensagem = `A quantidade solicitada (${qntLitros} litros) está dentro da cota ${periodicidadeNome.toLowerCase()} do veículo. Cota disponível: ${quantidadeDisponivel.toFixed(2)} litros. Limite: ${quantidadeLimite.toFixed(2)} litros. Quantidade já utilizada no período: ${quantidadeUtilizada.toFixed(2)} litros. Após este abastecimento, restará: ${(quantidadeDisponivel - qntLitros).toFixed(2)} litros.`;
    }

    return {
      message: mensagem,
      excedeu,
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        periodicidade: veiculo.periodicidade,
        periodicidadeNome,
      },
      cota: {
        quantidadeLimite: quantidadeLimite,
        quantidadeUtilizada: quantidadeUtilizada,
        quantidadeDisponivel: quantidadeDisponivel,
        quantidadeSolicitada: qntLitros,
        novaQuantidadeTotal: novaQuantidadeTotal,
        excedeuPor: excedeuPor,
      },
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        tipo: periodicidadeNome,
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
   * Cria abastecimento a partir de uma solicitação de QR Code de veículo
   * Para tipo_abastecimento LIVRE, COM_AUTORIZACAO e COM_COTA
   * Preenche automaticamente: veiculoId, motoristaId (se houver), empresaId, solicitanteId, abastecedorId, validadorId
   * Valida capacidade_tanque e CotaOrgao.restante
   * Atualiza CotaOrgao e Processo
   */
  async createFromQrCodeVeiculo(createDto: CreateAbastecimentoFromQrCodeVeiculoDto, user: any) {
    const { codigo_qrcode, combustivelId, quantidade, valor_total } = createDto;

    // Verificar se o código QR code foi informado
    if (!codigo_qrcode || codigo_qrcode.trim() === '') {
      throw new BadRequestException('Código QR code não informado');
    }

    // Verificar se o usuário pertence à empresa (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new AbastecimentoUsuarioSemEmpresaException({
        user: { id: user?.id, tipo: user?.tipo_usuario, email: user?.email },
        payload: createDto,
      });
    }

    // Buscar solicitação de QR Code veículo pelo código
    const solicitacaoQrCode = await (this.prisma as any).solicitacoesQrCodeVeiculo.findFirst({
      where: { codigo_qrcode: codigo_qrcode.trim() },
      include: {
        veiculo: {
          include: {
            orgao: {
              select: {
                id: true,
                prefeituraId: true,
              },
            },
          },
        },
        prefeitura: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!solicitacaoQrCode) {
      throw new NotFoundException(`Solicitação de QR Code veículo com código "${codigo_qrcode.trim()}" não encontrada`);
    }

    // Verificar se o QR code está ativo (status válidos para uso)
    const statusValidos = ['Aprovado', 'Em_Producao', 'Integracao', 'Concluida'];
    if (!statusValidos.includes(solicitacaoQrCode.status)) {
      throw new NotFoundException(
        `QR code não está ativo. Status atual: ${solicitacaoQrCode.status}. Apenas QR codes com status "Aprovado", "Em_Producao", "Integracao" ou "Concluida" podem ser utilizados.`
      );
    }

    const veiculo = solicitacaoQrCode.veiculo;
    const veiculoId = veiculo.id;
    const prefeituraId = solicitacaoQrCode.prefeitura_id;

    // Verificar se veículo está ativo
    if (!veiculo.ativo) {
      throw new AbastecimentoVeiculoInativoException(veiculoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar tipo_abastecimento do veículo (deve ser LIVRE, COM_AUTORIZACAO ou COM_COTA)
    if (veiculo.tipo_abastecimento !== TipoAbastecimentoVeiculo.LIVRE && 
        veiculo.tipo_abastecimento !== TipoAbastecimentoVeiculo.COM_AUTORIZACAO &&
        veiculo.tipo_abastecimento !== TipoAbastecimentoVeiculo.COTA) {
      throw new BadRequestException(
        `Esta rota é apenas para veículos com tipo_abastecimento LIVRE, COM_AUTORIZACAO ou COM_COTA. Veículo possui tipo: ${veiculo.tipo_abastecimento}`
      );
    }

    // Verificar se combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new AbastecimentoCombustivelNotFoundException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se combustível está ativo
    if (!combustivel.ativo) {
      throw new AbastecimentoCombustivelInativoException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se combustível está vinculado ao veículo
    const combustivelVinculado = await this.prisma.veiculoCombustivel.findFirst({
      where: {
        veiculoId: veiculoId,
        combustivelId: combustivelId,
        ativo: true,
      },
    });

    if (!combustivelVinculado) {
      throw new AbastecimentoCombustivelNaoVinculadoVeiculoException(veiculoId, combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Validar quantidade vs capacidade do tanque
    if (veiculo.capacidade_tanque && quantidade > Number(veiculo.capacidade_tanque)) {
      throw new AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException(
        quantidade,
        Number(veiculo.capacidade_tanque),
        veiculoId,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Validar CotaOrgao.restante para LIVRE e COM_AUTORIZACAO
    if (!veiculo.orgao?.id) {
      throw new BadRequestException(
        `Veículo não possui órgão vinculado. Não é possível criar abastecimento para tipo ${veiculo.tipo_abastecimento}`
      );
    }

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
    });

    if (!processo) {
      throw new BadRequestException(
        `Não foi encontrado processo ativo para a prefeitura ${prefeituraId}`
      );
    }

    // Buscar CotaOrgao para o órgão, combustível e processo
    const cotaOrgao = await this.prisma.cotaOrgao.findFirst({
      where: {
        processoId: processo.id,
        orgaoId: veiculo.orgao.id,
        combustivelId,
        ativa: true,
      },
    });

    if (!cotaOrgao) {
      throw new AbastecimentoCotaNotFoundException(0, {
        additionalInfo: {
          message: `Cota de órgão não encontrada para o veículo ${veiculoId}, órgão ${veiculo.orgao.id}, combustível ${combustivelId} e processo ${processo.id}`,
        },
      });
    }

    // Verificar se o restante da cota é suficiente
    const restante = cotaOrgao.restante ? Number(cotaOrgao.restante.toString()) : 0;
    if (restante < quantidade) {
      throw new BadRequestException(
        `Quantidade solicitada (${quantidade}L) excede o restante disponível na cota do órgão (${restante}L). Veículo: ${veiculo.nome}, Órgão: ${veiculo.orgao.id}, Combustível: ${combustivelId}`
      );
    }

    // Usar motoristaId do DTO se fornecido, caso contrário buscar automaticamente do veículo
    let motoristaId: number | null = null;
    if (createDto.motoristaId) {
      motoristaId = createDto.motoristaId;
    } else {
      // Buscar motorista vinculado ao veículo (se houver)
      const veiculoMotorista = await this.prisma.veiculoMotorista.findFirst({
        where: {
          veiculoId: veiculoId,
          ativo: true,
          data_inicio: { lte: new Date() },
          OR: [
            { data_fim: null },
            { data_fim: { gte: new Date() } },
          ],
        },
        orderBy: {
          data_inicio: 'desc',
        },
        take: 1,
      });
      motoristaId = veiculoMotorista?.motoristaId || null;
    }

    // Validar motorista se fornecido
    if (motoristaId) {
      const motorista = await this.prisma.motorista.findUnique({
        where: { id: motoristaId },
        include: {
          prefeitura: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!motorista) {
        throw new AbastecimentoMotoristaNotFoundException(motoristaId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        });
      }
      // Verificar se motorista pertence à mesma prefeitura do veículo
      if (veiculo.orgao?.prefeituraId && motorista.prefeituraId !== veiculo.orgao.prefeituraId) {
        throw new AbastecimentoMotoristaNaoPertencePrefeituraException(motoristaId, veiculoId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        });
      }
    }

    // Usar empresaId do DTO se fornecido, caso contrário usar do usuário logado
    const empresaId = createDto.empresaId || user.empresa.id;
    
    // Validar empresa se fornecido
    if (createDto.empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) {
        throw new AbastecimentoEmpresaNotFoundException(empresaId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        });
      }
      if (!empresa.ativo) {
        throw new AbastecimentoEmpresaInativaException(empresaId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        });
      }
    }

    // Validar outros campos obrigatórios
    if (!quantidade || quantidade <= 0) {
      throw new AbastecimentoQuantidadeInvalidaException(quantidade || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    if (!valor_total || valor_total < 0) {
      throw new AbastecimentoValorTotalInvalidoException(valor_total || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Normalizar e validar data de abastecimento (se informada)
    // Segue o mesmo padrão de data_solicitacao em solicitacao-abastecimento
    let dataAbastecimentoParaSalvar: Date;
    if (createDto.data_abastecimento) {
      const dataAbastecimentoNormalizada = this.ensureDate(
        this.normalizeDateInput(createDto.data_abastecimento),
        'data_abastecimento',
      );
      
      // Validar data de abastecimento (não pode ser futura)
      const dataAtual = new Date();
      if (dataAbastecimentoNormalizada > dataAtual) {
        throw new AbastecimentoDataAbastecimentoFuturaException(dataAbastecimentoNormalizada, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        });
      }
      
      dataAbastecimentoParaSalvar = dataAbastecimentoNormalizada;
    } else {
      // Usar data atual na timezone de Fortaleza
      dataAbastecimentoParaSalvar = this.getCurrentDateInFortaleza();
    }

    // Validar chave de acesso NFE (se informada)
    if (createDto.nfe_chave_acesso && (createDto.nfe_chave_acesso.length !== 44 || !/^\d+$/.test(createDto.nfe_chave_acesso))) {
      throw new AbastecimentoNFEChaveAcessoInvalidaException(createDto.nfe_chave_acesso, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Validar URLs da NFE (se informadas)
    if (createDto.nfe_img_url && !createDto.nfe_img_url.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_img_url', createDto.nfe_img_url, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    if (createDto.nfe_link && !createDto.nfe_link.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_link', createDto.nfe_link, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Validar nfe_link único por empresa (apenas para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (createDto.nfe_link && user?.tipo_usuario && 
        (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA')) {
      // Verificar se já existe um abastecimento da mesma empresa com o mesmo nfe_link
      const abastecimentoComMesmoNfeLink = await this.prisma.abastecimento.findFirst({
        where: {
          empresaId: empresaId,
          nfe_link: createDto.nfe_link,
        },
      });

      if (abastecimentoComMesmoNfeLink) {
        throw new BadRequestException(
          `Já existe um abastecimento da empresa com o nfe_link "${createDto.nfe_link}". O nfe_link deve ser único por empresa.`
        );
      }
    }

    // Validar desconto (se informado)
    const descontoValor = createDto.desconto || 0;
    if (descontoValor > valor_total) {
      throw new AbastecimentoDescontoMaiorQueValorException(descontoValor, valor_total, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Validar consistência do valor total (se preco_empresa e quantidade estiverem informados)
    if (createDto.preco_empresa && quantidade) {
      const valorCalculado = quantidade * createDto.preco_empresa - descontoValor;
      // Permitir pequena diferença devido a arredondamentos (0.01)
      if (Math.abs(valor_total - valorCalculado) > 0.01) {
        throw new AbastecimentoValorTotalInconsistenteException(
          valor_total,
          quantidade,
          createDto.preco_empresa,
          descontoValor,
          {
            user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
            payload: createDto,
          }
        );
      }
    }

    // Criar abastecimento e atualizar cota e processo em transação
    const abastecimento = await this.prisma.$transaction(async (tx) => {
      // Criar abastecimento com dados preenchidos automaticamente
      // Status já vem como Aprovado para abastecimentos criados via QR code
      const dataAprovacao = new Date();
      const dataCreate: any = {
        veiculoId,
        motoristaId,
        combustivelId,
        empresaId,
        solicitanteId: user.id,
        abastecedorId: user.empresa.id,
        validadorId: user.id,
        tipo_abastecimento: createDto.tipo_abastecimento,
        quantidade: new Decimal(quantidade),
        preco_anp: createDto.preco_anp ? new Decimal(createDto.preco_anp) : null,
        preco_empresa: createDto.preco_empresa ? new Decimal(createDto.preco_empresa) : null,
        desconto: createDto.desconto ? new Decimal(createDto.desconto) : new Decimal(0),
        valor_total: new Decimal(valor_total),
        data_abastecimento: dataAbastecimentoParaSalvar,
        odometro: createDto.odometro || null,
        orimetro: createDto.orimetro || null,
        nfe_chave_acesso: createDto.nfe_chave_acesso || null,
        nfe_img_url: createDto.nfe_img_url || null,
        nfe_link: createDto.nfe_link || null,
        conta_faturamento_orgao_id: createDto.conta_faturamento_orgao_id || null,
        cota_id: cotaOrgao.id,
        status: StatusAbastecimento.Aprovado,
        data_aprovacao: dataAprovacao,
        aprovado_por: user.nome || user.email || 'Sistema',
        aprovado_por_email: user.email || null,
      };
      
      if (createDto.observacao) {
        dataCreate.observacao = createDto.observacao;
      }

      const abastecimentoCriado = await tx.abastecimento.create({
        data: dataCreate,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          cota: {
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          },
        },
      });

      // Atualizar CotaOrgao (isso também atualiza o Processo automaticamente)
      try {
        await this.atualizarCotaOrgao(tx, cotaOrgao.id, quantidade, valor_total);
        
        // Buscar cota atualizada para incluir no resultado
        const cotaAtualizada = await tx.cotaOrgao.findUnique({
          where: { id: cotaOrgao.id },
          select: {
            id: true,
            quantidade: true,
            quantidade_utilizada: true,
            valor_utilizado: true,
            restante: true,
            saldo_disponivel_cota: true,
          },
        });
        
        // Atualizar cota no objeto retornado
        if (cotaAtualizada) {
          (abastecimentoCriado as any).cota = cotaAtualizada;
        }
      } catch (error) {
        // Se for uma exceção conhecida, relançar
        if (error instanceof AbastecimentoCotaNotFoundException) {
          throw error;
        }
        // Caso contrário, transformar em erro mais descritivo
        console.error(`Erro ao atualizar CotaOrgao ${cotaOrgao.id}:`, error);
        throw new Error(
          `Falha ao atualizar cota do órgão após abastecimento: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Atualizar VeiculoCotaPeriodo se o tipo_abastecimento for COTA
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
        try {
          await this.atualizarVeiculoCotaPeriodo(
            tx,
            veiculoId,
            veiculo.periodicidade,
            dataAbastecimentoParaSalvar,
            quantidade,
          );
        } catch (error) {
          // Log do erro mas não falha a transação se não encontrar período
          console.warn(`Erro ao atualizar VeiculoCotaPeriodo para veículo ${veiculoId}:`, error);
        }
      }

      return abastecimentoCriado;
    });

    return {
      message: 'Abastecimento criado com sucesso a partir da solicitação de QR Code veículo',
      abastecimento,
    };
  }

  private normalizeDateInput(value?: string | Date | null): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    const trimmed = value.toString().trim();
    if (!trimmed) {
      return undefined;
    }

    const isoWithTimezone = this.timezoneSuffixRegex.test(trimmed)
      ? trimmed
      : `${trimmed}${this.defaultTimezoneOffset}`;

    const parsed = new Date(isoWithTimezone);
    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  /**
   * Retorna a data/hora atual na timezone America/Fortaleza (UTC-3)
   * Garante que a data seja salva considerando o horário de Fortaleza
   * 
   * Esta função pega o horário UTC atual, converte para Fortaleza (subtraindo 3 horas),
   * e cria uma data que representa esse horário em Fortaleza.
   * Ao salvar no banco, o Prisma salva em UTC, mas o valor representa o horário correto de Fortaleza.
   */
  private getCurrentDateInFortaleza(): Date {
    const now = new Date();
    
    // Obter componentes UTC
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDay = now.getUTCDate();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcMilliseconds = now.getUTCMilliseconds();

    // Converter UTC para Fortaleza (UTC-3): subtrair 3 horas
    let fortalezaHours = utcHours - 3;
    let fortalezaDay = utcDay;
    let fortalezaMonth = utcMonth;
    let fortalezaYear = utcYear;

    // Ajustar se passar da meia-noite (horas negativas)
    if (fortalezaHours < 0) {
      fortalezaHours += 24;
      fortalezaDay--;
      if (fortalezaDay < 1) {
        fortalezaMonth--;
        if (fortalezaMonth < 0) {
          fortalezaMonth = 11;
          fortalezaYear--;
        }
        // Obter último dia do mês anterior
        fortalezaDay = new Date(Date.UTC(fortalezaYear, fortalezaMonth + 1, 0)).getUTCDate();
      }
    }

    // Criar uma string ISO com o horário de Fortaleza e timezone -03:00
    // Isso garante que o JavaScript interprete como horário de Fortaleza
    const isoString = `${fortalezaYear}-${String(fortalezaMonth + 1).padStart(2, '0')}-${String(fortalezaDay).padStart(2, '0')}T${String(fortalezaHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:${String(utcSeconds).padStart(2, '0')}.${String(utcMilliseconds).padStart(3, '0')}-03:00`;
    
    // Criar Date a partir da string com timezone de Fortaleza
    // O JavaScript automaticamente converte para UTC ao salvar no banco
    // Exemplo: "2025-01-15T10:00:00-03:00" vira 13:00:00 UTC no banco
    return new Date(isoString);
  }

  private ensureDate(value: Date | undefined, fieldName: string): Date {
    if (!value) {
      throw new BadRequestException(`Campo ${fieldName} possui data inválida ou não foi informado`);
    }

    return value;
  }
}
