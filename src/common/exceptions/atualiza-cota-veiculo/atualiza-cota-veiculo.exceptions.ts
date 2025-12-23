import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class PdfInvalidoException extends BaseException {
  constructor(razao?: string) {
    const message = razao
      ? `Arquivo PDF inválido: ${razao}`
      : 'O arquivo fornecido não é um PDF válido ou não pode ser processado';
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid PDF', {
      razao,
      timestamp: new Date().toISOString(),
    });
  }
}

export class NomePrefeituraNaoEncontradoNoPdfException extends BaseException {
  constructor() {
    super(
      'Não foi possível identificar o nome da prefeitura no arquivo PDF. Verifique se o documento contém informações sobre a prefeitura nas primeiras linhas.',
      HttpStatus.BAD_REQUEST,
      'Prefeitura Name Not Found In PDF',
      {
        timestamp: new Date().toISOString(),
        sugestao: 'O nome da prefeitura deve estar presente no início do documento PDF',
      },
    );
  }
}

export class PrefeituraNaoEncontradaNoBancoException extends BaseException {
  constructor(nomePrefeitura: string) {
    super(
      `A prefeitura "${nomePrefeitura}" encontrada no PDF não foi localizada no banco de dados. Verifique se o nome está correto e se a prefeitura está cadastrada no sistema.`,
      HttpStatus.NOT_FOUND,
      'Prefeitura Not Found In Database',
      {
        nomePrefeitura,
        timestamp: new Date().toISOString(),
        sugestao: 'Verifique se o nome da prefeitura no PDF corresponde exatamente ao cadastrado no sistema',
      },
    );
  }
}

export class CabecalhoTabelaNaoEncontradoException extends BaseException {
  constructor() {
    super(
      'Não foi possível encontrar o cabeçalho da tabela no PDF. O documento deve conter uma tabela com as colunas: Órgão, Placa, Cota Total e Cota Utilizada.',
      HttpStatus.BAD_REQUEST,
      'Table Header Not Found In PDF',
      {
        timestamp: new Date().toISOString(),
        colunasEsperadas: ['Órgão', 'Placa', 'Cota Total', 'Cota Utilizada'],
        sugestao: 'Verifique se o PDF contém uma tabela com essas colunas identificáveis',
      },
    );
  }
}

export class NenhumaLinhaValidaEncontradaException extends BaseException {
  constructor(totalLinhasProcessadas?: number) {
    const message = totalLinhasProcessadas !== undefined
      ? `Nenhuma linha de dados válida foi encontrada no PDF após processar ${totalLinhasProcessadas} linhas. Verifique se os dados estão no formato correto.`
      : 'Nenhuma linha de dados válida foi encontrada no PDF. Verifique se o documento contém dados de veículos no formato esperado.';
    
    super(message, HttpStatus.BAD_REQUEST, 'No Valid Data Rows Found', {
      totalLinhasProcessadas,
      timestamp: new Date().toISOString(),
      formatoEsperado: 'Órgão | Placa | Cota Total | Cota Utilizada',
    });
  }
}

export class OrgaoNaoEncontradoParaPrefeituraException extends BaseException {
  constructor(nomeOrgao: string, nomePrefeitura: string, prefeituraId: number) {
    super(
      `O órgão "${nomeOrgao}" não foi encontrado para a prefeitura "${nomePrefeitura}". Verifique se o órgão está cadastrado e ativo para esta prefeitura.`,
      HttpStatus.NOT_FOUND,
      'Orgao Not Found For Prefeitura',
      {
        nomeOrgao,
        nomePrefeitura,
        prefeituraId,
        timestamp: new Date().toISOString(),
        sugestao: 'Certifique-se de que o órgão está cadastrado e ativo no sistema para a prefeitura informada',
      },
    );
  }
}

export class VeiculoNaoEncontradoParaOrgaoException extends BaseException {
  constructor(placa: string, nomeOrgao: string, orgaoId: number) {
    super(
      `O veículo com placa "${placa}" não foi encontrado para o órgão "${nomeOrgao}". Verifique se o veículo está cadastrado e vinculado a este órgão.`,
      HttpStatus.NOT_FOUND,
      'Veiculo Not Found For Orgao',
      {
        placa,
        nomeOrgao,
        orgaoId,
        timestamp: new Date().toISOString(),
        sugestao: 'Certifique-se de que o veículo está cadastrado e ativo no sistema, vinculado ao órgão correto',
      },
    );
  }
}

export class VeiculoSemPeriodicidadeException extends BaseException {
  constructor(placa: string, veiculoId: number) {
    super(
      `O veículo com placa "${placa}" não possui periodicidade configurada. É necessário configurar a periodicidade (Diário, Semanal ou Mensal) para atualizar as cotas.`,
      HttpStatus.BAD_REQUEST,
      'Veiculo Without Periodicity',
      {
        placa,
        veiculoId,
        timestamp: new Date().toISOString(),
        sugestao: 'Configure a periodicidade do veículo antes de atualizar as cotas',
      },
    );
  }
}

export class ErroAoProcessarLinhaPdfException extends BaseException {
  constructor(linhaIndex: number, placa?: string, motivo?: string) {
    const message = motivo
      ? `Erro ao processar linha ${linhaIndex + 1} do PDF${placa ? ` (placa: ${placa})` : ''}: ${motivo}`
      : `Erro ao processar linha ${linhaIndex + 1} do PDF${placa ? ` (placa: ${placa})` : ''}. Verifique se os dados estão no formato correto.`;
    
    super(message, HttpStatus.BAD_REQUEST, 'Error Processing PDF Row', {
      linhaIndex: linhaIndex + 1,
      placa,
      motivo,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ErroAoAtualizarCotaVeiculoException extends BaseException {
  constructor(placa: string, veiculoId: number, motivo?: string) {
    const message = motivo
      ? `Erro ao atualizar a cota do veículo com placa "${placa}": ${motivo}`
      : `Erro ao atualizar a cota do veículo com placa "${placa}". Verifique se os dados estão corretos e se o veículo possui periodicidade configurada.`;
    
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Error Updating Veiculo Cota', {
      placa,
      veiculoId,
      motivo,
      timestamp: new Date().toISOString(),
    });
  }
}

export class DadosLinhaPdfInvalidosException extends BaseException {
  constructor(linhaIndex: number, camposFaltando?: string[]) {
    const message = camposFaltando && camposFaltando.length > 0
      ? `Dados inválidos na linha ${linhaIndex + 1} do PDF. Campos faltando ou inválidos: ${camposFaltando.join(', ')}`
      : `Dados inválidos na linha ${linhaIndex + 1} do PDF. Verifique se todos os campos obrigatórios estão presentes e no formato correto.`;
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid PDF Row Data', {
      linhaIndex: linhaIndex + 1,
      camposFaltando,
      camposObrigatorios: ['Órgão', 'Placa', 'Cota Total', 'Cota Utilizada'],
      timestamp: new Date().toISOString(),
    });
  }
}

export class ArquivoPdfVazioException extends BaseException {
  constructor() {
    super(
      'O arquivo PDF fornecido está vazio ou não contém texto que possa ser extraído. Verifique se o arquivo não está corrompido.',
      HttpStatus.BAD_REQUEST,
      'Empty PDF File',
      {
        timestamp: new Date().toISOString(),
        sugestao: 'Certifique-se de que o PDF contém texto legível e não é apenas uma imagem digitalizada',
      },
    );
  }
}

export class TamanhoArquivoPdfExcedidoException extends BaseException {
  constructor(tamanhoMaximo: number, tamanhoRecebido?: number) {
    const tamanhoMaximoMB = (tamanhoMaximo / (1024 * 1024)).toFixed(2);
    const tamanhoRecebidoMB = tamanhoRecebido ? (tamanhoRecebido / (1024 * 1024)).toFixed(2) : undefined;
    
    const message = tamanhoRecebido
      ? `O tamanho do arquivo PDF (${tamanhoRecebidoMB} MB) excede o limite permitido de ${tamanhoMaximoMB} MB`
      : `O tamanho do arquivo PDF excede o limite permitido de ${tamanhoMaximoMB} MB`;
    
    super(message, HttpStatus.BAD_REQUEST, 'PDF File Size Exceeded', {
      tamanhoMaximo,
      tamanhoMaximoMB: `${tamanhoMaximoMB} MB`,
      tamanhoRecebido,
      tamanhoRecebidoMB: tamanhoRecebidoMB ? `${tamanhoRecebidoMB} MB` : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

