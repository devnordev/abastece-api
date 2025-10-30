import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class PrefeituraNotFoundException extends BaseException {
  constructor(id?: number, cnpj?: string) {
    const message = id 
      ? `Prefeitura com ID ${id} não encontrada`
      : cnpj 
        ? `Prefeitura com CNPJ ${cnpj} não encontrada`
        : 'Prefeitura não encontrada';
    
    super(message, HttpStatus.NOT_FOUND, 'Prefeitura Not Found', {
      id,
      cnpj,
      timestamp: new Date().toISOString(),
    });
  }
}

export class PrefeituraAlreadyExistsException extends BaseException {
  constructor(cnpj: string) {
    super(
      `Já existe uma prefeitura com o CNPJ ${cnpj}`,
      HttpStatus.CONFLICT,
      'Prefeitura Already Exists',
      {
        cnpj,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class PrefeituraInactiveException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = nome
      ? `Prefeitura ${nome} está inativa`
      : id
        ? `Prefeitura com ID ${id} está inativa`
        : 'Prefeitura está inativa';
    
    super(message, HttpStatus.FORBIDDEN, 'Prefeitura Inactive', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class PrefeituraCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir prefeitura com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir prefeitura com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class PrefeituraInvalidCnpjException extends BaseException {
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

export class PrefeituraInvalidEmailException extends BaseException {
  constructor(email: string) {
    super(
      `Email administrativo inválido: ${email}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Email',
      {
        email,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class PrefeituraMissingRequiredFieldsException extends BaseException {
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

export class PrefeituraInvalidCupomFiscalException extends BaseException {
  constructor(requerCupom: boolean) {
    super(
      `Configuração de cupom fiscal inválida: ${requerCupom}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Cupom Fiscal',
      {
        requerCupom,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class PrefeituraUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action} prefeitura`
      : `Não tem permissão para ${action} prefeitura`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class PrefeituraInvalidImageException extends BaseException {
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

export class PrefeituraDuplicateNameException extends BaseException {
  constructor(nome: string) {
    super(
      `Já existe uma prefeitura com o nome "${nome}"`,
      HttpStatus.CONFLICT,
      'Duplicate Name',
      {
        nome,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
