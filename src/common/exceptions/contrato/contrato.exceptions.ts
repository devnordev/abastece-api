import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class ContratoNotFoundException extends BaseException {
  constructor(id?: number) {
    const message = id 
      ? `Contrato com ID ${id} não encontrado`
      : 'Contrato não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Contrato Not Found', {
      id,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ContratoAlreadyExistsException extends BaseException {
  constructor(empresaId: number, title: string) {
    super(
      `Já existe um contrato com o título "${title}" para a empresa ID ${empresaId}`,
      HttpStatus.CONFLICT,
      'Contrato Already Exists',
      {
        empresaId,
        title,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class ContratoInactiveException extends BaseException {
  constructor(id?: number, title?: string) {
    const message = title
      ? `Contrato "${title}" está inativo`
      : id
        ? `Contrato com ID ${id} está inativo`
        : 'Contrato está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Contrato Inactive', {
      id,
      title,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ContratoCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir contrato com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir contrato com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ContratoInvalidVigenciaException extends BaseException {
  constructor(vigenciaInicio: Date, vigenciaFim: Date) {
    super(
      `Vigência inválida: data de início (${vigenciaInicio.toISOString()}) deve ser anterior à data de fim (${vigenciaFim.toISOString()})`,
      HttpStatus.BAD_REQUEST,
      'Invalid Vigencia',
      {
        vigenciaInicio,
        vigenciaFim,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class ContratoExpiredException extends BaseException {
  constructor(id?: number, vigenciaFim?: Date) {
    const message = vigenciaFim
      ? `Contrato expirou em ${vigenciaFim.toISOString()}`
      : id
        ? `Contrato com ID ${id} está expirado`
        : 'Contrato está expirado';
    
    super(message, HttpStatus.FORBIDDEN, 'Contrato Expired', {
      id,
      vigenciaFim,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ContratoNotStartedException extends BaseException {
  constructor(id?: number, vigenciaInicio?: Date) {
    const message = vigenciaInicio
      ? `Contrato ainda não iniciou. Vigência inicia em ${vigenciaInicio.toISOString()}`
      : id
        ? `Contrato com ID ${id} ainda não iniciou`
        : 'Contrato ainda não iniciou';
    
    super(message, HttpStatus.FORBIDDEN, 'Contrato Not Started', {
      id,
      vigenciaInicio,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ContratoInvalidCnpjException extends BaseException {
  constructor(cnpj: string) {
    super(
      `CNPJ inválido: ${cnpj}`,
      HttpStatus.BAD_REQUEST,
      'Invalid CNPJ',
      {
        cnpj,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class ContratoMissingEmpresaException extends BaseException {
  constructor(empresaId: number) {
    super(
      `Empresa com ID ${empresaId} não encontrada para criar o contrato`,
      HttpStatus.BAD_REQUEST,
      'Missing Empresa',
      {
        empresaId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class ContratoInvalidFileException extends BaseException {
  constructor(fileType: string, fileName?: string) {
    const message = fileName
      ? `Arquivo "${fileName}" é inválido para ${fileType}`
      : `Arquivo inválido para ${fileType}`;
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid File', {
      fileType,
      fileName,
      timestamp: new Date().toISOString(),
    });
  }
}
