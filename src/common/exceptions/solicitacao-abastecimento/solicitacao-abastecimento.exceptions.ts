import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Solicitações de Abastecimento';

type SolicitacaoAction = 'create' | 'list' | 'detail' | 'update' | 'delete' | 'approve' | 'reject' | 'validate';

type ContextOverrides = Partial<Omit<CrudExceptionContext, 'module'>>;

const BASE_CONTEXTS: Record<SolicitacaoAction, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Registrar nova solicitação de abastecimento',
    route: '/solicitacoes-abastecimento',
    method: 'POST',
    expected: 'Criar solicitação de abastecimento com dados válidos.',
    performed: 'Tentativa de criar nova solicitação de abastecimento.',
  },
  list: {
    action: 'LIST',
    operation: 'Listar solicitações de abastecimento',
    route: '/solicitacoes-abastecimento',
    method: 'GET',
    expected: 'Filtrar e listar solicitações conforme parâmetros informados.',
    performed: 'Solicitação para listar solicitações de abastecimento.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar solicitação de abastecimento por ID',
    route: '/solicitacoes-abastecimento/:id',
    method: 'GET',
    expected: 'Recuperar solicitação existente pelo identificador informado.',
    performed: 'Requisição para consultar detalhes da solicitação.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar solicitação de abastecimento',
    route: '/solicitacoes-abastecimento/:id',
    method: 'PATCH',
    expected: 'Atualizar solicitação com dados consistentes e status permitido.',
    performed: 'Tentativa de atualizar uma solicitação de abastecimento.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir solicitação de abastecimento',
    route: '/solicitacoes-abastecimento/:id',
    method: 'DELETE',
    expected: 'Remover solicitação não vinculada a abastecimentos efetivados.',
    performed: 'Tentativa de excluir uma solicitação de abastecimento.',
  },
  validate: {
    action: 'CREATE',
    operation: 'Validar dados para solicitação de abastecimento',
    route: '/solicitacoes-abastecimento',
    method: 'POST',
    expected: 'Preencher todos os campos obrigatórios de acordo com o veículo selecionado.',
    performed: 'Validação de campos fornecidos pelo usuário.',
  },
  approve: {
    action: 'UPDATE',
    operation: 'Aprovar solicitação de abastecimento',
    route: '/solicitacoes-abastecimento/:id/approve',
    method: 'PATCH',
    expected: 'Aprovar solicitação pendente com dados válidos.',
    performed: 'Tentativa de aprovar solicitação de abastecimento.',
  },
  reject: {
    action: 'UPDATE',
    operation: 'Rejeitar solicitação de abastecimento',
    route: '/solicitacoes-abastecimento/:id/reject',
    method: 'PATCH',
    expected: 'Rejeitar solicitação pendente informando motivo válido.',
    performed: 'Tentativa de rejeitar solicitação de abastecimento.',
  },
};

const buildContext = (action: SolicitacaoAction, overrides: ContextOverrides = {}): CrudExceptionContext => {
  const base = BASE_CONTEXTS[action];
  return {
    module: MODULE,
    action: overrides.action ?? base.action,
    operation: overrides.operation ?? base.operation,
    route: overrides.route ?? base.route,
    method: overrides.method ?? base.method,
    expected: overrides.expected ?? base.expected,
    performed: overrides.performed ?? base.performed,
    resourceId: overrides.resourceId,
    payload: overrides.payload,
    query: overrides.query,
    user: overrides.user,
    correlationId: overrides.correlationId,
    additionalInfo: overrides.additionalInfo,
  };
};

type ContextMeta = Partial<
  Pick<
    CrudExceptionContext,
    | 'resourceId'
    | 'payload'
    | 'query'
    | 'user'
    | 'correlationId'
    | 'additionalInfo'
    | 'expected'
    | 'performed'
    | 'route'
    | 'method'
    | 'action'
    | 'operation'
  >
>;

export class SolicitacaoAbastecimentoNotFoundException extends CrudException {
  constructor(id: number, action: SolicitacaoAction = 'detail', overrides: ContextMeta = {}) {
    super({
      message: `Solicitação de abastecimento com ID ${id} não foi encontrada.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_NOT_FOUND',
      context: buildContext(action, {
        resourceId: id,
        expected: 'Localizar solicitação previamente cadastrada.',
        performed: `Tentativa de acessar a solicitação ${id}.`,
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoPrefeituraNaoInformadaException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'Não foi possível identificar a prefeitura do usuário. Acesse com um perfil vinculado a uma prefeitura ativa para solicitar abastecimentos.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PREFEITURA_NAO_INFORMADA',
      context: buildContext('validate', {
        expected: 'Usuário autenticado vinculado a uma prefeitura válida.',
        performed: 'Validação da prefeitura do usuário ao iniciar solicitação.',
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoVeiculoNaoPertencePrefeituraException extends CrudException {
  constructor(veiculoId: number, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `O veículo ${veiculoId} não pertence à prefeitura ${prefeituraId}. Selecionar veículos cadastrados na mesma prefeitura do usuário.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_PREFEITURA_MISMATCH',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Utilizar veículo vinculado à prefeitura do solicitante.',
        performed: `Validação de veículo ${veiculoId} para prefeitura ${prefeituraId}.`,
        additionalInfo: { veiculoId, prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoEmpresaNaoPertencePrefeituraException extends CrudException {
  constructor(empresaId: number, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `A empresa ${empresaId} não está autorizada pela prefeitura ${prefeituraId}. Escolha uma empresa contratada pela prefeitura.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_EMPRESA_PREFEITURA_MISMATCH',
      context: buildContext('validate', {
        resourceId: empresaId,
        expected: 'Selecionar empresa com contrato ativo na prefeitura.',
        performed: `Validação da empresa ${empresaId} para prefeitura ${prefeituraId}.`,
        additionalInfo: { empresaId, prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCombustivelNaoRelacionadoException extends CrudException {
  constructor(combustivelId: number, veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `O combustível ${combustivelId} não está associado ao veículo ${veiculoId}. Vincule o combustível ao veículo antes de solicitar o abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COMBUSTIVEL_NAO_RELACIONADO',
      context: buildContext('validate', {
        resourceId: combustivelId,
        expected: 'Utilizar combustível previamente liberado para o veículo.',
        performed: `Validação do combustível ${combustivelId} para o veículo ${veiculoId}.`,
        additionalInfo: { combustivelId, veiculoId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException extends CrudException {
  constructor(combustivelId: number, empresaId: number, overrides: ContextMeta = {}) {
    super({
      message: `O combustível ${combustivelId} não possui preço definido para a empresa ${empresaId}. Cadastre o preço do combustível para esta empresa antes de solicitar o abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COMBUSTIVEL_PRECO_NAO_DEFINIDO',
      context: buildContext('validate', {
        resourceId: combustivelId,
        expected: 'Utilizar combustível com preço cadastrado e ativo para a empresa.',
        performed: `Validação de preço do combustível ${combustivelId} para a empresa ${empresaId}.`,
        additionalInfo: { combustivelId, empresaId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoMotoristaNaoPertencePrefeituraException extends CrudException {
  constructor(motoristaId: number, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `O motorista ${motoristaId} não pertence à prefeitura ${prefeituraId}. Escolha um motorista habilitado pela prefeitura responsável.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_MOTORISTA_PREFEITURA_MISMATCH',
      context: buildContext('validate', {
        resourceId: motoristaId,
        expected: 'Selecionar motorista vinculado à prefeitura do veículo.',
        performed: `Validação do motorista ${motoristaId} na prefeitura ${prefeituraId}.`,
        additionalInfo: { motoristaId, prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoTipoVeiculoIncompativelException extends CrudException {
  constructor(tipoVeiculo: string, tipoSolicitacao: string, overrides: ContextMeta = {}) {
    super({
      message: `O veículo configurado com tipo de abastecimento "${tipoVeiculo}" não aceita solicitações do tipo "${tipoSolicitacao}". Ajuste a configuração do veículo ou selecione outro tipo de solicitação.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_TIPO_INCOMPATIVEL',
      context: buildContext('validate', {
        expected: 'Alinhar o tipo de solicitação com a configuração do veículo.',
        performed: 'Verificação de compatibilidade entre tipo do veículo e solicitação.',
        additionalInfo: { tipoVeiculo, tipoSolicitacao },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoPeriodicidadeNaoConfiguradaException extends CrudException {
  constructor(veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `O veículo ${veiculoId} utiliza controle por cota, mas não possui periodicidade configurada. Defina a periodicidade (Diário, Semanal ou Mensal) antes de registrar a solicitação.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PERIODICIDADE_AUSENTE',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Informar periodicidade para veículos com cota.',
        performed: 'Validação da periodicidade configurada para o veículo.',
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoQuantidadeObrigatoriaException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'Informe a quantidade de litros a ser abastecida. Esse campo é obrigatório para concluir a solicitação.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_QUANTIDADE_OBRIGATORIA',
      context: buildContext('validate', {
        expected: 'Definir quantidade de litros maior que zero.',
        performed: 'Validação de quantidade ausente na solicitação.',
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoPrefeituraInvalidaException extends CrudException {
  constructor(prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `Prefeitura ${prefeituraId} não encontrada ou inativa para vincular à solicitação.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PREFEITURA_INVALIDA',
      context: buildContext('create', {
        resourceId: prefeituraId,
        expected: 'Selecionar prefeitura ativa e válida.',
        performed: `Validação da prefeitura ${prefeituraId} falhou.`,
        additionalInfo: { prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoVeiculoInvalidoException extends CrudException {
  constructor(veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Veículo ${veiculoId} não está disponível ou não pertence à prefeitura responsável.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_INVALIDO',
      context: buildContext('create', {
        resourceId: veiculoId,
        expected: 'Selecionar veículo ativo e autorizado para abastecimento.',
        performed: `Validação do veículo ${veiculoId} falhou.`,
        additionalInfo: { veiculoId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoMotoristaInvalidoException extends CrudException {
  constructor(motoristaId: number, overrides: ContextMeta = {}) {
    super({
      message: `Motorista ${motoristaId} não foi encontrado ou está inativo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_MOTORISTA_INVALIDO',
      context: buildContext('create', {
        resourceId: motoristaId,
        expected: 'Selecionar motorista cadastrado e ativo.',
        performed: `Validação do motorista ${motoristaId} falhou.`,
        additionalInfo: { motoristaId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCombustivelInvalidoException extends CrudException {
  constructor(combustivelId: number, overrides: ContextMeta = {}) {
    super({
      message: `Combustível ${combustivelId} não está disponível para a prefeitura solicitante.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COMBUSTIVEL_INVALIDO',
      context: buildContext('create', {
        resourceId: combustivelId,
        expected: 'Selecionar combustível permitido para o veículo informado.',
        performed: `Validação do combustível ${combustivelId} falhou.`,
        additionalInfo: { combustivelId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoEmpresaInvalidaException extends CrudException {
  constructor(empresaId: number, overrides: ContextMeta = {}) {
    super({
      message: `Empresa ${empresaId} não foi localizada ou não está habilitada a atender a prefeitura.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_EMPRESA_INVALIDA',
      context: buildContext('create', {
        resourceId: empresaId,
        expected: 'Selecionar empresa parceira com contrato vigente.',
        performed: `Validação da empresa ${empresaId} falhou.`,
        additionalInfo: { empresaId },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoQuantidadeInvalidaException extends CrudException {
  constructor(quantidade: number, limiteDisponivel?: number, overrides: ContextMeta = {}) {
    super({
      message: limiteDisponivel
        ? `Quantidade solicitada (${quantidade} L) excede o limite disponível (${limiteDisponivel} L) para o veículo.`
        : `Quantidade solicitada (${quantidade} L) é inválida para esta solicitação.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_QUANTIDADE_INVALIDA',
      context: buildContext('create', {
        expected: 'Informar quantidade positiva e dentro da cota permitida.',
        performed: `Validação de quantidade falhou para ${quantidade} L.`,
        additionalInfo: { quantidade, limiteDisponivel },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoDataExpiracaoInvalidaException extends CrudException {
  constructor(dataSolicitacao: Date, dataExpiracao: Date, overrides: ContextMeta = {}) {
    super({
      message: `Data de expiração (${dataExpiracao.toISOString()}) não pode ser anterior à data da solicitação (${dataSolicitacao.toISOString()}).`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_DATA_EXPIRACAO_INVALIDA',
      context: buildContext('create', {
        expected: 'Definir data de expiração posterior à data da solicitação.',
        performed: 'Validação de datas falhou.',
        additionalInfo: { dataSolicitacao, dataExpiracao },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoStatusInvalidoException extends CrudException {
  constructor(status: string, allowed: string[], overrides: ContextMeta = {}) {
    super({
      message: `Status "${status}" é inválido. Valores permitidos: ${allowed.join(', ')}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_STATUS_INVALIDO',
      context: buildContext('update', {
        expected: 'Utilizar status compatível com o fluxo da solicitação.',
        performed: `Tentativa de atualizar status para "${status}".`,
        additionalInfo: { status, allowed },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoNaoPendenteException extends CrudException {
  constructor(id: number, statusAtual: string, action: SolicitacaoAction, overrides: ContextMeta = {}) {
    super({
      message: `Solicitação ${id} não está pendente (status atual: ${statusAtual}) e não pode ser ${action === 'approve' ? 'aprovada' : 'rejeitada'}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_NAO_PENDENTE',
      context: buildContext(action, {
        resourceId: id,
        expected: 'Somente solicitações pendentes podem ter decisão de aprovação ou rejeição.',
        performed: `Tentativa de ${action === 'approve' ? 'aprovar' : 'rejeitar'} solicitação com status "${statusAtual}".`,
        additionalInfo: { statusAtual },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoMotivoRejeicaoObrigatorioException extends CrudException {
  constructor(id: number, overrides: ContextMeta = {}) {
    super({
      message: `É obrigatório informar o motivo de rejeição para a solicitação ${id}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_MOTIVO_REJEICAO_OBRIGATORIO',
      context: buildContext('reject', {
        resourceId: id,
        expected: 'Preencher justificativa clara ao rejeitar solicitação.',
        performed: 'Tentativa de rejeição sem motivo informado.',
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoAbastecimentoVinculadoException extends CrudException {
  constructor(id: number, abastecimentoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Solicitação ${id} está vinculada ao abastecimento ${abastecimentoId} e não pode ser removida.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_ABASTECIMENTO_VINCULADO',
      context: buildContext('delete', {
        resourceId: id,
        expected: 'Somente solicitações sem abastecimento vinculado podem ser excluídas.',
        performed: `Tentativa de excluir solicitação com abastecimento ${abastecimentoId}.`,
        additionalInfo: { abastecimentoId },
        ...overrides,
      }),
    });
  }
}

