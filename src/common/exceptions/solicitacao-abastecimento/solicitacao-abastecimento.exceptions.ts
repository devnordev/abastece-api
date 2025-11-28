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

export class SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException extends CrudException {
  constructor(quantidade: number, capacidadeTanque: number, veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Não é possível solicitar abastecimento. A quantidade solicitada (${quantidade} litros) excede a quantidade suportada no tanque do veículo (${capacidadeTanque} litros). A capacidade máxima do tanque deste veículo é de ${capacidadeTanque} litros. Por favor, ajuste a quantidade solicitada para um valor igual ou inferior a ${capacidadeTanque} litros.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_QUANTIDADE_EXCEDE_CAPACIDADE_TANQUE',
      context: buildContext('create', {
        resourceId: veiculoId,
        expected: 'Informar quantidade de litros que não exceda a capacidade física do tanque do veículo. A quantidade solicitada deve ser igual ou menor que a capacidade do tanque.',
        performed: `Validação de capacidade do tanque do veículo. Quantidade solicitada: ${quantidade} litros, Capacidade máxima do tanque: ${capacidadeTanque} litros.`,
        additionalInfo: {
          quantidade,
          capacidadeTanque,
          veiculoId,
          campo: 'quantidade',
          unidade: 'litros',
          quantidadeMaximaPermitida: capacidadeTanque,
          diferenca: quantidade - capacidadeTanque,
          suggestion: `Para realizar a solicitação, a quantidade deve ser ajustada para no máximo ${capacidadeTanque} litros, que corresponde à capacidade total do tanque deste veículo.`,
        },
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

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE MOTORISTA
// ============================================

export class SolicitacaoAbastecimentoMotoristaNaoVinculadoVeiculoException extends CrudException {
  constructor(motoristaId: number, veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `O motorista ${motoristaId} não está vinculado ao veículo ${veiculoId}. É necessário vincular o motorista ao veículo antes de criar a solicitação de abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_MOTORISTA_NAO_VINCULADO_VEICULO',
      context: buildContext('validate', {
        resourceId: motoristaId,
        expected: 'Utilizar motorista previamente vinculado ao veículo selecionado.',
        performed: `Validação do vínculo entre motorista ${motoristaId} e veículo ${veiculoId}.`,
        additionalInfo: {
          motoristaId,
          veiculoId,
          suggestion: 'Verifique se o motorista está ativo e vinculado ao veículo na data da solicitação.',
        },
        ...overrides,
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE ORGÃO
// ============================================

export class SolicitacaoAbastecimentoVeiculoSemOrgaoException extends CrudException {
  constructor(veiculoId: number, tipoAbastecimento: string, overrides: ContextMeta = {}) {
    super({
      message: `O veículo ${veiculoId} não possui órgão vinculado. Para solicitações do tipo "${tipoAbastecimento}", é obrigatório que o veículo esteja vinculado a um órgão para validação de cotas.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_SEM_ORGAO',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Veículo deve estar vinculado a um órgão para validação de cotas.',
        performed: `Validação de órgão para veículo ${veiculoId} com tipo de abastecimento ${tipoAbastecimento}.`,
        additionalInfo: {
          veiculoId,
          tipoAbastecimento,
          suggestion: 'Vincule o veículo a um órgão antes de criar a solicitação de abastecimento.',
        },
        ...overrides,
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE PROCESSO
// ============================================

export class SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException extends CrudException {
  constructor(prefeituraId: number, overrides: ContextMeta = {}) {
    super({
      message: `Não foi encontrado processo ativo do tipo OBJETIVO para a prefeitura ${prefeituraId}. É necessário ter um processo ativo para validar cotas de abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PROCESSO_ATIVO_NAO_ENCONTRADO',
      context: buildContext('validate', {
        resourceId: prefeituraId,
        expected: 'Prefeitura deve possuir um processo ativo do tipo OBJETIVO para validação de cotas.',
        performed: `Busca de processo ativo para prefeitura ${prefeituraId}.`,
        additionalInfo: {
          prefeituraId,
          tipoProcessoEsperado: 'OBJETIVO',
          statusEsperado: 'ATIVO',
          suggestion: 'Cadastre um processo ativo do tipo OBJETIVO para a prefeitura antes de criar solicitações de abastecimento.',
        },
        ...overrides,
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE COTA DO ÓRGÃO
// ============================================

export class SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException extends CrudException {
  constructor(orgaoId: number, combustivelId: number, processoId: number, overrides: ContextMeta = {}) {
    super({
      message: `Não foi encontrada cota ativa para o órgão ${orgaoId}, combustível ${combustivelId} e processo ${processoId}. É necessário cadastrar uma cota para este órgão e combustível no processo ativo.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COTA_ORGAO_NAO_ENCONTRADA',
      context: buildContext('validate', {
        resourceId: orgaoId,
        expected: 'Órgão deve possuir cota ativa para o combustível no processo ativo.',
        performed: `Busca de cota para órgão ${orgaoId}, combustível ${combustivelId} e processo ${processoId}.`,
        additionalInfo: {
          orgaoId,
          combustivelId,
          processoId,
          suggestion: 'Cadastre uma cota ativa para este órgão e combustível no processo ativo da prefeitura.',
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCotaOrgaoInsuficienteLivreException extends CrudException {
  constructor(quantidade: number, restante: number, orgaoId: number, combustivelId: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade solicitada (${quantidade} litros) excede o restante disponível na cota do órgão (${restante} litros). Para veículos do tipo LIVRE, a quantidade solicitada deve ser menor ou igual ao restante da cota do órgão.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COTA_ORGAO_INSUFICIENTE_LIVRE',
      context: buildContext('validate', {
        expected: 'Quantidade solicitada deve ser menor ou igual ao restante da cota do órgão para tipo LIVRE.',
        performed: `Validação de cota do órgão para tipo LIVRE. Quantidade solicitada: ${quantidade} L, restante disponível: ${restante} L.`,
        additionalInfo: {
          quantidade,
          restante,
          orgaoId,
          combustivelId,
          tipoAbastecimento: 'LIVRE',
          quantidadeMaximaPermitida: restante,
          diferenca: quantidade - restante,
          suggestion: `Ajuste a quantidade solicitada para no máximo ${restante} litros, que corresponde ao restante disponível na cota do órgão.`,
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCotaOrgaoInsuficienteComCotaException extends CrudException {
  constructor(quantidade: number, restante: number, orgaoId: number, combustivelId: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade solicitada (${quantidade} litros) excede o restante disponível na cota do órgão (${restante} litros). Para veículos do tipo COM_COTA, além da validação da cota do período do veículo, é necessário que a quantidade solicitada seja menor ou igual ao restante da cota do órgão.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COTA_ORGAO_INSUFICIENTE_COM_COTA',
      context: buildContext('validate', {
        expected: 'Quantidade solicitada deve ser menor ou igual ao restante da cota do órgão para tipo COM_COTA.',
        performed: `Validação de cota do órgão para tipo COM_COTA. Quantidade solicitada: ${quantidade} L, restante disponível: ${restante} L.`,
        additionalInfo: {
          quantidade,
          restante,
          orgaoId,
          combustivelId,
          tipoAbastecimento: 'COM_COTA',
          quantidadeMaximaPermitida: restante,
          diferenca: quantidade - restante,
          suggestion: `Ajuste a quantidade solicitada para no máximo ${restante} litros, que corresponde ao restante disponível na cota do órgão.`,
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCotaOrgaoInsuficienteComAutorizacaoException extends CrudException {
  constructor(quantidade: number, restante: number, orgaoId: number, combustivelId: number, overrides: ContextMeta = {}) {
    super({
      message: `Quantidade solicitada (${quantidade} litros) excede o restante disponível na cota do órgão (${restante} litros). Para veículos do tipo COM_AUTORIZACAO, a quantidade solicitada deve ser menor ou igual ao restante da cota do órgão.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COTA_ORGAO_INSUFICIENTE_COM_AUTORIZACAO',
      context: buildContext('validate', {
        expected: 'Quantidade solicitada deve ser menor ou igual ao restante da cota do órgão para tipo COM_AUTORIZACAO.',
        performed: `Validação de cota do órgão para tipo COM_AUTORIZACAO. Quantidade solicitada: ${quantidade} L, restante disponível: ${restante} L.`,
        additionalInfo: {
          quantidade,
          restante,
          orgaoId,
          combustivelId,
          tipoAbastecimento: 'COM_AUTORIZACAO',
          quantidadeMaximaPermitida: restante,
          diferenca: quantidade - restante,
          suggestion: `Ajuste a quantidade solicitada para no máximo ${restante} litros, que corresponde ao restante disponível na cota do órgão.`,
        },
        ...overrides,
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE COTA DE PERÍODO DO VEÍCULO
// ============================================

export class SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException extends CrudException {
  constructor(veiculoId: number, periodicidade: string, dataSolicitacao: Date, overrides: ContextMeta = {}) {
    super({
      message: `Não foi encontrada cota de período ativa para o veículo ${veiculoId} com periodicidade ${periodicidade} na data ${dataSolicitacao.toLocaleDateString('pt-BR')}. É necessário cadastrar uma cota de período para o veículo antes de criar a solicitação.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_COTA_PERIODO_NAO_ENCONTRADA',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Veículo deve possuir cota de período ativa para a data da solicitação.',
        performed: `Busca de cota de período para veículo ${veiculoId} com periodicidade ${periodicidade} na data ${dataSolicitacao.toISOString()}.`,
        additionalInfo: {
          veiculoId,
          periodicidade,
          dataSolicitacao: dataSolicitacao.toISOString(),
          suggestion: 'Cadastre uma cota de período ativa para o veículo que cubra a data da solicitação.',
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException extends CrudException {
  constructor(
    veiculoId: number,
    periodicidade: string,
    quantidadePermitida: number,
    quantidadeUtilizada: number,
    quantidadeDisponivel: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `A cota do período para o veículo ${veiculoId} está esgotada. Quantidade permitida: ${quantidadePermitida} litros, quantidade utilizada: ${quantidadeUtilizada} litros, quantidade disponível: ${quantidadeDisponivel} litros. Não é possível criar solicitação de abastecimento quando a cota do período está esgotada.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_COTA_PERIODO_ESGOTADA',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Cota do período do veículo deve ter quantidade disponível maior que zero.',
        performed: `Validação de cota do período para veículo ${veiculoId} com periodicidade ${periodicidade}.`,
        additionalInfo: {
          veiculoId,
          periodicidade,
          quantidadePermitida,
          quantidadeUtilizada,
          quantidadeDisponivel,
          suggestion: 'Aguarde o próximo período ou ajuste a cota do período do veículo para permitir novos abastecimentos.',
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException extends CrudException {
  constructor(
    quantidade: number,
    quantidadeDisponivel: number,
    veiculoId: number,
    periodicidade: string,
    quantidadePermitida: number,
    quantidadeUtilizada: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Quantidade solicitada (${quantidade} litros) excede a quantidade disponível na cota do período (${quantidadeDisponivel} litros) para o veículo ${veiculoId}. Quantidade permitida: ${quantidadePermitida} litros, quantidade utilizada: ${quantidadeUtilizada} litros.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_VEICULO_COTA_PERIODO_QUANTIDADE_INSUFICIENTE',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Quantidade solicitada deve ser menor ou igual à quantidade disponível na cota do período.',
        performed: `Validação de quantidade na cota do período. Quantidade solicitada: ${quantidade} L, quantidade disponível: ${quantidadeDisponivel} L.`,
        additionalInfo: {
          quantidade,
          quantidadeDisponivel,
          veiculoId,
          periodicidade,
          quantidadePermitida,
          quantidadeUtilizada,
          quantidadeMaximaPermitida: quantidadeDisponivel,
          diferenca: quantidade - quantidadeDisponivel,
          suggestion: `Ajuste a quantidade solicitada para no máximo ${quantidadeDisponivel} litros, que corresponde à quantidade disponível na cota do período.`,
        },
        ...overrides,
      }),
    });
  }
}

// ============================================
// EXCEÇÕES DE VALIDAÇÃO DE ABASTECIMENTOS DO PERÍODO (Semanal/Mensal)
// ============================================

export class SolicitacaoAbastecimentoPeriodoLimiteNaoConfiguradoException extends CrudException {
  constructor(veiculoId: number, overrides: ContextMeta = {}) {
    super({
      message: `O veículo ${veiculoId} não possui quantidade limite configurada para validação de período. É necessário configurar a quantidade limite do veículo para validar abastecimentos em períodos Semanal ou Mensal.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PERIODO_LIMITE_NAO_CONFIGURADO',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Veículo deve possuir quantidade limite configurada para validação de período.',
        performed: `Validação de quantidade limite para veículo ${veiculoId}.`,
        additionalInfo: {
          veiculoId,
          suggestion: 'Configure a quantidade limite do veículo antes de criar solicitações de abastecimento com periodicidade Semanal ou Mensal.',
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoPeriodoLimiteExcedidoException extends CrudException {
  constructor(
    quantidade: number,
    limite: number,
    totalUtilizado: number,
    disponivel: number,
    veiculoId: number,
    periodicidade: string,
    periodoInicio: Date,
    periodoFim: Date,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `Quantidade solicitada (${quantidade} litros) ultrapassaria o limite do período (${limite} litros) para o veículo ${veiculoId}. Já utilizado no período: ${totalUtilizado} litros, disponível: ${disponivel} litros. Período: ${periodoInicio.toLocaleDateString('pt-BR')} a ${periodoFim.toLocaleDateString('pt-BR')} (${periodicidade}).`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_PERIODO_LIMITE_EXCEDIDO',
      context: buildContext('validate', {
        resourceId: veiculoId,
        expected: 'Soma da quantidade solicitada com as quantidades já utilizadas no período deve ser menor ou igual ao limite do veículo.',
        performed: `Validação de limite do período. Quantidade solicitada: ${quantidade} L, limite: ${limite} L, já utilizado: ${totalUtilizado} L.`,
        additionalInfo: {
          quantidade,
          limite,
          totalUtilizado,
          disponivel,
          veiculoId,
          periodicidade,
          periodoInicio: periodoInicio.toISOString(),
          periodoFim: periodoFim.toISOString(),
          novoTotal: totalUtilizado + quantidade,
          quantidadeMaximaPermitida: disponivel,
          diferenca: quantidade - disponivel,
          suggestion: `Ajuste a quantidade solicitada para no máximo ${disponivel} litros, que corresponde à quantidade disponível no período.`,
        },
        ...overrides,
      }),
    });
  }
}

export class SolicitacaoAbastecimentoCombustivelNaoContratadoNoProcessoException extends CrudException {
  constructor(
    combustivelId: number,
    veiculoId: number,
    processoId: number,
    orgaoId: number,
    prefeituraId: number,
    overrides: ContextMeta = {},
  ) {
    super({
      message: `O combustível ${combustivelId} não está contratado no processo ${processoId} do órgão ${orgaoId} da prefeitura ${prefeituraId}. Apenas combustíveis contratados no processo ativo do órgão podem ser utilizados para solicitações de abastecimento.`,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'SOLICITACAO_ABASTECIMENTO_COMBUSTIVEL_NAO_CONTRATADO_NO_PROCESSO',
      context: buildContext('validate', {
        resourceId: combustivelId,
        expected: 'Utilizar apenas combustíveis que estão contratados no processo ativo do órgão ao qual o veículo está vinculado.',
        performed: `Validação se o combustível ${combustivelId} está contratado no processo ${processoId} do órgão ${orgaoId}.`,
        additionalInfo: {
          combustivelId,
          veiculoId,
          processoId,
          orgaoId,
          prefeituraId,
          suggestion: 'Verifique se o combustível está cadastrado no processo ativo da prefeitura e se existe uma cota para este combustível no órgão do veículo.',
        },
        ...overrides,
      }),
    });
  }
}

