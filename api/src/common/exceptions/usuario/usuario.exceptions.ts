import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class UsuarioNotFoundException extends BaseException {
  constructor(id?: number, email?: string) {
    const message = id 
      ? `Usuário com ID ${id} não encontrado`
      : email 
        ? `Usuário com email ${email} não encontrado`
        : 'Usuário não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Usuario Not Found', {
      id,
      email,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioAlreadyExistsException extends BaseException {
  constructor(email?: string, cpf?: string) {
    const message = email && cpf
      ? `Já existe um usuário com o email ${email} ou CPF ${cpf}`
      : email
        ? `Já existe um usuário com o email ${email}`
        : cpf
          ? `Já existe um usuário com o CPF ${cpf}`
          : 'Usuário já existe';
    
    super(message, HttpStatus.CONFLICT, 'Usuario Already Exists', {
      email,
      cpf,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioInactiveException extends BaseException {
  constructor(email?: string) {
    const message = email
      ? `Usuário ${email} está inativo`
      : 'Usuário está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Usuario Inactive', {
      email,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioAccessDeniedException extends BaseException {
  constructor(statusAcess?: string) {
    const message = statusAcess
      ? `Acesso negado. Status atual: ${statusAcess}`
      : 'Acesso negado';
    
    super(message, HttpStatus.FORBIDDEN, 'Usuario Access Denied', {
      statusAcess,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioInvalidCredentialsException extends BaseException {
  constructor() {
    super(
      'Credenciais inválidas. Verifique seu email e senha',
      HttpStatus.UNAUTHORIZED,
      'Invalid Credentials',
      {
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class UsuarioPermissionDeniedException extends BaseException {
  constructor(requiredPermission?: string) {
    const message = requiredPermission
      ? `Permissão necessária: ${requiredPermission}`
      : 'Permissão negada para esta operação';
    
    super(message, HttpStatus.FORBIDDEN, 'Permission Denied', {
      requiredPermission,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir usuário com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir usuário com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class UsuarioInvalidStatusTransitionException extends BaseException {
  constructor(currentStatus: string, newStatus: string) {
    super(
      `Transição de status inválida: de '${currentStatus}' para '${newStatus}'`,
      HttpStatus.BAD_REQUEST,
      'Invalid Status Transition',
      {
        currentStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
