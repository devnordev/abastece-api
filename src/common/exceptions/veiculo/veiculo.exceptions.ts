import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Veículos';

type VeiculoAction =
  | 'create'
  | 'list'
  | 'detail'
  | 'update'
  | 'delete'
  | 'assignMotorista'
  | 'manageCombustivel'
  | 'validate';

type ContextOverrides = Partial<Omit<CrudExceptionContext, 'module'>>;

const BASE_CONTEXTS: Record<VeiculoAction, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Cadastrar novo veículo',
    route: '/veiculos',
    method: 'POST',
    expected: 'Informar dados completos e válidos para o veículo.',
    performed: 'Tentativa de cadastrar veículo.',
  },
  list: {
    action: 'LIST',
    operation: 'Listar veículos',
    route: '/veiculos',
    method: 'GET',
    expected: 'Filtrar ou listar veículos da prefeitura conforme parâmetros.',
    performed: 'Requisição de listagem de veículos.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar veículo por ID',
    route: '/veiculos/:id',
    method: 'GET',
    expected: 'Localizar veículo existente pelo identificador informado.',
    performed: 'Tentativa de visualizar detalhes do veículo.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar veículo',
    route: '/veiculos/:id',
    method: 'PUT',
    expected: 'Atualizar dados do veículo respeitando regras de negócio.',
    performed: 'Tentativa de atualizar veículo cadastrado.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir veículo',
    route: '/veiculos/:id',
    method: 'DELETE',
    expected: 'Excluir veículo sem vínculos impeditivos.',
    performed: 'Tentativa de remover veículo.',
  },
  assignMotorista: {
    action: 'UPDATE',
    operation: 'Relacionar motorista ao veículo',
    route: '/veiculos/:id/motoristas',
    method: 'POST',
    expected: 'Associar motoristas ativos pertencentes à prefeitura.',
    performed: 'Tentativa de vincular motorista ao veículo.',
  },
  manageCombustivel: {
    action: 'UPDATE',
    operation: 'Gerenciar combustíveis do veículo',
    route: '/veiculos/:id/combustiveis',
    method: 'POST',
    expected: 'Selecionar combustíveis compatíveis com o veículo.',
    performed: 'Tentativa de vincular combustíveis ao veículo.',
  },
  validate: {
    action: 'UPDATE',
    operation: 'Validar dados de veículo',
    route: '/veiculos',
    method: 'POST',
    expected: 'Preencher campos obrigatórios de acordo com o tipo de abastecimento.',
    performed: 'Validação de dados do veículo informados pelo usuário.',
  },
};

const buildContext = (action: VeiculoAction, overrides: ContextOverrides = {}): CrudExceptionContext => {
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

export class VeiculoNotFoundException extends CrudException {
  constructor(id?: number, placa?: string, action: VeiculoAction = 'detail', overrides: ContextMeta = {}) {
    const identifier = id ? `ID ${id}` : placa ? `a placa ${placa}` : 'o identificador informado';
    super({
      message: `Não localizamos um veículo para ${identifier}. Verifique se o cadastro existe e está ativo.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'VEICULO_NOT_FOUND',
      context: buildContext(action, {
        resourceId: id ?? placa,
        expected: 'Encontrar veículo previamente cadastrado.',
        performed: `Busca de veículo utilizando ${identifier}.`,
        additionalInfo: { id, placa },
        ...overrides,
      }),
    });
  }
}

export class VeiculoAlreadyExistsException extends CrudException {
  constructor(placa: string, overrides: ContextMeta = {}) {
    super({
      message: `Já existe um veículo cadastrado com a placa "${placa}". Utilize outra placa ou edite o cadastro existente.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'VEICULO_ALREADY_EXISTS',
      context: buildContext('create', {
        payload: { placa },
        expected: 'Cadastrar veículos com placa única por prefeitura.',
        performed: `Tentativa de cadastrar placa duplicada "${placa}".`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoDuplicatePlacaException extends VeiculoAlreadyExistsException {}

export class VeiculoInactiveException extends CrudException {
  constructor(id: number, overrides: ContextMeta = {}) {
    super({
      message: `O veículo ${id} está inativo e não pode ser utilizado nesta operação.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'VEICULO_INACTIVE',
      context: buildContext('detail', {
        resourceId: id,
        expected: 'Selecionar veículo ativo e liberado para uso.',
        performed: `Tentativa de utilizar veículo inativo ${id}.`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoCannotDeleteWithRelationsException extends CrudException {
  constructor(id: number, relations: string[], overrides: ContextMeta = {}) {
    const formatted = relations.length ? relations.join(', ') : 'relacionamentos ativos';
    super({
      message: `Não é possível excluir o veículo ${id} pois ele possui ${formatted}. Revise os vínculos antes de continuar.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_DELETE_WITH_RELATIONS',
      context: buildContext('delete', {
        resourceId: id,
        expected: 'Remover veículos sem vínculos impeditivos.',
        performed: `Tentativa de excluir veículo com vínculos pendentes: ${formatted}.`,
        additionalInfo: { relations },
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidPlacaException extends CrudException {
  constructor(placa: string, overrides: ContextMeta = {}) {
    super({
      message: `A placa "${placa}" está em formato inválido. Utilize o padrão ABC-1234 ou ABC1D23 (Mercosul).`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_PLACA_INVALIDA',
      context: buildContext('validate', {
        payload: { placa },
        expected: 'Informar placa válida de acordo com o padrão nacional.',
        performed: `Validação de placa informada: "${placa}".`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidTipoException extends CrudException {
  constructor(tipo: string, tiposPermitidos: string[], overrides: ContextMeta = {}) {
    super({
      message: `Tipo de veículo "${tipo}" é inválido. Valores aceitos: ${tiposPermitidos.join(', ')}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_TIPO_INVALIDO',
      context: buildContext('validate', {
        payload: { tipo },
        additionalInfo: { tiposPermitidos },
        expected: 'Selecionar tipo de veículo listado no sistema.',
        performed: `Validação do tipo de veículo "${tipo}".`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidSituacaoException extends CrudException {
  constructor(situacao: string, situacoesPermitidas: string[], overrides: ContextMeta = {}) {
    super({
      message: `Situação "${situacao}" não é reconhecida. Opções válidas: ${situacoesPermitidas.join(', ')}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_SITUACAO_INVALIDA',
      context: buildContext('validate', {
        payload: { situacao },
        additionalInfo: { situacoesPermitidas },
        expected: 'Informar situação compatível com as opções do sistema.',
        performed: `Validação da situação do veículo "${situacao}".`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoPrefeituraNotFoundException extends CrudException {
  constructor(prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `A prefeitura ${prefeituraId} não foi localizada ou está inativa. Confirme o vínculo antes de continuar.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_PREFEITURA_INVALIDA',
      context: buildContext('create', {
        resourceId: prefeituraId,
        expected: 'Utilizar prefeitura válida e ativa.',
        performed: `Validação da prefeitura ${prefeituraId} para o veículo.`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoOrgaoNotFoundException extends CrudException {
  constructor(orgaoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Órgão ${orgaoId} não foi encontrado. Verifique se existe e está vinculado à prefeitura informada.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_ORGAO_INVALIDO',
      context: buildContext('create', {
        resourceId: orgaoId,
        expected: 'Selecionar órgão existente na prefeitura.',
        performed: `Tentativa de vincular órgão ${orgaoId} inexistente.`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoOrgaoPrefeituraMismatchException extends CrudException {
  constructor(orgaoId: number, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `O órgão ${orgaoId} não pertence à prefeitura ${prefeituraId}. Atualize o vínculo ou selecione outro órgão.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_ORGAO_PREFEITURA_MISMATCH',
      context: buildContext('create', {
        resourceId: orgaoId,
        expected: 'Vincular veículo a órgão da mesma prefeitura.',
        performed: `Validação de órgão ${orgaoId} para prefeitura ${prefeituraId}.`,
        additionalInfo: { orgaoId, prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class VeiculoPeriodicidadeObrigatoriaException extends CrudException {
  constructor(tipoAbastecimento: string, overrides: ContextMeta = {}) {
    super({
      message: `Para veículos do tipo de abastecimento "${tipoAbastecimento}" é obrigatório informar a periodicidade (Diário, Semanal ou Mensal).`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_PERIODICIDADE_OBRIGATORIA',
      context: buildContext('validate', {
        expected: 'Definir periodicidade quando o veículo utiliza controle por cota.',
        performed: 'Validação da periodicidade para veículo com cota.',
        additionalInfo: { tipoAbastecimento },
        ...overrides,
      }),
    });
  }
}

export class VeiculoPeriodicidadeInvalidaException extends CrudException {
  constructor(periodicidade: string, overrides: ContextMeta = {}) {
    super({
      message: `Periodicidade "${periodicidade}" não é reconhecida. Use Diário, Semanal ou Mensal.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_PERIODICIDADE_INVALIDA',
      context: buildContext('validate', {
        payload: { periodicidade },
        expected: 'Selecionar periodicidade compatível com o controle de cota.',
        performed: `Validação da periodicidade informada: "${periodicidade}".`,
        ...overrides,
      }),
    });
  }
}

export class VeiculoQuantidadeObrigatoriaException extends CrudException {
  constructor(periodicidade: string, overrides: ContextMeta = {}) {
    super({
      message: `Informe a quantidade de litros permitida para a periodicidade "${periodicidade}". Sem esse limite não é possível controlar a cota.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_QUANTIDADE_OBRIGATORIA',
      context: buildContext('validate', {
        expected: 'Registrar quantidade máxima compatível com a periodicidade.',
        performed: 'Validação da quantidade de litros permitidos.',
        additionalInfo: { periodicidade },
        ...overrides,
      }),
    });
  }
}

export class VeiculoCapacidadeTanqueInvalidaException extends CrudException {
  constructor(capacidade: number, overrides: ContextMeta = {}) {
    super({
      message: `Capacidade do tanque ${capacidade} L é inválida. Informe um valor positivo e compatível com o veículo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_CAPACIDADE_INVALIDA',
      context: buildContext('validate', {
        payload: { capacidade },
        expected: 'Definir capacidade do tanque maior que zero.',
        performed: 'Validação da capacidade do tanque.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoQuantidadeExcedeCapacidadeException extends CrudException {
  constructor(quantidade: number, capacidade: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade configurada (${quantidade} L) não pode exceder a capacidade do tanque (${capacidade} L). Ajuste os valores informados.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_QUANTIDADE_EXCEDE_CAPACIDADE',
      context: buildContext('validate', {
        expected: 'Garantir que a quantidade permitida esteja dentro da capacidade do tanque.',
        performed: 'Comparação entre quantidade informada e capacidade do tanque.',
        additionalInfo: { quantidade, capacidade },
        ...overrides,
      }),
    });
  }
}

export class VeiculoCombustivelNaoEncontradoException extends CrudException {
  constructor(ids: number[], overrides: ContextMeta = {}) {
    super({
      message: `Alguns combustíveis informados não foram encontrados: ${ids.join(', ')}. Revise a lista selecionada.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_COMBUSTIVEL_NAO_ENCONTRADO',
      context: buildContext('manageCombustivel', {
        payload: { combustivelIds: ids },
        expected: 'Selecionar combustíveis existentes e ativos.',
        performed: 'Validação dos combustíveis vinculados ao veículo.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoCombustivelDuplicadoException extends CrudException {
  constructor(duplicados: number[], overrides: ContextMeta = {}) {
    super({
      message: `Os combustíveis ${duplicados.join(', ')} já estão vinculados ao veículo. Não é necessário adicioná-los novamente.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'VEICULO_COMBUSTIVEL_DUPLICADO',
      context: buildContext('manageCombustivel', {
        payload: { combustivelIdsDuplicados: duplicados },
        expected: 'Evitar vínculos duplicados de combustíveis.',
        performed: 'Checagem de combustíveis já associados.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoCategoriaNaoEncontradaException extends CrudException {
  constructor(ids: number[], overrides: ContextMeta = {}) {
    super({
      message: `Algumas categorias não foram encontradas: ${ids.join(', ')}. Confirme se pertencem à prefeitura.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_CATEGORIA_NAO_ENCONTRADA',
      context: buildContext('validate', {
        payload: { categoriaIds: ids },
        expected: 'Utilizar categorias existentes para a prefeitura.',
        performed: 'Validação das categorias selecionadas para o veículo.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoMotoristaNaoEncontradoException extends CrudException {
  constructor(ids: number[], overrides: ContextMeta = {}) {
    super({
      message: `Os motoristas ${ids.join(', ')} não foram encontrados ou estão inativos. Utilize apenas motoristas válidos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_MOTORISTA_NAO_ENCONTRADO',
      context: buildContext('assignMotorista', {
        payload: { motoristaIds: ids },
        expected: 'Selecionar motoristas existentes e ativos.',
        performed: 'Validação dos motoristas informados para o veículo.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoMotoristaPrefeituraMismatchException extends CrudException {
  constructor(motoristaId: number, prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `O motorista ${motoristaId} não pertence à prefeitura ${prefeituraId}. Selecione um motorista vinculado à mesma prefeitura do veículo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_MOTORISTA_PREFEITURA_MISMATCH',
      context: buildContext('assignMotorista', {
        resourceId: motoristaId,
        expected: 'Relacionar motoristas vinculados à prefeitura do veículo.',
        performed: `Validação do motorista ${motoristaId} para a prefeitura ${prefeituraId}.`,
        additionalInfo: { motoristaId, prefeituraId },
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidAnoException extends CrudException {
  constructor(ano: number, overrides: ContextMeta = {}) {
    const currentYear = new Date().getFullYear();
    super({
      message: `Ano de fabricação ${ano} é inválido. Informe um valor entre 1900 e ${currentYear + 1}.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_ANO_INVALIDO',
      context: buildContext('validate', {
        payload: { ano },
        expected: 'Informar ano de fabricação coerente com o veículo.',
        performed: 'Validação do ano de fabricação informado.',
        additionalInfo: { intervaloPermitido: `1900-${currentYear + 1}` },
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidQuilometragemException extends CrudException {
  constructor(quilometragem: number, overrides: ContextMeta = {}) {
    super({
      message: `Quilometragem ${quilometragem} km é inválida. Informe um valor numérico igual ou superior a zero.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_QUILOMETRAGEM_INVALIDA',
      context: buildContext('validate', {
        payload: { quilometragem },
        expected: 'Registrar quilometragem como valor positivo ou zero.',
        performed: 'Validação da quilometragem informada.',
        ...overrides,
      }),
    });
  }
}

export class VeiculoUnauthorizedException extends CrudException {
  constructor(action: string, userId?: number, overrides: ContextMeta = {}) {
    super({
      message: userId
        ? `Usuário ${userId} não possui permissão para ${action} veículos nesta prefeitura.`
        : `Você não possui permissão para ${action} veículos nesta prefeitura.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'VEICULO_UNAUTHORIZED',
      context: buildContext('validate', {
        user: { id: userId },
        expected: 'Realizar a operação com um perfil autorizado.',
        performed: `Tentativa de ${action} veículo sem permissão.`,
        additionalInfo: { action },
        ...overrides,
      }),
    });
  }
}

export class VeiculoInvalidImageException extends CrudException {
  constructor(fileName?: string, mimeType?: string, overrides: ContextMeta = {}) {
    const fileMessage = fileName ? `Arquivo "${fileName}"` : 'A imagem enviada';
    super({
      message: `${fileMessage} não é suportado. Envie arquivos JPG ou PNG com até 5 MB.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'VEICULO_IMAGEM_INVALIDA',
      context: buildContext('validate', {
        payload: { fileName, mimeType },
        expected: 'Anexar imagens nos formatos suportados (JPG/PNG).',
        performed: 'Validação do arquivo de imagem do veículo.',
        additionalInfo: { formatosPermitidos: ['image/jpeg', 'image/png'] },
        ...overrides,
      }),
    });
  }
}
