import { HttpStatus } from '@nestjs/common';
import { CrudException, CrudExceptionContext } from '../crud.exception';

const MODULE = 'Abastecimentos';

type AbastecimentoAction =
  | 'create'
  | 'createFromSolicitacao'
  | 'list'
  | 'detail'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'validate';

type ContextOverrides = Partial<Omit<CrudExceptionContext, 'module'>>;

const BASE_CONTEXTS: Record<AbastecimentoAction, Omit<CrudExceptionContext, 'module'>> = {
  create: {
    action: 'CREATE',
    operation: 'Cadastrar novo abastecimento',
    route: '/abastecimentos',
    method: 'POST',
    expected: 'Informar dados completos e válidos para o abastecimento. Campos obrigatórios: veiculoId, combustivelId, empresaId, tipo_abastecimento, quantidade, valor_total.',
    performed: 'Tentativa de cadastrar abastecimento.',
  },
  createFromSolicitacao: {
    action: 'CREATE',
    operation: 'Criar abastecimento a partir de solicitação',
    route: '/abastecimentos/from-solicitacao',
    method: 'POST',
    expected: 'Fornecer ID de solicitação válida (status PENDENTE ou APROVADA). Apenas usuários ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos.',
    performed: 'Tentativa de criar abastecimento a partir de solicitação.',
  },
  list: {
    action: 'LIST',
    operation: 'Listar abastecimentos',
    route: '/abastecimentos',
    method: 'GET',
    expected: 'Filtrar ou listar abastecimentos conforme parâmetros. Campos opcionais de filtro: veiculoId, motoristaId, combustivelId, empresaId, tipo_abastecimento, status, ativo, data_inicial, data_final.',
    performed: 'Requisição de listagem de abastecimentos.',
  },
  detail: {
    action: 'READ',
    operation: 'Consultar abastecimento por ID',
    route: '/abastecimentos/:id',
    method: 'GET',
    expected: 'Localizar abastecimento existente pelo identificador informado.',
    performed: 'Tentativa de visualizar detalhes do abastecimento.',
  },
  update: {
    action: 'UPDATE',
    operation: 'Atualizar abastecimento',
    route: '/abastecimentos/:id',
    method: 'PATCH',
    expected: 'Atualizar dados do abastecimento respeitando regras de negócio. Todos os campos são opcionais na atualização.',
    performed: 'Tentativa de atualizar abastecimento cadastrado.',
  },
  delete: {
    action: 'DELETE',
    operation: 'Excluir abastecimento',
    route: '/abastecimentos/:id',
    method: 'DELETE',
    expected: 'Excluir abastecimento sem vínculos impeditivos.',
    performed: 'Tentativa de remover abastecimento.',
  },
  approve: {
    action: 'UPDATE',
    operation: 'Aprovar abastecimento',
    route: '/abastecimentos/:id/approve',
    method: 'PATCH',
    expected: 'Aprovar abastecimento com status Aguardando. O abastecimento deve estar aguardando aprovação.',
    performed: 'Tentativa de aprovar abastecimento.',
  },
  reject: {
    action: 'UPDATE',
    operation: 'Rejeitar abastecimento',
    route: '/abastecimentos/:id/reject',
    method: 'PATCH',
    expected: 'Rejeitar abastecimento com status Aguardando, informando motivo da rejeição. Campo motivo é obrigatório.',
    performed: 'Tentativa de rejeitar abastecimento.',
  },
  validate: {
    action: 'UPDATE',
    operation: 'Validar dados de abastecimento',
    route: '/abastecimentos',
    method: 'POST',
    expected: 'Preencher campos obrigatórios: veiculoId, combustivelId, empresaId, tipo_abastecimento, quantidade, valor_total.',
    performed: 'Validação de dados do abastecimento informados pelo usuário.',
  },
};

const buildContext = (action: AbastecimentoAction, overrides: ContextOverrides = {}): CrudExceptionContext => {
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

// ============================================
// EXCEÇÕES DE NÃO ENCONTRADO (404)
// ============================================

export class AbastecimentoNotFoundException extends CrudException {
  constructor(abastecimentoId: number, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} não foi encontrado no sistema. Verifique se o ID informado está correto e se o abastecimento existe.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_NOT_FOUND',
      context: buildContext('detail', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          suggestion: 'Verifique se o ID do abastecimento está correto e se você tem permissão para acessá-lo.',
        },
      }),
    });
  }
}

export class AbastecimentoVeiculoNotFoundException extends CrudException {
  constructor(veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Veículo com ID ${veiculoId} não foi encontrado. O campo veiculoId é obrigatório e deve referenciar um veículo existente e ativo no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_VEICULO_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          campoObrigatorio: 'veiculoId',
          suggestion: 'Verifique se o ID do veículo está correto e se o veículo existe e está ativo.',
        },
      }),
    });
  }
}

export class AbastecimentoCombustivelNotFoundException extends CrudException {
  constructor(combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Combustível com ID ${combustivelId} não foi encontrado. O campo combustivelId é obrigatório e deve referenciar um combustível existente e ativo no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          combustivelId,
          campoObrigatorio: 'combustivelId',
          suggestion: 'Verifique se o ID do combustível está correto e se o combustível existe e está ativo.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaNotFoundException extends CrudException {
  constructor(empresaId: number, context?: ContextOverrides) {
    super({
      message: `Empresa com ID ${empresaId} não foi encontrada. O campo empresaId é obrigatório e deve referenciar uma empresa existente e ativa no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_EMPRESA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaId,
          campoObrigatorio: 'empresaId',
          suggestion: 'Verifique se o ID da empresa está correto e se a empresa existe e está ativa.',
        },
      }),
    });
  }
}

export class AbastecimentoMotoristaNotFoundException extends CrudException {
  constructor(motoristaId: number, context?: ContextOverrides) {
    super({
      message: `Motorista com ID ${motoristaId} não foi encontrado. O campo motoristaId é opcional, mas quando informado, deve referenciar um motorista existente e ativo no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_MOTORISTA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          motoristaId,
          campoOpcional: 'motoristaId',
          suggestion: 'Verifique se o ID do motorista está correto e se o motorista existe e está ativo, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitanteNotFoundException extends CrudException {
  constructor(solicitanteId: number, context?: ContextOverrides) {
    super({
      message: `Usuário solicitante com ID ${solicitanteId} não foi encontrado. O campo solicitanteId é opcional, mas quando informado, deve referenciar um usuário existente e ativo no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_SOLICITANTE_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          solicitanteId,
          campoOpcional: 'solicitanteId',
          suggestion: 'Verifique se o ID do solicitante está correto e se o usuário existe e está ativo, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoValidadorNotFoundException extends CrudException {
  constructor(validadorId: number, context?: ContextOverrides) {
    super({
      message: `Usuário validador com ID ${validadorId} não foi encontrado. O campo validadorId é opcional, mas quando informado, deve referenciar um usuário existente e ativo no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_VALIDADOR_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          validadorId,
          campoOpcional: 'validadorId',
          suggestion: 'Verifique se o ID do validador está correto e se o usuário existe e está ativo, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoAbastecedorNotFoundException extends CrudException {
  constructor(abastecedorId: number, context?: ContextOverrides) {
    super({
      message: `Empresa abastecedora com ID ${abastecedorId} não foi encontrada. O campo abastecedorId é opcional, mas quando informado, deve referenciar uma empresa existente e ativa no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_ABASTECEDOR_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          abastecedorId,
          campoOpcional: 'abastecedorId',
          suggestion: 'Verifique se o ID da empresa abastecedora está correto e se a empresa existe e está ativa, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoContaFaturamentoNotFoundException extends CrudException {
  constructor(contaFaturamentoId: number, context?: ContextOverrides) {
    super({
      message: `Conta de faturamento com ID ${contaFaturamentoId} não foi encontrada. O campo conta_faturamento_orgao_id é opcional, mas quando informado, deve referenciar uma conta de faturamento existente no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_CONTA_FATURAMENTO_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          contaFaturamentoId,
          campoOpcional: 'conta_faturamento_orgao_id',
          suggestion: 'Verifique se o ID da conta de faturamento está correto e se a conta existe, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoCotaNotFoundException extends CrudException {
  constructor(cotaId: number, context?: ContextOverrides) {
    super({
      message: `Cota do órgão com ID ${cotaId} não foi encontrada. O campo cota_id é opcional, mas quando informado, deve referenciar uma cota existente e ativa no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_COTA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          cotaId,
          campoOpcional: 'cota_id',
          suggestion: 'Verifique se o ID da cota está correto e se a cota existe e está ativa, ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoNotFoundException extends CrudException {
  constructor(solicitacaoId: number, context?: ContextOverrides) {
    super({
      message: `Solicitação de abastecimento com ID ${solicitacaoId} não foi encontrada. Verifique se o ID informado está correto e se a solicitação existe no sistema.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_NOT_FOUND',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          suggestion: 'Verifique se o ID da solicitação está correto e se a solicitação existe e está ativa.',
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO (400)
// ============================================

export class AbastecimentoUsuarioSemEmpresaException extends CrudException {
  constructor(context?: ContextOverrides) {
    super({
      message: `Usuário não está vinculado a uma empresa. Apenas usuários com perfil ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos. É necessário que o usuário esteja vinculado a uma empresa ativa.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_USUARIO_SEM_EMPRESA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          perfisPermitidos: ['ADMIN_EMPRESA', 'COLABORADOR_EMPRESA'],
          suggestion: 'Verifique se o usuário está vinculado a uma empresa e se o perfil é ADMIN_EMPRESA ou COLABORADOR_EMPRESA.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaDiferenteException extends CrudException {
  constructor(empresaIdSolicitada: number, empresaIdUsuario: number, context?: ContextOverrides) {
    super({
      message: `Você não pode criar abastecimento para uma empresa diferente da sua. A empresa do abastecimento (ID: ${empresaIdSolicitada}) deve corresponder à empresa do usuário logado (ID: ${empresaIdUsuario}).`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_EMPRESA_DIFERENTE',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaIdSolicitada,
          empresaIdUsuario,
          campoObrigatorio: 'empresaId',
          suggestion: 'Altere o campo empresaId para corresponder à empresa do usuário logado, ou use uma conta de usuário vinculada à empresa desejada.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaInativaException extends CrudException {
  constructor(empresaId: number, context?: ContextOverrides) {
    super({
      message: `Não é possível criar abastecimento para uma empresa inativa (ID: ${empresaId}). A empresa deve estar ativa no sistema para realizar abastecimentos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_EMPRESA_INATIVA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaId,
          suggestion: 'Verifique se a empresa está ativa no sistema ou entre em contato com o administrador para ativar a empresa.',
        },
      }),
    });
  }
}

export class AbastecimentoQuantidadeInvalidaException extends CrudException {
  constructor(quantidade: number, context?: ContextOverrides) {
    super({
      message: `Quantidade de combustível inválida: ${quantidade}. A quantidade deve ser um número positivo maior que zero. O campo quantidade é obrigatório e deve ser informado em litros.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_QUANTIDADE_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          quantidade,
          campoObrigatorio: 'quantidade',
          formatoEsperado: 'Número decimal positivo maior que zero',
          unidade: 'litros',
          suggestion: 'Informe uma quantidade válida em litros, maior que zero.',
        },
      }),
    });
  }
}

export class AbastecimentoValorTotalInvalidoException extends CrudException {
  constructor(valorTotal: number, context?: ContextOverrides) {
    super({
      message: `Valor total inválido: ${valorTotal}. O valor total deve ser um número positivo maior ou igual a zero. O campo valor_total é obrigatório.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VALOR_TOTAL_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          valorTotal,
          campoObrigatorio: 'valor_total',
          formatoEsperado: 'Número decimal positivo maior ou igual a zero',
          suggestion: 'Informe um valor total válido. O valor pode ser calculado como: quantidade × preço - desconto.',
        },
      }),
    });
  }
}

export class AbastecimentoTipoAbastecimentoInvalidoException extends CrudException {
  constructor(tipoAbastecimento: string, context?: ContextOverrides) {
    super({
      message: `Tipo de abastecimento inválido: ${tipoAbastecimento}. Os valores permitidos são: COM_COTA, LIVRE, COM_AUTORIZACAO. O campo tipo_abastecimento é obrigatório.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_TIPO_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          tipoAbastecimento,
          campoObrigatorio: 'tipo_abastecimento',
          valoresPermitidos: ['COM_COTA', 'LIVRE', 'COM_AUTORIZACAO'],
          suggestion: 'Informe um tipo de abastecimento válido: COM_COTA, LIVRE ou COM_AUTORIZACAO.',
        },
      }),
    });
  }
}

export class AbastecimentoStatusInvalidoException extends CrudException {
  constructor(status: string, context?: ContextOverrides) {
    super({
      message: `Status de abastecimento inválido: ${status}. Os valores permitidos são: Aguardando, Aprovado, Rejeitado, Cancelado. O campo status é opcional e o valor padrão é Aguardando.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_STATUS_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          status,
          campoOpcional: 'status',
          valoresPermitidos: ['Aguardando', 'Aprovado', 'Rejeitado', 'Cancelado'],
          valorPadrao: 'Aguardando',
          suggestion: 'Informe um status válido: Aguardando, Aprovado, Rejeitado ou Cancelado.',
        },
      }),
    });
  }
}

export class AbastecimentoDataAbastecimentoInvalidaException extends CrudException {
  constructor(dataAbastecimento: string, context?: ContextOverrides) {
    super({
      message: `Data de abastecimento inválida: ${dataAbastecimento}. A data deve estar no formato ISO 8601 (ex: 2025-01-15T10:30:00Z). O campo data_abastecimento é opcional e, se não informado, será usado a data e hora atual.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_DATA_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          dataAbastecimento,
          campoOpcional: 'data_abastecimento',
          formatoEsperado: 'ISO 8601 (ex: 2025-01-15T10:30:00Z)',
          suggestion: 'Informe uma data válida no formato ISO 8601 ou remova o campo para usar a data atual.',
        },
      }),
    });
  }
}

export class AbastecimentoPrecoInvalidoException extends CrudException {
  constructor(campo: string, valor: number, context?: ContextOverrides) {
    super({
      message: `Preço inválido no campo ${campo}: ${valor}. O preço deve ser um número positivo maior ou igual a zero. Os campos preco_anp e preco_empresa são opcionais.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_PRECO_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          campo,
          valor,
          camposOpcionais: ['preco_anp', 'preco_empresa'],
          formatoEsperado: 'Número decimal positivo maior ou igual a zero',
          suggestion: `Informe um preço válido para o campo ${campo} ou remova o campo se não for necessário.`,
        },
      }),
    });
  }
}

export class AbastecimentoDescontoInvalidoException extends CrudException {
  constructor(desconto: number, context?: ContextOverrides) {
    super({
      message: `Desconto inválido: ${desconto}. O desconto deve ser um número positivo maior ou igual a zero. O campo desconto é opcional e o valor padrão é 0.00.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_DESCONTO_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          desconto,
          campoOpcional: 'desconto',
          formatoEsperado: 'Número decimal positivo maior ou igual a zero',
          valorPadrao: 0.0,
          suggestion: 'Informe um desconto válido (maior ou igual a zero) ou remova o campo para usar o valor padrão (0.00).',
        },
      }),
    });
  }
}

export class AbastecimentoOdometroInvalidoException extends CrudException {
  constructor(odometro: number, context?: ContextOverrides) {
    super({
      message: `Odômetro inválido: ${odometro}. O odômetro deve ser um número inteiro positivo maior ou igual a zero. O campo odometro é opcional.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_ODOMETRO_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          odometro,
          campoOpcional: 'odometro',
          formatoEsperado: 'Número inteiro positivo maior ou igual a zero',
          suggestion: 'Informe um odômetro válido (número inteiro positivo) ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoHorimetroInvalidoException extends CrudException {
  constructor(orimetro: number, context?: ContextOverrides) {
    super({
      message: `Horímetro inválido: ${orimetro}. O horímetro deve ser um número inteiro positivo maior ou igual a zero. O campo orimetro é opcional.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_HORIMETRO_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          orimetro,
          campoOpcional: 'orimetro',
          formatoEsperado: 'Número inteiro positivo maior ou igual a zero',
          suggestion: 'Informe um horímetro válido (número inteiro positivo) ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoCamposObrigatoriosFaltandoException extends CrudException {
  constructor(camposFaltando: string[], context?: ContextOverrides) {
    super({
      message: `Campos obrigatórios não informados: ${camposFaltando.join(', ')}. Os campos obrigatórios para criar um abastecimento são: veiculoId, combustivelId, empresaId, tipo_abastecimento, quantidade, valor_total.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_CAMPOS_OBRIGATORIOS_FALTANDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          camposFaltando,
          camposObrigatorios: ['veiculoId', 'combustivelId', 'empresaId', 'tipo_abastecimento', 'quantidade', 'valor_total'],
          camposOpcionais: [
            'motoristaId',
            'solicitanteId',
            'abastecedorId',
            'validadorId',
            'preco_anp',
            'preco_empresa',
            'desconto',
            'data_abastecimento',
            'odometro',
            'orimetro',
            'status',
            'motivo_rejeicao',
            'abastecido_por',
            'nfe_chave_acesso',
            'nfe_img_url',
            'nfe_link',
            'conta_faturamento_orgao_id',
            'cota_id',
            'ativo',
          ],
          suggestion: 'Informe todos os campos obrigatórios antes de criar o abastecimento.',
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE SOLICITAÇÃO (400)
// ============================================

export class AbastecimentoSolicitacaoExpiradaException extends CrudException {
  constructor(solicitacaoId: number, context?: ContextOverrides) {
    super({
      message: `Não é possível criar abastecimento para uma solicitação expirada (ID: ${solicitacaoId}). A solicitação deve estar ativa e dentro do prazo de validade.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_EXPIRADA',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          statusPermitido: ['PENDENTE', 'APROVADA'],
          statusAtual: 'EXPIRADA',
          suggestion: 'Verifique se a solicitação está dentro do prazo de validade ou crie uma nova solicitação.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoRejeitadaException extends CrudException {
  constructor(solicitacaoId: number, context?: ContextOverrides) {
    super({
      message: `Não é possível criar abastecimento para uma solicitação rejeitada (ID: ${solicitacaoId}). A solicitação deve estar com status PENDENTE ou APROVADA.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_REJEITADA',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          statusPermitido: ['PENDENTE', 'APROVADA'],
          statusAtual: 'REJEITADA',
          suggestion: 'Não é possível criar abastecimento para uma solicitação rejeitada. Crie uma nova solicitação se necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoEfetivadaException extends CrudException {
  constructor(solicitacaoId: number, abastecimentoId: number, context?: ContextOverrides) {
    super({
      message: `Esta solicitação (ID: ${solicitacaoId}) já foi efetivada e possui um abastecimento vinculado (ID: ${abastecimentoId}). Uma solicitação só pode ser efetivada uma vez.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_EFETIVADA',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          abastecimentoId,
          statusAtual: 'EFETIVADA',
          suggestion: 'Esta solicitação já possui um abastecimento. Consulte o abastecimento vinculado ou crie uma nova solicitação se necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoInativaException extends CrudException {
  constructor(solicitacaoId: number, context?: ContextOverrides) {
    super({
      message: `Não é possível criar abastecimento para uma solicitação inativa (ID: ${solicitacaoId}). A solicitação deve estar ativa no sistema.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_INATIVA',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          suggestion: 'Verifique se a solicitação está ativa no sistema ou entre em contato com o administrador.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoEmpresaDiferenteException extends CrudException {
  constructor(solicitacaoId: number, empresaIdSolicitacao: number, empresaIdUsuario: number, context?: ContextOverrides) {
    super({
      message: `Você não pode criar abastecimento para uma solicitação de outra empresa. A empresa da solicitação (ID: ${empresaIdSolicitacao}) deve corresponder à empresa do usuário logado (ID: ${empresaIdUsuario}). Apenas usuários ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos para solicitações da própria empresa.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_EMPRESA_DIFERENTE',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          empresaIdSolicitacao,
          empresaIdUsuario,
          perfisPermitidos: ['ADMIN_EMPRESA', 'COLABORADOR_EMPRESA'],
          suggestion: 'Apenas é possível criar abastecimentos para solicitações da própria empresa. Verifique se você está usando a conta correta ou se a solicitação pertence à sua empresa.',
        },
      }),
    });
  }
}

export class AbastecimentoSolicitacaoJaPossuiAbastecimentoException extends CrudException {
  constructor(solicitacaoId: number, abastecimentoId: number, context?: ContextOverrides) {
    super({
      message: `A solicitação ${solicitacaoId} já possui um abastecimento vinculado (ID: ${abastecimentoId}). Uma solicitação só pode ter um abastecimento associado.`,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_JA_POSSUI_ABASTECIMENTO',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          abastecimentoId,
          suggestion: 'Esta solicitação já possui um abastecimento. Consulte o abastecimento existente ou crie uma nova solicitação se necessário.',
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE STATUS (400)
// ============================================

export class AbastecimentoJaAprovadoException extends CrudException {
  constructor(abastecimentoId: number, statusAtual: string, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} já está aprovado. O status atual é ${statusAtual}. Apenas abastecimentos com status "Aguardando" podem ser aprovados.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_JA_APROVADO',
      context: buildContext('approve', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          statusAtual,
          statusEsperado: 'Aguardando',
          suggestion: 'Este abastecimento já foi processado. Apenas abastecimentos aguardando aprovação podem ser aprovados.',
        },
      }),
    });
  }
}

export class AbastecimentoJaRejeitadoException extends CrudException {
  constructor(abastecimentoId: number, statusAtual: string, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} já está rejeitado. O status atual é ${statusAtual}. Apenas abastecimentos com status "Aguardando" podem ser rejeitados.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_JA_REJEITADO',
      context: buildContext('reject', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          statusAtual,
          statusEsperado: 'Aguardando',
          suggestion: 'Este abastecimento já foi processado. Apenas abastecimentos aguardando aprovação podem ser rejeitados.',
        },
      }),
    });
  }
}

export class AbastecimentoNaoAguardandoAprovacaoException extends CrudException {
  constructor(abastecimentoId: number, statusAtual: string, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} não está aguardando aprovação. O status atual é ${statusAtual}. Apenas abastecimentos com status "Aguardando" podem ser aprovados ou rejeitados.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_NAO_AGUARDANDO_APROVACAO',
      context: buildContext('approve', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          statusAtual,
          statusEsperado: 'Aguardando',
          statusPermitidos: ['Aguardando'],
          suggestion: 'Apenas abastecimentos com status "Aguardando" podem ser aprovados ou rejeitados. Verifique o status atual do abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoMotivoRejeicaoObrigatorioException extends CrudException {
  constructor(context?: ContextOverrides) {
    super({
      message: `Motivo da rejeição é obrigatório ao rejeitar um abastecimento. O campo motivo_rejeicao deve ser informado quando o status do abastecimento for alterado para "Rejeitado".`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_MOTIVO_REJEICAO_OBRIGATORIO',
      context: buildContext('reject', {
        ...context,
        additionalInfo: {
          campoObrigatorio: 'motivo_rejeicao',
          suggestion: 'Informe o motivo da rejeição no campo motivo_rejeicao ao rejeitar o abastecimento.',
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE REGRAS DE NEGÓCIO (400)
// ============================================

export class AbastecimentoCotaExcedidaException extends CrudException {
  constructor(cotaId: number, quantidadeSolicitada: number, quantidadeDisponivel: number, context?: ContextOverrides) {
    super({
      message: `Quantidade solicitada (${quantidadeSolicitada} litros) excede a cota disponível (${quantidadeDisponivel} litros) para a cota ID ${cotaId}. Verifique a quantidade disponível na cota antes de criar o abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COTA_EXCEDIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          cotaId,
          quantidadeSolicitada,
          quantidadeDisponivel,
          campo: 'quantidade',
          suggestion: 'Ajuste a quantidade do abastecimento para não exceder a cota disponível ou verifique se há cota suficiente.',
        },
      }),
    });
  }
}

export class AbastecimentoCombustivelNaoVinculadoVeiculoException extends CrudException {
  constructor(veiculoId: number, combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Combustível com ID ${combustivelId} não está vinculado ao veículo com ID ${veiculoId}. O combustível deve estar relacionado ao veículo antes de criar o abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_NAO_VINCULADO_VEICULO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          combustivelId,
          suggestion: 'Verifique se o combustível está vinculado ao veículo ou vincule o combustível ao veículo antes de criar o abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoVeiculoInativoException extends CrudException {
  constructor(veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Veículo com ID ${veiculoId} está inativo. Apenas veículos ativos podem receber abastecimentos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VEICULO_INATIVO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          suggestion: 'Verifique se o veículo está ativo no sistema ou ative o veículo antes de criar o abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoCombustivelInativoException extends CrudException {
  constructor(combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Combustível com ID ${combustivelId} está inativo. Apenas combustíveis ativos podem ser utilizados em abastecimentos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_INATIVO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          combustivelId,
          suggestion: 'Verifique se o combustível está ativo no sistema ou ative o combustível antes de criar o abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoCotaInativaException extends CrudException {
  constructor(cotaId: number, context?: ContextOverrides) {
    super({
      message: `Cota do órgão com ID ${cotaId} está inativa. Apenas cotas ativas podem ser utilizadas em abastecimentos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COTA_INATIVA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          cotaId,
          suggestion: 'Verifique se a cota está ativa no sistema ou ative a cota antes de criar o abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoDataAbastecimentoFuturaException extends CrudException {
  constructor(dataAbastecimento: Date, context?: ContextOverrides) {
    super({
      message: `Data de abastecimento não pode ser futura: ${dataAbastecimento.toISOString()}. A data de abastecimento deve ser igual ou anterior à data atual.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_DATA_FUTURA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          dataAbastecimento: dataAbastecimento.toISOString(),
          campoOpcional: 'data_abastecimento',
          suggestion: 'Informe uma data de abastecimento válida (igual ou anterior à data atual) ou remova o campo para usar a data atual.',
        },
      }),
    });
  }
}

export class AbastecimentoValorTotalInconsistenteException extends CrudException {
  constructor(valorTotal: number, quantidade: number, precoEmpresa: number, desconto: number, context?: ContextOverrides) {
    const valorCalculado = quantidade * precoEmpresa - desconto;
    super({
      message: `Valor total informado (${valorTotal}) é inconsistente com os valores calculados. Quantidade: ${quantidade} litros × Preço: R$ ${precoEmpresa} - Desconto: R$ ${desconto} = R$ ${valorCalculado.toFixed(2)}. O valor total deve corresponder ao cálculo: quantidade × preco_empresa - desconto.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VALOR_TOTAL_INCONSISTENTE',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          valorTotal,
          quantidade,
          precoEmpresa,
          desconto,
          valorCalculado: valorCalculado.toFixed(2),
          campos: ['quantidade', 'preco_empresa', 'desconto', 'valor_total'],
          formula: 'valor_total = quantidade × preco_empresa - desconto',
          suggestion: 'Verifique os valores informados e certifique-se de que o valor_total corresponde ao cálculo correto.',
        },
      }),
    });
  }
}

export class AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException extends CrudException {
  constructor(quantidade: number, capacidadeTanque: number, veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Quantidade de combustível solicitada (${quantidade} litros) excede a capacidade do tanque do veículo (${capacidadeTanque} litros). Veículo ID: ${veiculoId}. A quantidade não pode ser maior que a capacidade do tanque.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_QUANTIDADE_MAIOR_CAPACIDADE_TANQUE',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          quantidade,
          capacidadeTanque,
          veiculoId,
          campo: 'quantidade',
          suggestion: `Ajuste a quantidade para não exceder a capacidade do tanque (${capacidadeTanque} litros) ou verifique a capacidade do veículo.`,
        },
      }),
    });
  }
}

export class AbastecimentoNFEChaveAcessoInvalidaException extends CrudException {
  constructor(chaveAcesso: string, context?: ContextOverrides) {
    super({
      message: `Chave de acesso da NFE inválida: ${chaveAcesso}. A chave de acesso deve ter 44 caracteres numéricos. O campo nfe_chave_acesso é opcional.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_NFE_CHAVE_ACESSO_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          chaveAcesso,
          campoOpcional: 'nfe_chave_acesso',
          formatoEsperado: '44 caracteres numéricos',
          tamanhoAtual: chaveAcesso.length,
          suggestion: 'Informe uma chave de acesso válida com 44 caracteres numéricos ou remova o campo se não for necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoNFEUrlInvalidaException extends CrudException {
  constructor(campo: string, url: string, context?: ContextOverrides) {
    super({
      message: `URL da NFE inválida no campo ${campo}: ${url}. A URL deve ser válida e começar com http:// ou https://. Os campos nfe_img_url e nfe_link são opcionais.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_NFE_URL_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          campo,
          url,
          camposOpcionais: ['nfe_img_url', 'nfe_link'],
          formatoEsperado: 'URL válida (http:// ou https://)',
          suggestion: `Informe uma URL válida para o campo ${campo} ou remova o campo se não for necessário.`,
        },
      }),
    });
  }
}

export class AbastecimentoDescontoMaiorQueValorException extends CrudException {
  constructor(desconto: number, valorTotal: number, context?: ContextOverrides) {
    super({
      message: `Desconto informado (R$ ${desconto}) é maior que o valor total (R$ ${valorTotal}). O desconto não pode ser maior que o valor total do abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_DESCONTO_MAIOR_VALOR',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          desconto,
          valorTotal,
          campoOpcional: 'desconto',
          suggestion: 'Ajuste o desconto para ser menor ou igual ao valor total do abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoPrecoEmpresaNaoDefinidoException extends CrudException {
  constructor(empresaId: number, combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Preço do combustível não está definido para a empresa (ID: ${empresaId}) e combustível (ID: ${combustivelId}). É necessário cadastrar o preço do combustível para a empresa antes de criar o abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_PRECO_EMPRESA_NAO_DEFINIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaId,
          combustivelId,
          suggestion: 'Cadastre o preço do combustível para a empresa antes de criar o abastecimento, ou informe o preço_empresa manualmente no abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoVeiculoNaoPertenceEmpresaException extends CrudException {
  constructor(veiculoId: number, empresaId: number, context?: ContextOverrides) {
    super({
      message: `Veículo com ID ${veiculoId} não pertence à empresa com ID ${empresaId}. O veículo deve estar vinculado à empresa informada no abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VEICULO_NAO_PERTENCE_EMPRESA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          empresaId,
          suggestion: 'Verifique se o veículo está vinculado à empresa correta ou ajuste o empresaId do abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoMotoristaNaoPertencePrefeituraException extends CrudException {
  constructor(motoristaId: number, veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Motorista com ID ${motoristaId} não pertence à mesma prefeitura do veículo com ID ${veiculoId}. O motorista deve estar vinculado à mesma prefeitura do veículo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_MOTORISTA_NAO_PERTENCE_PREFEITURA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          motoristaId,
          veiculoId,
          campoOpcional: 'motoristaId',
          suggestion: 'Verifique se o motorista pertence à mesma prefeitura do veículo ou selecione outro motorista.',
        },
      }),
    });
  }
}

export class AbastecimentoCanceladoException extends CrudException {
  constructor(abastecimentoId: number, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} está cancelado. Não é possível realizar operações em abastecimentos cancelados.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_CANCELADO',
      context: buildContext('update', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          statusAtual: 'Cancelado',
          suggestion: 'Não é possível atualizar, aprovar ou rejeitar abastecimentos cancelados.',
        },
      }),
    });
  }
}

export class AbastecimentoInativoException extends CrudException {
  constructor(abastecimentoId: number, context?: ContextOverrides) {
    super({
      message: `Abastecimento com ID ${abastecimentoId} está inativo. Não é possível realizar operações em abastecimentos inativos.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_INATIVO',
      context: buildContext('update', {
        ...context,
        resourceId: abastecimentoId,
        additionalInfo: {
          abastecimentoId,
          suggestion: 'Ative o abastecimento antes de realizar operações ou consulte abastecimentos ativos.',
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE PERMISSÃO (403)
// ============================================

export class AbastecimentoPermissaoNegadaException extends CrudException {
  constructor(tipoUsuario: string, perfisPermitidos: string[], context?: ContextOverrides) {
    super({
      message: `Acesso negado. Apenas usuários com perfil ${perfisPermitidos.join(' ou ')} podem realizar esta operação. O usuário atual tem perfil ${tipoUsuario}.`,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'ABASTECIMENTO_PERMISSAO_NEGADA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          tipoUsuario,
          perfisPermitidos,
          suggestion: `Verifique se você possui o perfil necessário (${perfisPermitidos.join(' ou ')}) para realizar esta operação.`,
        },
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE CONFLITO (409)
// ============================================

export class AbastecimentoConflitoException extends CrudException {
  constructor(mensagem: string, context?: ContextOverrides) {
    super({
      message: mensagem,
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'ABASTECIMENTO_CONFLITO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          suggestion: 'Verifique os dados informados e tente novamente.',
        },
      }),
    });
  }
}
