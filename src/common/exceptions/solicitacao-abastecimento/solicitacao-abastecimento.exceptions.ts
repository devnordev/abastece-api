import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Solicitações de Abastecimento';

type SolicitacaoAction = 'create' | 'list' | 'detail' | 'update' | 'delete' | 'approve' | 'reject';

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

