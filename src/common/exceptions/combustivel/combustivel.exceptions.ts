import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Combustíveis';

type CombustivelOperation = 'create' | 'list' | 'detail' | 'update' | 'delete';

type ContextOverrides = Partial<Omit<CrudExceptionContext, 'module'>>;

const BASE_CONTEXTS: Record<CombustivelOperation, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Registrar novo combustível',
    route: '/combustiveis',
    method: 'POST',
    expected: 'Criar um combustível com dados inéditos e válidos.',
    performed: 'Requisição para criar um novo combustível.',
  },
  list: {
    action: 'LIST',
    operation: 'Listar combustíveis',
    route: '/combustiveis',
    method: 'GET',
    expected: 'Listar combustíveis conforme filtros informados.',
    performed: 'Requisição para listar combustíveis.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar combustível por ID',
    route: '/combustiveis/:id',
    method: 'GET',
    expected: 'Recuperar combustível existente pelo identificador informado.',
    performed: 'Requisição para buscar combustível específico.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar combustível existente',
    route: '/combustiveis/:id',
    method: 'PATCH',
    expected: 'Atualizar combustível existente com dados válidos.',
    performed: 'Requisição para atualizar combustível existente.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir combustível existente',
    route: '/combustiveis/:id',
    method: 'DELETE',
    expected: 'Excluir combustível sem vínculos impeditivos.',
    performed: 'Requisição para excluir combustível existente.',
  },
};

const buildContext = (operation: CombustivelOperation, overrides: ContextOverrides = {}): CrudExceptionContext => {
  const base = BASE_CONTEXTS[operation];
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

export class CombustivelNotFoundException extends CrudException {
  constructor(id?: number, operation: CombustivelOperation = 'detail', overrides: ContextMeta = {}) {
    super({
      message: id ? `Combustível com ID ${id} não encontrado.` : 'Combustível não encontrado.',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'COMBUSTIVEL_NOT_FOUND',
      context: buildContext(operation, {
        resourceId: id,
        performed: `Tentativa de recuperar combustível ${id ? `com ID ${id}` : 'pelo identificador fornecido'}.`,
        expected: 'Encontrar combustível existente no banco de dados.',
        ...overrides,
      }),
    });
  }
}

export class CombustivelAlreadyExistsException extends CrudException {
  constructor(nome: string, sigla?: string, overrides: ContextMeta = {}) {
    const baseMessage = sigla
      ? `Já existe um combustível com o nome "${nome}" ou sigla "${sigla}".`
      : `Já existe um combustível com o nome "${nome}".`;

    super({
      message: baseMessage,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'COMBUSTIVEL_ALREADY_EXISTS',
      context: buildContext('create', {
        payload: {
          nome,
          sigla,
          ...(overrides.payload ?? {}),
        },
        expected: 'Cadastrar combustível com nome e sigla únicos.',
        performed: `Tentativa de criar combustível "${nome}"${sigla ? ` (${sigla})` : ''}.`,
        ...overrides,
      }),
    });
  }
}

export class CombustivelInactiveException extends CrudException {
  constructor(id?: number, nome?: string, overrides: ContextMeta = {}) {
    const identifier = nome ? `"${nome}"` : id ? `ID ${id}` : 'informado';
    super({
      message: `Combustível ${identifier} está inativo.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'COMBUSTIVEL_INACTIVE',
      context: buildContext('detail', {
        resourceId: id,
        expected: 'Acessar combustível ativo para a operação solicitada.',
        performed: `Combustível ${identifier} encontrado, porém marcado como inativo.`,
        additionalInfo: {
          nome,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelCannotDeleteWithRelationsException extends CrudException {
  constructor(relations: string[], overrides: ContextMeta = {}) {
    const formattedRelations = relations.length > 0 ? relations.join(', ') : 'relacionamentos ativos';
    super({
      message: `Não é possível excluir combustível devido a ${formattedRelations}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_DELETE_WITH_RELATIONS',
      context: buildContext('delete', {
        expected: 'Excluir combustível sem vínculos impeditivos.',
        performed: `Tentativa de exclusão bloqueada por vínculos: ${formattedRelations}.`,
        additionalInfo: {
          relations,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidNomeException extends CrudException {
  constructor(nome: string, overrides: ContextMeta = {}) {
    super({
      message: `Nome do combustível inválido: "${nome}". Deve possuir ao menos 2 caracteres.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_NOME',
      context: buildContext('create', {
        expected: 'Informar nome de combustível com tamanho mínimo válido.',
        performed: `Validação de nome falhou para "${nome}".`,
        payload: {
          nome,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidSiglaException extends CrudException {
  constructor(sigla: string, overrides: ContextMeta = {}) {
    super({
      message: `Sigla inválida: "${sigla}". Deve conter entre 2 e 10 caracteres.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_SIGLA',
      context: buildContext('create', {
        expected: 'Informar sigla em formato válido.',
        performed: `Validação de sigla falhou para "${sigla}".`,
        payload: {
          sigla,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidTipoException extends CrudException {
  constructor(tipo: string, overrides: ContextMeta = {}) {
    super({
      message: `Tipo de combustível inválido: "${tipo}".`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_TIPO',
      context: buildContext('create', {
        expected: 'Informar tipo de combustível reconhecido pelo sistema.',
        performed: `Validação de tipo falhou para "${tipo}".`,
        payload: {
          tipo,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidPrecoException extends CrudException {
  constructor(preco: number, overrides: ContextMeta = {}) {
    super({
      message: `Preço inválido: ${preco}. Deve ser um valor numérico maior que zero.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_PRECO',
      context: buildContext('update', {
        expected: 'Informar preço positivo e válido.',
        performed: `Validação de preço falhou para valor ${preco}.`,
        payload: {
          preco,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidAnpException extends CrudException {
  constructor(anp: string, overrides: ContextMeta = {}) {
    super({
      message: `Código ANP inválido: "${anp}".`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_ANP',
      context: buildContext('create', {
        expected: 'Informar código ANP existente e válido.',
        performed: `Validação de código ANP falhou para "${anp}".`,
        payload: {
          anp,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelMissingEmpresaException extends CrudException {
  constructor(empresaId: number, overrides: ContextMeta = {}) {
    super({
      message: `Empresa com ID ${empresaId} não encontrada para relacionar ao combustível.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_EMPRESA_NOT_FOUND',
      context: buildContext('create', {
        expected: 'Vincular combustível a empresa válida.',
        performed: `Empresa ${empresaId} não identificada durante processo de criação/atualização.`,
        additionalInfo: {
          empresaId,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelUnauthorizedException extends CrudException {
  constructor(action: string, overrides: ContextMeta = {}) {
    super({
      message: `Usuário não tem permissão para ${action} combustível.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'COMBUSTIVEL_UNAUTHORIZED',
      context: buildContext('detail', {
        expected: 'Usuário autorizado a executar a operação.',
        performed: `Bloqueio de permissão ao tentar ${action} combustível.`,
        ...overrides,
      }),
    });
  }
}

export class CombustivelDuplicateNomeException extends CrudException {
  constructor(nome: string, overrides: ContextMeta = {}) {
    super({
      message: `Já existe um combustível com o nome "${nome}".`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'COMBUSTIVEL_DUPLICATE_NOME',
      context: buildContext('create', {
        expected: 'Informar nome ainda não cadastrado.',
        performed: `Detecção de nome duplicado "${nome}".`,
        payload: {
          nome,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelDuplicateSiglaException extends CrudException {
  constructor(sigla: string, overrides: ContextMeta = {}) {
    super({
      message: `Já existe um combustível com a sigla "${sigla}".`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'COMBUSTIVEL_DUPLICATE_SIGLA',
      context: buildContext('create', {
        expected: 'Informar sigla ainda não cadastrada.',
        performed: `Detecção de sigla duplicada "${sigla}".`,
        payload: {
          sigla,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelInvalidStatusException extends CrudException {
  constructor(status: string, overrides: ContextMeta = {}) {
    super({
      message: `Status inválido: "${status}".`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_INVALID_STATUS',
      context: buildContext('update', {
        expected: 'Informar status reconhecido pelo sistema.',
        performed: `Validação de status falhou para "${status}".`,
        payload: {
          status,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class CombustivelPriceUpdateException extends CrudException {
  constructor(combustivelId: number, oldPrice: number, newPrice: number, overrides: ContextMeta = {}) {
    super({
      message: `Erro ao atualizar preço do combustível ${combustivelId}: ${oldPrice} → ${newPrice}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'COMBUSTIVEL_PRICE_UPDATE_ERROR',
      context: buildContext('update', {
        resourceId: combustivelId,
        expected: 'Atualizar preço dentro das regras de negócio.',
        performed: `Falha na atualização de preço de ${oldPrice} para ${newPrice}.`,
        payload: {
          combustivelId,
          oldPrice,
          newPrice,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}
