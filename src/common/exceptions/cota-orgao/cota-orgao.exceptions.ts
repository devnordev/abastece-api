import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Cotas de Órgão';

type CotaOrgaoAction =
  | 'create'
  | 'list'
  | 'detail'
  | 'update'
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'allocate'
  | 'validate';

type ContextOverrides = Partial<Omit<CrudExceptionContext, 'module'>>;

const BASE_CONTEXTS: Record<CotaOrgaoAction, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Cadastrar cota de órgão',
    route: '/cota-orgao',
    method: 'POST',
    expected: 'Informar processo, órgão, combustível e quantidade válidos.',
    performed: 'Tentativa de criar nova cota de órgão.',
  },
  list: {
    action: 'LIST',
    operation: 'Listar cotas de órgão',
    route: '/cota-orgao',
    method: 'GET',
    expected: 'Filtrar e listar cotas conforme parâmetros informados.',
    performed: 'Solicitação para listar cotas de órgão.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar cota de órgão por ID',
    route: '/cota-orgao/:id',
    method: 'GET',
    expected: 'Recuperar cota existente pelo identificador informado.',
    performed: 'Requisição para buscar detalhes de cota específica.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar cota de órgão',
    route: '/cota-orgao/:id',
    method: 'PATCH',
    expected: 'Atualizar cota respeitando quantidade disponível e uso já realizado.',
    performed: 'Tentativa de atualizar dados de cota de órgão.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir cota de órgão',
    route: '/cota-orgao/:id',
    method: 'DELETE',
    expected: 'Remover cota sem abastecimentos vinculados.',
    performed: 'Tentativa de excluir cota de órgão.',
  },
  activate: {
    action: 'UPDATE',
    operation: 'Ativar cota de órgão',
    route: '/cota-orgao/:id/ativar',
    method: 'PATCH',
    expected: 'Ativar cota inativa mantendo consistência com o processo.',
    performed: 'Tentativa de ativar cota de órgão.',
  },
  deactivate: {
    action: 'UPDATE',
    operation: 'Desativar cota de órgão',
    route: '/cota-orgao/:id/desativar',
    method: 'PATCH',
    expected: 'Desativar cota sem comprometer abastecimentos vigentes.',
    performed: 'Tentativa de desativar cota de órgão.',
  },
  allocate: {
    action: 'UPDATE',
    operation: 'Alocar quantidade de combustível para órgão',
    route: '/cota-orgao',
    method: 'POST',
    expected: 'Distribuir quantidade de combustível sem ultrapassar o processo.',
    performed: 'Distribuição de quantidade de combustível entre órgãos.',
  },
  validate: {
    action: 'CREATE',
    operation: 'Validar dados para cota de órgão',
    route: '/cota-orgao',
    method: 'POST',
    expected: 'Preencher todos os campos obrigatórios com dados válidos.',
    performed: 'Validação de dados informados pelo usuário.',
  },
};

const buildContext = (action: CotaOrgaoAction, overrides: ContextOverrides = {}): CrudExceptionContext => {
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

export class CotaOrgaoNotFoundException extends CrudException {
  constructor(id: number, action: CotaOrgaoAction = 'detail', overrides: ContextMeta = {}) {
    super({
      message: `Cota de órgão com ID ${id} não foi encontrada.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'COTA_ORGAO_NOT_FOUND',
      context: buildContext(action, {
        resourceId: id,
        expected: 'Localizar cota previamente cadastrada.',
        performed: `Tentativa de acessar cota ${id}.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoProcessoNotFoundException extends CrudException {
  constructor(processoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Processo ${processoId} não foi localizado. Selecione um processo ativo para registrar cotas.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'COTA_ORGAO_PROCESSO_NOT_FOUND',
      context: buildContext('create', {
        resourceId: processoId,
        expected: 'Selecionar processo existente e ativo.',
        performed: `Validação do processo ${processoId}.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoOrgaoNotFoundException extends CrudException {
  constructor(orgaoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Órgão ${orgaoId} não foi encontrado. Verifique se está cadastrado e ativo na prefeitura.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'COTA_ORGAO_ORGAO_NOT_FOUND',
      context: buildContext('create', {
        resourceId: orgaoId,
        expected: 'Selecionar órgão existente e ativo.',
        performed: `Validação do órgão ${orgaoId}.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoCombustivelNotFoundException extends CrudException {
  constructor(combustivelId: number, overrides: ContextMeta = {}) {
    super({
      message: `Combustível ${combustivelId} não está vinculado ao processo. Cadastre-o no processo antes de alocar cotas.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_COMBUSTIVEL_NOT_LINKED',
      context: buildContext('create', {
        resourceId: combustivelId,
        expected: 'Vincular combustível ao processo antes de distribuir cotas.',
        performed: `Validação do combustível ${combustivelId} no processo.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoOrgaoProcessoMismatchException extends CrudException {
  constructor(orgaoId: number, processoId: number, overrides: ContextMeta = {}) {
    super({
      message: `O órgão ${orgaoId} não pertence ao processo ${processoId}. Garanta que ambos compartilham a mesma prefeitura.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_ORGAO_PROCESSO_MISMATCH',
      context: buildContext('create', {
        resourceId: orgaoId,
        expected: 'Relacionar órgão da mesma prefeitura do processo.',
        performed: `Validação do órgão ${orgaoId} para o processo ${processoId}.`,
        additionalInfo: { orgaoId, processoId },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoDuplicateException extends CrudException {
  constructor(orgaoId: number, combustivelId: number, processoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Já existe cota cadastrada para o órgão ${orgaoId} com o combustível ${combustivelId} no processo ${processoId}. Atualize a cota existente ou selecione outro combustível.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'COTA_ORGAO_DUPLICATE',
      context: buildContext('create', {
        resourceId: orgaoId,
        expected: 'Cadastrar apenas uma cota por órgão e combustível dentro do mesmo processo.',
        performed: `Tentativa de criar cota duplicada. Órgão ${orgaoId}, combustível ${combustivelId}, processo ${processoId}.`,
        additionalInfo: { orgaoId, combustivelId, processoId },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoQuantidadeInvalidaException extends CrudException {
  constructor(quantidade: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade informada (${quantidade} L) é inválida. Informe um valor numérico positivo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_QUANTIDADE_INVALIDA',
      context: buildContext('validate', {
        payload: { quantidade },
        expected: 'Definir quantidade de litros maior que zero.',
        performed: 'Validação de quantidade para cota de órgão.',
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoQuantidadeExcedeProcessoException extends CrudException {
  constructor(quantidadeSolicitada: number, quantidadeDisponivel: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade solicitada (${quantidadeSolicitada} L) excede a disponível no processo (${quantidadeDisponivel} L). Ajuste o valor para permanecer dentro do limite.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_QUANTIDADE_EXCEDE_PROCESSO',
      context: buildContext('allocate', {
        payload: { quantidadeSolicitada },
        expected: 'Alocar combustível respeitando saldo disponível do processo.',
        performed: 'Distribuição de quantidade de combustível para órgão.',
        additionalInfo: { quantidadeSolicitada, quantidadeDisponivel },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoQuantidadeExcedeCombustivelException extends CrudException {
  constructor(
    quantidadeSolicitada: number,
    quantidadeDisponivelCombustivel: number,
    combustivelId: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Quantidade solicitada (${quantidadeSolicitada} L) para o combustível ${combustivelId} excede o limite definido no processo (${quantidadeDisponivelCombustivel} L). Ajuste a cota para permanecer dentro da quantidade_litros configurada para este combustível.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_QUANTIDADE_EXCEDE_COMBUSTIVEL',
      context: buildContext('allocate', {
        payload: { quantidadeSolicitada, combustivelId },
        expected:
          'Distribuir combustível entre órgãos respeitando a quantidade_litros do ProcessoCombustivel.',
        performed: 'Distribuição de quantidade de combustível para órgão por combustível.',
        additionalInfo: { quantidadeSolicitada, quantidadeDisponivelCombustivel, combustivelId },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoQuantidadeInferiorUtilizadaException extends CrudException {
  constructor(quantidadeSolicitada: number, quantidadeUtilizada: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade informada (${quantidadeSolicitada} L) é menor que o volume já utilizado (${quantidadeUtilizada} L). Informe um valor igual ou superior ao já consumido.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORГАО_QUANTIDADE_INFERIOR_UTILIZADA',
      context: buildContext('update', {
        payload: { quantidadeSolicitada },
        expected: 'Garantir que a nova quantidade seja maior ou igual à quantidade já utilizada.',
        performed: 'Atualização de quantidade da cota.',
        additionalInfo: { quantidadeSolicitada, quantidadeUtilizada },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoAtivaException extends CrudException {
  constructor(id: number, overrides: ContextMeta = {}) {
    super({
      message: `A cota ${id} já está ativa.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_JA_ATIVA',
      context: buildContext('activate', {
        resourceId: id,
        expected: 'Ativar somente cotas desativadas.',
        performed: `Tentativa de ativar cota ${id} que já estava ativa.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoInativaException extends CrudException {
  constructor(id: number, overrides: ContextMeta = {}) {
    super({
      message: `A cota ${id} já está desativada.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COTA_ORGAO_JA_INATIVA',
      context: buildContext('deactivate', {
        resourceId: id,
        expected: 'Desativar apenas cotas ativas.',
        performed: `Tentativa de desativar cota ${id} que já estava inativa.`,
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoPossuiAbastecimentosException extends CrudException {
  constructor(id: number, totalAbastecimentos: number, overrides: ContextMeta = {}) {
    super({
      message: `A cota ${id} possui ${totalAbastecimentos} abastecimento(s) vinculados. Exclua ou transfira esses registros antes de remover a cota.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'COTA_ORGAO_POSSUI_ABASTECIMENTOS',
      context: buildContext('delete', {
        resourceId: id,
        expected: 'Remover cotas sem abastecimentos vinculados.',
        performed: `Tentativa de excluir cota ${id} com abastecimentos associados.`,
        additionalInfo: { totalAbastecimentos },
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoUsuarioSemPermissaoException extends CrudException {
  constructor(userId: number | undefined, overrides: ContextMeta = {}) {
    super({
      message: 'Apenas administradores de prefeitura podem gerenciar cotas de órgão. Acesse com um perfil autorizado.',
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'COTA_ORGAO_USUARIO_SEM_PERMISSAO',
      context: buildContext('validate', {
        user: { id: userId },
        expected: 'Operação executada por usuário com perfil ADMIN_PREFEITURA.',
        performed: 'Verificação de permissão do usuário para gerenciar cotas.',
        ...overrides,
      }),
    });
  }
}

export class CotaOrgaoUsuarioPrefeituraDiferenteException extends CrudException {
  constructor(userId: number | undefined, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `Você não tem permissão para gerenciar cotas da prefeitura ${prefeituraId}.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'COTA_ORGAO_USUARIO_PREFEITURA_DIFERENTE',
      context: buildContext('validate', {
        user: { id: userId },
        expected: 'Gerenciar cotas da mesma prefeitura do usuário.',
        performed: 'Validação de prefeitura associada ao usuário.',
        additionalInfo: { prefeituraId },
        ...overrides,
      }),
    });
  }
}

