import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Preços de Combustível por Empresa';

type EmpresaPrecoCombustivelOperation =
  | 'create'
  | 'list'
  | 'detail'
  | 'update'
  | 'delete'
  | 'updatePreco';

type ContextOverrides = Partial<
  Omit<
    CrudExceptionContext,
    'module' | 'action' | 'operation' | 'route' | 'method' | 'expected' | 'performed'
  >
> &
  Partial<Pick<CrudExceptionContext, 'expected' | 'performed' | 'route' | 'method' | 'action' | 'operation'>>;

const BASE_CONTEXTS: Record<EmpresaPrecoCombustivelOperation, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Cadastrar preço de combustível para empresa',
    route: '/empresa-preco-combustivel',
    method: 'POST',
    expected: 'Registrar preço com dados ANP vigentes e únicos por empresa/combustível.',
    performed: 'Tentativa de criar novo preço de combustível vinculado à empresa.',
  },
  list: {
    action: 'LIST',
    operation: 'Consultar preços de combustíveis por empresa',
    route: '/empresa-preco-combustivel',
    method: 'GET',
    expected: 'Listar preços conforme filtros e empresa vinculada ao usuário.',
    performed: 'Requisição para listar preços de combustíveis da empresa autenticada.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar preço de combustível por ID',
    route: '/empresa-preco-combustivel/:id',
    method: 'GET',
    expected: 'Recuperar preço existente da empresa informada.',
    performed: 'Requisição para buscar preço de combustível específico.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar preço de combustível existente',
    route: '/empresa-preco-combustivel/:id',
    method: 'PATCH',
    expected: 'Atualizar preço com dados válidos e consistentes com ANP.',
    performed: 'Tentativa de atualizar preço de combustível existente.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir preço de combustível',
    route: '/empresa-preco-combustivel/:id',
    method: 'DELETE',
    expected: 'Remover preço pertencente à empresa do usuário autenticado.',
    performed: 'Tentativa de exclusão de preço de combustível.',
  },
  updatePreco: {
    action: 'UPDATE',
    operation: 'Sincronizar preço atual com dados da ANP',
    route: '/empresa-preco-combustivel/preco-atual',
    method: 'PATCH',
    expected: 'Atualizar preço com base em teto ANP vigente para a UF da empresa.',
    performed: 'Solicitação de atualização automática do preço atual a partir da ANP.',
  },
};

const buildContext = (
  operation: EmpresaPrecoCombustivelOperation,
  overrides: ContextOverrides = {},
): CrudExceptionContext => {
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

export class EmpresaPrecoCombustivelUsuarioSemEmpresaException extends CrudException {
  constructor(operation: EmpresaPrecoCombustivelOperation = 'create', overrides: ContextMeta = {}) {
    super({
      message: 'Usuário autenticado não está vinculado a uma empresa ativa. Operação abortada.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_USER_WITHOUT_EMPRESA',
      context: buildContext(operation, {
        expected: 'Usuário associado a uma empresa válida para manipular preços.',
        performed: 'Usuário autenticado tentou operar preços sem vínculo empresarial.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelEmpresaNaoEncontradaException extends CrudException {
  constructor(empresaId: number, operation: EmpresaPrecoCombustivelOperation = 'create', overrides: ContextMeta = {}) {
    super({
      message: `Empresa com ID ${empresaId} não foi localizada para vincular o preço de combustível.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_EMPRESA_NOT_FOUND',
      context: buildContext(operation, {
        resourceId: empresaId,
        expected: 'Empresa existente e acessível para registrar preços.',
        performed: `Busca por empresa ${empresaId} falhou durante operação de preços.`,
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelCombustivelNaoEncontradoException extends CrudException {
  constructor(
    combustivelId: number,
    operation: EmpresaPrecoCombustivelOperation = 'create',
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Combustível com ID ${combustivelId} não foi localizado para vincular ao preço da empresa.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_COMBUSTIVEL_NOT_FOUND',
      context: buildContext(operation, {
        resourceId: combustivelId,
        expected: 'Combustível existente para relacionar ao preço da empresa.',
        performed: `Busca por combustível ${combustivelId} falhou durante operação de preços.`,
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoJaAtivoException extends CrudException {
  constructor(
    empresaId: number,
    combustivelId: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Já existe um preço ativo cadastrado para a empresa ${empresaId} e combustível ${combustivelId}.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ACTIVE_ALREADY_EXISTS',
      context: buildContext('create', {
        resourceId: `${empresaId}:${combustivelId}`,
        expected: 'Cada empresa deve possuir apenas um preço ativo por combustível.',
        performed: `Tentativa de duplicar preço ativo para empresa ${empresaId} e combustível ${combustivelId}.`,
        additionalInfo: {
          empresaId,
          combustivelId,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelNaoEncontradoException extends CrudException {
  constructor(id?: number, overrides: ContextMeta = {}) {
    super({
      message: id
        ? `Preço de combustível com ID ${id} não foi localizado.`
        : 'Preço de combustível não foi localizado.',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_NOT_FOUND',
      context: buildContext('detail', {
        resourceId: id,
        expected: 'Preço existente cadastrado para a empresa.',
        performed: `Tentativa de recuperar preço ${id ? `com ID ${id}` : 'informado'} resultou em vazio.`,
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelAcessoNegadoException extends CrudException {
  constructor(
    precoId: number,
    empresaId: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Preço de combustível ${precoId} não pertence à empresa ${empresaId}. Acesso negado.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_FORBIDDEN',
      context: buildContext('detail', {
        resourceId: precoId,
        expected: 'Manipular apenas preços pertencentes à empresa vinculada ao usuário.',
        performed: `Tentativa de acessar preço ${precoId} associado a empresa diferente (${empresaId}).`,
        additionalInfo: {
          empresaId,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelTipoCombustivelNaoMapeadoException extends CrudException {
  constructor(nome: string, sigla: string, overrides: ContextMeta = {}) {
    super({
      message: `Combustível "${nome}" (${sigla}) não pôde ser mapeado para um tipo ANP válido.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_UNMAPPED_ANP_TYPE',
      context: buildContext('updatePreco', {
        expected: 'Combustível com nome/sigla compatíveis com a tabela ANP.',
        performed: `Mapeamento ANP falhou para combustível "${nome}" (${sigla}).`,
        additionalInfo: {
          combustivel: { nome, sigla },
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelSemanaAnpNaoEncontradaException extends CrudException {
  constructor(anpSemanaId?: number, overrides: ContextMeta = {}) {
    super({
      message: anpSemanaId
        ? `Semana ANP com ID ${anpSemanaId} não foi encontrada.`
        : 'Nenhuma semana ANP ativa foi encontrada. Configure uma semana ANP ativa antes de prosseguir.',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_WEEK_NOT_FOUND',
      context: buildContext('updatePreco', {
        resourceId: anpSemanaId,
        expected: 'Semana ANP ativa e cadastrada para consulta de preços.',
        performed: anpSemanaId
          ? `Tentativa de utilizar semana ANP ${anpSemanaId}, porém inexistente.`
          : 'Busca por semana ANP ativa retornou vazio.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAnpNaoEncontradoException extends CrudException {
  constructor(uf: string, tipoCombustivel: string, overrides: ContextMeta = {}) {
    super({
      message: `Preço ANP não encontrado para a UF ${uf} e combustível ${tipoCombustivel}. Verifique se a importação foi realizada.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_PRICE_NOT_FOUND',
      context: buildContext('updatePreco', {
        expected: 'Dados ANP disponíveis para a UF e combustível informados.',
        performed: `Consulta ANP para UF ${uf} e combustível ${tipoCombustivel} retornou vazio.`,
        additionalInfo: {
          uf,
          combustivel: tipoCombustivel,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAnpSemTetoCalculadoException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'O registro ANP localizado não possui teto calculado. Calcule o teto antes de cadastrar o preço.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_PRICE_WITHOUT_TETO',
      context: buildContext('updatePreco', {
        expected: 'Registro ANP com teto calculado para subsidiar o preço.',
        performed: 'Validação de teto ANP detectou ausência do valor calculado.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAnpSemPrecoMinimoException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'O registro ANP localizado não possui preço mínimo configurado.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_PRICE_WITHOUT_MIN',
      context: buildContext('updatePreco', {
        expected: 'Registro ANP com preço mínimo definido.',
        performed: 'Validação de preço mínimo ANP identificou ausência do valor.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAnpSemBaseUtilizadaException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'O registro ANP localizado não possui base utilizada definida.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_PRICE_WITHOUT_BASE',
      context: buildContext('updatePreco', {
        expected: 'Registro ANP com base utilizada informada.',
        performed: 'Validação da base utilizada ANP identificou ausência.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelMargemAnpAusenteException extends CrudException {
  constructor(overrides: ContextMeta = {}) {
    super({
      message: 'Margem aplicada não encontrada na tabela ANP para a combinação informada.',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_ANP_MARGIN_MISSING',
      context: buildContext('updatePreco', {
        expected: 'Registro ANP com margem aplicada configurada.',
        performed: 'Validação da margem ANP identificou ausência do percentual aplicado.',
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoNegativoException extends CrudException {
  constructor(preco: number, overrides: ContextMeta = {}) {
    super({
      message: `Preço ${preco.toFixed(2)} é inválido. Informe um valor maior ou igual a 0.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_PRICE_NEGATIVE',
      context: buildContext('create', {
        expected: 'Preço informado não pode ser negativo.',
        performed: `Validação rejeitou preço negativo ${preco}.`,
        payload: {
          preco,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAcimaDoTetoException extends CrudException {
  constructor(preco: number, teto: number, overrides: ContextMeta = {}) {
    super({
      message: `Preço informado R$ ${preco.toFixed(2)} ultrapassa o teto vigente R$ ${teto.toFixed(2)}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_PRICE_ABOVE_TETO',
      context: buildContext('create', {
        expected: 'Preço menor ou igual ao teto ANP vigente.',
        performed: `Validação ANP detectou preço ${preco} acima do teto ${teto}.`,
        additionalInfo: {
          preco,
          teto,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelPrecoAbaixoDoMinimoException extends CrudException {
  constructor(preco: number, minimo: number, overrides: ContextMeta = {}) {
    super({
      message: `Preço informado R$ ${preco.toFixed(2)} está abaixo do preço mínimo ANP R$ ${minimo.toFixed(2)}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_PRICE_BELOW_MIN',
      context: buildContext('create', {
        expected: 'Preço maior ou igual ao preço mínimo ANP.',
        performed: `Validação ANP detectou preço ${preco} abaixo do mínimo ${minimo}.`,
        additionalInfo: {
          preco,
          minimo,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelStatusInvalidoException extends CrudException {
  constructor(status: string, overrides: ContextMeta = {}) {
    super({
      message: `Status "${status}" é inválido. Utilize valores reconhecidos pelo sistema.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_INVALID_STATUS',
      context: buildContext('update', {
        expected: 'Status pertencente ao enum de preços.',
        performed: `Validação rejeitou status "${status}".`,
        payload: {
          status,
          ...(overrides.payload ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelValorBaseAusenteException extends CrudException {
  constructor(base: string, overrides: ContextMeta = {}) {
    super({
      message: `Valor para a base ANP "${base}" não está disponível no registro consultado.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_BASE_VALUE_MISSING',
      context: buildContext('updatePreco', {
        expected: 'Registro ANP com valor correspondente à base utilizada.',
        performed: `Validação identificou ausência de valor para a base "${base}".`,
        additionalInfo: {
          base,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}

export class EmpresaPrecoCombustivelBaseAnpNaoSuportadaException extends CrudException {
  constructor(base: string, overrides: ContextMeta = {}) {
    super({
      message: `Base ANP "${base}" não é suportada para cálculo do preço.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'EMPRESA_PRECO_COMBUSTIVEL_UNSUPPORTED_BASE',
      context: buildContext('updatePreco', {
        expected: 'Base ANP reconhecida pelo sistema (MINIMO, MEDIO ou MAXIMO).',
        performed: `Validação identificou base ANP não suportada "${base}".`,
        additionalInfo: {
          base,
          ...(overrides.additionalInfo ?? {}),
        },
        ...overrides,
      }),
    });
  }
}


