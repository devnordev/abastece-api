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
      message: `Veículo não encontrado`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_VEICULO_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          campoObrigatorio: 'veiculoId',
          error: `Nenhum veículo encontrado com o ID ${veiculoId} no sistema`,
          details: 'O campo veiculoId é obrigatório e deve referenciar um veículo existente e ativo no sistema. Verifique se o ID informado está correto e se o veículo foi cadastrado',
          suggestion: 'Verifique se o ID do veículo está correto. Se o veículo não existe, cadastre-o primeiro antes de criar o abastecimento. Se o veículo existe mas foi desativado, é necessário ativá-lo antes de realizar abastecimentos.',
        },
      }),
    });
  }
}

export class AbastecimentoCombustivelNotFoundException extends CrudException {
  constructor(combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Combustível não encontrado`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          combustivelId,
          campoObrigatorio: 'combustivelId',
          error: `Nenhum combustível encontrado com o ID ${combustivelId} no sistema`,
          details: 'O campo combustivelId é obrigatório e deve referenciar um combustível existente e ativo no sistema. Verifique se o ID informado está correto',
          suggestion: 'Verifique se o ID do combustível está correto. Se o combustível não existe, ele precisa ser cadastrado primeiro. Consulte a lista de combustíveis disponíveis no sistema para obter IDs válidos.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaNotFoundException extends CrudException {
  constructor(empresaId: number, context?: ContextOverrides) {
    super({
      message: `Empresa não encontrada`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_EMPRESA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaId,
          campoObrigatorio: 'empresaId',
          error: `Nenhuma empresa encontrada com o ID ${empresaId} no sistema`,
          details: 'O campo empresaId é obrigatório e deve referenciar uma empresa existente e ativa no sistema. A empresa deve estar cadastrada e autorizada para realizar abastecimentos',
          suggestion: 'Verifique se o ID da empresa está correto. O empresaId deve corresponder à empresa do usuário logado. Se você é ADMIN_EMPRESA ou COLABORADOR_EMPRESA, use o ID da empresa vinculada ao seu usuário.',
        },
      }),
    });
  }
}

export class AbastecimentoMotoristaNotFoundException extends CrudException {
  constructor(motoristaId: number, context?: ContextOverrides) {
    super({
      message: `Motorista não encontrado`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_MOTORISTA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          motoristaId,
          campoOpcional: 'motoristaId',
          error: `Nenhum motorista encontrado com o ID ${motoristaId} no sistema`,
          details: 'O campo motoristaId é opcional, mas quando informado, deve referenciar um motorista existente, ativo e vinculado à mesma prefeitura do veículo',
          suggestion: 'Opções para resolver: 1) Verifique se o ID do motorista está correto; 2) Se o motorista não existe, cadastre-o primeiro ou remova o campo motoristaId se não for necessário; 3) Se o motorista existe mas foi desativado, ative-o ou selecione outro motorista ativo; 4) Se o motorista não está vinculado ao veículo, vincule-o ou remova o campo motoristaId.',
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
      message: `Validador não encontrado`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_VALIDADOR_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          validadorId,
          campoOpcional: 'validadorId',
          error: `Nenhum usuário validador encontrado com o ID ${validadorId} no sistema`,
          details: 'O campo validadorId é opcional, mas quando informado, deve referenciar um usuário existente e ativo no sistema que possui permissão para validar abastecimentos',
          suggestion: 'Para resolver: 1) Verifique se o ID do validador está correto; 2) Se o usuário não existe, remova o campo validadorId ou informe o ID de um usuário existente; 3) Se o usuário foi desativado, selecione outro validador ativo; 4) O validador será atribuído automaticamente durante o processo de aprovação se não for informado.',
        },
      }),
    });
  }
}

export class AbastecimentoAbastecedorNotFoundException extends CrudException {
  constructor(
    abastecedorId: number | undefined,
    context?: ContextOverrides,
    details?: {
      userEmpresaId?: number;
      empresaIdFromDto?: number;
      abastecedorIdFromDto?: number;
      method?: string;
    },
  ) {
    const detailInfo = details || {};
    const userEmpresaId = detailInfo.userEmpresaId;
    const empresaIdFromDto = detailInfo.empresaIdFromDto;
    const abastecedorIdFromDto = detailInfo.abastecedorIdFromDto;
    const method = detailInfo.method || 'create';

    super({
      message: `Empresa abastecedora não encontrada`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_ABASTECEDOR_NOT_FOUND',
      context: buildContext(method, {
        ...context,
        additionalInfo: {
          abastecedorIdBuscado: abastecedorId,
          abastecedorIdTipo: typeof abastecedorId,
          abastecedorIdIsUndefined: abastecedorId === undefined,
          abastecedorIdIsNull: abastecedorId === null,
          // Informações sobre o que foi recebido no DTO
          payloadRecebido: {
            abastecedorIdNoDto: abastecedorIdFromDto,
            empresaIdNoDto: empresaIdFromDto,
            abastecedorIdNoDtoTipo: typeof abastecedorIdFromDto,
          },
          // Informações sobre o usuário logado
          usuarioLogado: {
            userId: context?.user?.id,
            userTipo: context?.user?.tipo,
            userEmail: context?.user?.email,
            empresaIdDoUsuario: userEmpresaId,
            empresaIdDoUsuarioTipo: typeof userEmpresaId,
            empresaDoUsuarioExiste: userEmpresaId !== undefined && userEmpresaId !== null,
          },
          // O que era esperado
          esperado: {
            descricao: 'O sistema deve usar automaticamente o ID da empresa do usuário logado (user.empresa.id) como abastecedorId',
            valorEsperado: `user.empresa.id = ${userEmpresaId}`,
            condicoes: [
              'O usuário logado deve ter uma empresa vinculada (user.empresa.id deve existir)',
              'A empresa vinculada ao usuário deve existir no banco de dados',
              'A empresa vinculada ao usuário deve estar ativa',
            ],
          },
          // O que não foi satisfeito
          problema: {
            descricao: `Não foi possível encontrar uma empresa com o ID ${abastecedorId} no banco de dados`,
            possiveisCausas: [
              `O usuário logado não possui empresa vinculada (user.empresa.id está ${userEmpresaId === undefined ? 'undefined' : userEmpresaId === null ? 'null' : `definido como ${userEmpresaId}, mas a empresa não existe no banco`})`,
              `A empresa com ID ${abastecedorId} foi deletada ou nunca existiu`,
              `Houve um problema ao buscar a empresa no banco de dados`,
              `O valor de abastecedorId calculado está incorreto (valor: ${abastecedorId}, tipo: ${typeof abastecedorId})`,
            ],
          },
          error: `Nenhuma empresa abastecedora encontrada com o ID ${abastecedorId} no sistema. AbastecedorId calculado: ${abastecedorId}, Tipo: ${typeof abastecedorId}, User.empresa.id: ${userEmpresaId}`,
          details: `O sistema tenta preencher automaticamente o abastecedorId com o ID da empresa do usuário logado (user.empresa.id = ${userEmpresaId}), mas não foi possível encontrar essa empresa no banco de dados. Dados recebidos no payload: abastecedorId=${abastecedorIdFromDto}, empresaId=${empresaIdFromDto}. O sistema ignora o abastecedorId do DTO e sempre usa user.empresa.id.`,
          suggestion: [
            '1. Verifique se o usuário logado possui uma empresa vinculada (user.empresa.id deve existir e não ser null)',
            `2. Verifique se a empresa com ID ${abastecedorId} existe no banco de dados`,
            `3. Verifique se a empresa do usuário logado (ID: ${userEmpresaId}) existe e está ativa`,
            '4. Confirme que o token JWT do usuário contém as informações corretas da empresa',
            '5. Se o problema persistir, verifique os logs do servidor para mais detalhes sobre a consulta ao banco de dados',
            '6. O campo abastecedorId no DTO é ignorado - o sistema sempre usa user.empresa.id automaticamente',
          ].join('\n'),
        },
      }),
    });
  }
}

export class AbastecimentoContaFaturamentoNotFoundException extends CrudException {
  constructor(contaFaturamentoId: number, context?: ContextOverrides) {
    super({
      message: `Conta de faturamento não encontrada`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_CONTA_FATURAMENTO_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          contaFaturamentoId,
          campoOpcional: 'conta_faturamento_orgao_id',
          error: `Nenhuma conta de faturamento encontrada com o ID ${contaFaturamentoId} no sistema`,
          details: 'O campo conta_faturamento_orgao_id é opcional e deve referenciar uma conta de faturamento do órgão existente. A conta de faturamento é usada para identificar onde o valor do abastecimento será contabilizado',
          suggestion: 'Para resolver: 1) Verifique se o ID da conta de faturamento está correto; 2) Se a conta não existe, remova o campo conta_faturamento_orgao_id se não for obrigatório; 3) Verifique se há uma conta de faturamento vinculada ao órgão do veículo; 4) Se necessário, consulte a lista de contas de faturamento disponíveis para o órgão do veículo.',
        },
      }),
    });
  }
}

export class AbastecimentoCotaNotFoundException extends CrudException {
  constructor(cotaId: number, context?: ContextOverrides) {
    super({
      message: `Cota do órgão não encontrada`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'ABASTECIMENTO_COTA_NOT_FOUND',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          cotaId,
          campoOpcional: 'cota_id',
          error: `Nenhuma cota do órgão encontrada com o ID ${cotaId} no sistema`,
          details: 'O campo cota_id é opcional, mas quando informado, deve referenciar uma CotaOrgao existente e ativa. A cota será buscada automaticamente através do orgaoId do veículo e combustivelId se não for informada',
          suggestion: 'Para resolver: 1) Verifique se o ID da cota está correto; 2) Se você informou manualmente o cota_id, remova-o e deixe o sistema buscar automaticamente; 3) O sistema tenta encontrar a cota através do órgão do veículo e do combustível; 4) Se não há cota cadastrada, o abastecimento pode ser criado sem cota_id para abastecimentos do tipo LIVRE.',
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
      message: `Usuário não está vinculado a uma empresa`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_USUARIO_SEM_EMPRESA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          perfisPermitidos: ['ADMIN_EMPRESA', 'COLABORADOR_EMPRESA'],
          error: 'O usuário logado não possui uma empresa vinculada ao seu perfil',
          details: 'Apenas usuários com perfil ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos. É necessário que o usuário esteja vinculado a uma empresa ativa no sistema para realizar esta operação',
          suggestion: 'Para resolver: 1) Verifique se você está usando o perfil correto (ADMIN_EMPRESA ou COLABORADOR_EMPRESA); 2) Certifique-se de que seu usuário está vinculado a uma empresa ativa; 3) Se você não tem uma empresa vinculada, entre em contato com o administrador do sistema para vincular seu usuário a uma empresa; 4) Se você é de outra prefeitura, use uma conta de usuário da empresa que realizará o abastecimento.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaDiferenteException extends CrudException {
  constructor(empresaIdSolicitada: number, empresaIdUsuario: number, context?: ContextOverrides) {
    super({
      message: `Empresa do abastecimento não corresponde à empresa do usuário`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_EMPRESA_DIFERENTE',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaIdSolicitada,
          empresaIdUsuario,
          campoObrigatorio: 'empresaId',
          error: `O empresaId informado (${empresaIdSolicitada}) é diferente da empresa vinculada ao usuário logado (${empresaIdUsuario})`,
          details: 'Por questões de segurança e controle, você só pode criar abastecimentos para a empresa à qual seu usuário está vinculado. Esta regra garante que cada empresa gerencie apenas seus próprios abastecimentos',
          suggestion: 'Para resolver: 1) Verifique se o empresaId informado está correto; 2) Altere o campo empresaId para corresponder à sua empresa (ID: ' + empresaIdUsuario + '); 3) Se você precisa criar abastecimentos para outra empresa, use uma conta de usuário vinculada àquela empresa; 4) O sistema preenche automaticamente o abastecedorId com a empresa do usuário logado.',
        },
      }),
    });
  }
}

export class AbastecimentoEmpresaInativaException extends CrudException {
  constructor(empresaId: number, context?: ContextOverrides) {
    super({
      message: `Empresa está inativa`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_EMPRESA_INATIVA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          empresaId,
          error: `A empresa com ID ${empresaId} está inativa no sistema`,
          details: 'Apenas empresas ativas podem realizar abastecimentos. Empresas inativas foram desabilitadas e não podem criar ou processar novos abastecimentos no sistema',
          suggestion: 'Para resolver: 1) Entre em contato com o administrador do sistema para reativar a empresa; 2) Verifique se a empresa realmente precisa estar inativa; 3) Se você não tem permissão para ativar empresas, solicite ao administrador que reative sua empresa antes de criar abastecimentos.',
        },
      }),
    });
  }
}

export class AbastecimentoQuantidadeInvalidaException extends CrudException {
  constructor(quantidade: number, context?: ContextOverrides) {
    super({
      message: `Quantidade de combustível inválida`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_QUANTIDADE_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          quantidade,
          campoObrigatorio: 'quantidade',
          formatoEsperado: 'Número decimal positivo maior que zero',
          unidade: 'litros',
          error: `O valor informado (${quantidade}) não é uma quantidade válida`,
          details: 'A quantidade deve ser um número positivo maior que zero e deve ser informada em litros. O campo quantidade é obrigatório e representa o volume de combustível abastecido',
          suggestion: 'Para resolver: 1) Verifique se informou um número válido (não pode ser zero, negativo, nulo ou vazio); 2) Informe a quantidade em litros, por exemplo: 50.5, 100, 25.75; 3) Certifique-se de que a quantidade não excede a capacidade do tanque do veículo; 4) Se estiver usando valores decimais, use ponto (.) como separador, não vírgula.',
        },
      }),
    });
  }
}

export class AbastecimentoValorTotalInvalidoException extends CrudException {
  constructor(valorTotal: number, context?: ContextOverrides) {
    super({
      message: `Valor total inválido`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VALOR_TOTAL_INVALIDO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          valorTotal,
          campoObrigatorio: 'valor_total',
          formatoEsperado: 'Número decimal positivo maior ou igual a zero',
          error: `O valor informado (${valorTotal}) não é um valor total válido`,
          details: 'O valor total deve ser um número positivo maior ou igual a zero e representa o valor financeiro do abastecimento em reais. O campo valor_total é obrigatório e deve corresponder ao cálculo: quantidade × preco_empresa - desconto',
          suggestion: 'Para resolver: 1) Verifique se informou um número válido (não pode ser negativo, nulo ou vazio); 2) O valor total deve ser calculado como: quantidade × preco_empresa - desconto; 3) Se estiver usando valores decimais, use ponto (.) como separador; 4) Certifique-se de que o valor total está consistente com a quantidade e o preço informados.',
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
      message: `Esta solicitação (ID: ${solicitacaoId}) já possui um abastecimento vinculado (ID: ${abastecimentoId}). Uma solicitação só pode gerar um abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_SOLICITACAO_EFETIVADA',
      context: buildContext('createFromSolicitacao', {
        ...context,
        resourceId: solicitacaoId,
        additionalInfo: {
          solicitacaoId,
          abastecimentoId,
          statusAtual: 'APROVADA',
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
      message: `Combustível não está vinculado ao veículo`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_NAO_VINCULADO_VEICULO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          combustivelId,
          error: `O combustível com ID ${combustivelId} não está cadastrado como permitido para o veículo com ID ${veiculoId}`,
          details: 'Para criar um abastecimento, o combustível deve estar previamente vinculado ao veículo através do cadastro de VeiculoCombustivel. Apenas combustíveis cadastrados para o veículo podem ser utilizados em abastecimentos',
          suggestion: 'Para resolver: 1) Verifique se o combustível está correto; 2) Vincule o combustível ao veículo através do cadastro de veículo antes de criar o abastecimento; 3) Se o combustível já estava vinculado, verifique se o vínculo está ativo (campo ativo = true); 4) Se necessário, selecione outro combustível que já esteja vinculado ao veículo.',
        },
      }),
    });
  }
}

export class AbastecimentoVeiculoInativoException extends CrudException {
  constructor(veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Veículo está inativo`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_VEICULO_INATIVO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          veiculoId,
          error: `O veículo com ID ${veiculoId} está inativo no sistema`,
          details: 'Apenas veículos ativos podem receber abastecimentos. Veículos inativos não podem ter abastecimentos registrados',
          suggestion: 'Para resolver este problema: 1) Verifique se o veículo realmente precisa estar inativo; 2) Se necessário, ative o veículo no sistema antes de criar o abastecimento; 3) Entre em contato com o administrador da prefeitura para reativar o veículo se necessário.',
        },
      }),
    });
  }
}

export class AbastecimentoCombustivelInativoException extends CrudException {
  constructor(combustivelId: number, context?: ContextOverrides) {
    super({
      message: `Combustível está inativo`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COMBUSTIVEL_INATIVO',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          combustivelId,
          error: `O combustível com ID ${combustivelId} está inativo no sistema`,
          details: 'Apenas combustíveis ativos podem ser utilizados em abastecimentos. Combustíveis inativos foram desabilitados e não podem ser selecionados para novos abastecimentos',
          suggestion: 'Para resolver: 1) Verifique se o combustível precisa estar inativo; 2) Se necessário, ative o combustível no sistema antes de criar o abastecimento; 3) Se o combustível não deve mais ser usado, selecione outro combustível que esteja ativo para o veículo.',
        },
      }),
    });
  }
}

export class AbastecimentoCotaInativaException extends CrudException {
  constructor(cotaId: number, context?: ContextOverrides) {
    super({
      message: `Cota do órgão está inativa`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_COTA_INATIVA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          cotaId,
          error: `A cota do órgão com ID ${cotaId} está inativa no sistema`,
          details: 'Apenas cotas ativas podem ser utilizadas em abastecimentos. Cotas inativas foram desabilitadas e não podem ter suas quantidades utilizadas ou valores consumidos atualizados',
          suggestion: 'Para resolver: 1) Verifique se a cota realmente precisa estar inativa; 2) Se necessário, ative a cota no sistema antes de criar o abastecimento; 3) Entre em contato com o administrador da prefeitura para reativar a cota; 4) Se você informou o cota_id manualmente, remova-o e deixe o sistema buscar uma cota ativa automaticamente.',
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
    const diferenca = Math.abs(valorTotal - valorCalculado);
    
    super({
      message: `Valor total inconsistente com os valores informados`,
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
          diferenca: diferenca.toFixed(2),
          campos: ['quantidade', 'preco_empresa', 'desconto', 'valor_total'],
          formula: 'valor_total = quantidade × preco_empresa - desconto',
          error: `O valor_total informado (R$ ${valorTotal.toFixed(2)}) não corresponde ao cálculo esperado (R$ ${valorCalculado.toFixed(2)})`,
          calculoDetalhado: `${quantidade} litros × R$ ${precoEmpresa.toFixed(2)} - R$ ${desconto.toFixed(2)} = R$ ${valorCalculado.toFixed(2)}`,
          details: 'O valor total do abastecimento deve corresponder exatamente ao cálculo: quantidade × preco_empresa - desconto. Pequenas diferenças de até R$ 0,01 são permitidas devido a arredondamentos',
          suggestion: `Para resolver: 1) Recalcule o valor_total usando a fórmula: ${quantidade} × ${precoEmpresa.toFixed(2)} - ${desconto.toFixed(2)} = R$ ${valorCalculado.toFixed(2)}; 2) Ajuste o valor_total para R$ ${valorCalculado.toFixed(2)}; 3) Verifique se os valores de quantidade, preco_empresa e desconto estão corretos; 4) Se os valores estiverem corretos mas o cálculo ainda diferir, use o valor calculado automaticamente.`,
        },
      }),
    });
  }
}

export class AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException extends CrudException {
  constructor(quantidade: number, capacidadeTanque: number, veiculoId: number, context?: ContextOverrides) {
    super({
      message: `Quantidade excede a capacidade do tanque do veículo`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_QUANTIDADE_MAIOR_CAPACIDADE_TANQUE',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          quantidade,
          capacidadeTanque,
          veiculoId,
          campo: 'quantidade',
          error: `A quantidade solicitada (${quantidade} litros) é maior que a capacidade do tanque (${capacidadeTanque} litros)`,
          details: `O veículo com ID ${veiculoId} possui uma capacidade de tanque de ${capacidadeTanque} litros. Não é possível abastecer uma quantidade maior que a capacidade física do tanque do veículo`,
          diferenca: quantidade - capacidadeTanque,
          suggestion: `Para resolver: 1) Ajuste a quantidade para ${capacidadeTanque} litros ou menos (a capacidade máxima do tanque); 2) Verifique se a capacidade do tanque do veículo está correta no cadastro; 3) Se o veículo recebeu um tanque maior, atualize a capacidade_tanque no cadastro do veículo; 4) Considere criar múltiplos abastecimentos se necessário, respeitando a capacidade do tanque em cada um.`,
        },
      }),
    });
  }
}

export class AbastecimentoNFEChaveAcessoInvalidaException extends CrudException {
  constructor(chaveAcesso: string, context?: ContextOverrides) {
    const tamanhoAtual = chaveAcesso?.length || 0;
    const temCaracteresNaoNumericos = chaveAcesso && !/^\d+$/.test(chaveAcesso);
    
    super({
      message: `Chave de acesso da NFE inválida`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_NFE_CHAVE_ACESSO_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          chaveAcesso,
          campoOpcional: 'nfe_chave_acesso',
          formatoEsperado: '44 caracteres numéricos',
          tamanhoAtual,
          tamanhoEsperado: 44,
          temCaracteresNaoNumericos,
          error: tamanhoAtual !== 44 
            ? `A chave de acesso possui ${tamanhoAtual} caracteres, mas deve ter exatamente 44 caracteres`
            : temCaracteresNaoNumericos
            ? 'A chave de acesso contém caracteres não numéricos. Deve conter apenas dígitos de 0 a 9'
            : `A chave de acesso informada não está no formato válido`,
          details: 'A chave de acesso da NFE (Nota Fiscal Eletrônica) deve seguir o padrão oficial: exatamente 44 caracteres numéricos consecutivos, sem espaços, letras ou caracteres especiais. Este campo é opcional',
          exemploValido: '12345678901234567890123456789012345678901234',
          suggestion: 'Para resolver: 1) Verifique se a chave de acesso tem exatamente 44 caracteres (sem espaços no início ou fim); 2) Certifique-se de que contém apenas números (0-9), sem letras ou caracteres especiais; 3) Copie a chave diretamente da NFE para evitar erros de digitação; 4) Se a chave não estiver disponível, remova o campo nfe_chave_acesso - ele é opcional.',
        },
      }),
    });
  }
}

export class AbastecimentoNFEUrlInvalidaException extends CrudException {
  constructor(campo: string, url: string, context?: ContextOverrides) {
    const naoComecaComHttp = !url?.match(/^https?:\/\//);
    
    super({
      message: `URL da NFE inválida`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_NFE_URL_INVALIDA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          campo,
          url,
          camposOpcionais: ['nfe_img_url', 'nfe_link'],
          formatoEsperado: 'URL válida começando com http:// ou https://',
          error: naoComecaComHttp
            ? `A URL informada não começa com http:// ou https://`
            : `A URL informada não está em um formato válido`,
          details: `O campo ${campo} deve conter uma URL válida que comece com http:// ou https://. Este campo é opcional e usado para armazenar links ou imagens da Nota Fiscal Eletrônica`,
          exemplosValidos: [
            'https://exemplo.com/nfe.jpg',
            'http://exemplo.com/nfe',
            'https://www.exemplo.com.br/documentos/nfe.pdf'
          ],
          suggestion: `Para resolver: 1) Certifique-se de que a URL começa com http:// ou https://; 2) Verifique se a URL está completa e acessível; 3) Se estiver usando nfe_img_url, pode fazer upload do arquivo usando o campo nfe_img (multipart/form-data) ao invés de informar a URL; 4) Se não tiver a URL ou imagem, remova o campo ${campo} - ele é opcional.`,
        },
      }),
    });
  }
}

export class AbastecimentoDescontoMaiorQueValorException extends CrudException {
  constructor(desconto: number, valorTotal: number, context?: ContextOverrides) {
    const diferenca = desconto - valorTotal;
    
    super({
      message: `Desconto maior que o valor total do abastecimento`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_DESCONTO_MAIOR_VALOR',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          desconto,
          valorTotal,
          campoOpcional: 'desconto',
          error: `O desconto informado (R$ ${desconto.toFixed(2)}) é maior que o valor total (R$ ${valorTotal.toFixed(2)})`,
          diferenca: diferenca.toFixed(2),
          details: 'O desconto não pode ser maior que o valor total do abastecimento. O valor final após desconto seria negativo, o que não é permitido. O desconto é um valor opcional que reduz o valor total',
          formula: 'valor_final = valor_total - desconto (onde valor_final >= 0)',
          suggestion: `Para resolver: 1) Ajuste o desconto para ser menor ou igual ao valor total (R$ ${valorTotal.toFixed(2)}); 2) Se o desconto realmente deve ser aplicado, verifique se o valor_total está correto; 3) O desconto máximo permitido é igual ao valor_total (resultando em valor final = 0); 4) Se não há desconto, remova o campo desconto ou informe 0.`,
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
      message: `Motorista não pertence à prefeitura do veículo`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'ABASTECIMENTO_MOTORISTA_NAO_PERTENCE_PREFEITURA',
      context: buildContext('create', {
        ...context,
        additionalInfo: {
          motoristaId,
          veiculoId,
          campoOpcional: 'motoristaId',
          error: `O motorista com ID ${motoristaId} pertence a uma prefeitura diferente da prefeitura do veículo com ID ${veiculoId}`,
          details: 'Para criar um abastecimento, o motorista deve pertencer à mesma prefeitura do veículo. Esta regra garante que apenas motoristas autorizados pela mesma prefeitura possam abastecer os veículos',
          suggestion: 'Para resolver: 1) Verifique se o motorista está correto; 2) Selecione um motorista que pertença à mesma prefeitura do veículo; 3) Se o motorista precisa ser alterado, cadastre-o na prefeitura correta primeiro; 4) Alternativamente, remova o campo motoristaId se não for obrigatório informar o motorista no momento do abastecimento.',
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
