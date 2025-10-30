import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class OrgaoNotFoundException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = id 
      ? `Órgão com ID ${id} não encontrado`
      : nome 
        ? `Órgão "${nome}" não encontrado`
        : 'Órgão não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Orgao Not Found', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class OrgaoAlreadyExistsException extends BaseException {
  constructor(nome: string, prefeituraId: number) {
    super(
      `Já existe um órgão com o nome "${nome}" na prefeitura ID ${prefeituraId}`,
      HttpStatus.CONFLICT,
      'Orgao Already Exists',
      {
        nome,
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoInactiveException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = nome
      ? `Órgão "${nome}" está inativo`
      : id
        ? `Órgão com ID ${id} está inativo`
        : 'Órgão está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Orgao Inactive', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class OrgaoCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir órgão com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir órgão com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class OrgaoInvalidNomeException extends BaseException {
  constructor(nome: string) {
    super(
      `Nome do órgão inválido: "${nome}". Deve ter pelo menos 3 caracteres`,
      HttpStatus.BAD_REQUEST,
      'Invalid Nome',
      {
        nome,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoInvalidSiglaException extends BaseException {
  constructor(sigla: string) {
    super(
      `Sigla inválida: "${sigla}". Deve ter entre 2 e 10 caracteres`,
      HttpStatus.BAD_REQUEST,
      'Invalid Sigla',
      {
        sigla,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoMissingPrefeituraException extends BaseException {
  constructor(prefeituraId: number) {
    super(
      `Prefeitura com ID ${prefeituraId} não encontrada para o órgão`,
      HttpStatus.BAD_REQUEST,
      'Missing Prefeitura',
      {
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action} órgão`
      : `Não tem permissão para ${action} órgão`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class OrgaoDuplicateNomeException extends BaseException {
  constructor(nome: string, prefeituraId: number) {
    super(
      `Já existe um órgão com o nome "${nome}" na prefeitura ID ${prefeituraId}`,
      HttpStatus.CONFLICT,
      'Duplicate Nome',
      {
        nome,
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoDuplicateSiglaException extends BaseException {
  constructor(sigla: string, prefeituraId: number) {
    super(
      `Já existe um órgão com a sigla "${sigla}" na prefeitura ID ${prefeituraId}`,
      HttpStatus.CONFLICT,
      'Duplicate Sigla',
      {
        sigla,
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoInvalidStatusException extends BaseException {
  constructor(status: string) {
    super(
      `Status inválido: ${status}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Status',
      {
        status,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoMissingRequiredFieldsException extends BaseException {
  constructor(missingFields: string[]) {
    super(
      `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
      HttpStatus.BAD_REQUEST,
      'Missing Required Fields',
      {
        missingFields,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class OrgaoInvalidImageException extends BaseException {
  constructor(fileName?: string) {
    const message = fileName
      ? `Imagem inválida: ${fileName}`
      : 'Imagem inválida';
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid Image', {
      fileName,
      timestamp: new Date().toISOString(),
    });
  }
}
