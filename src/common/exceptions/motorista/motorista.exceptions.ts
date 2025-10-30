import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class MotoristaNotFoundException extends BaseException {
  constructor(id?: number, cpf?: string) {
    const message = id 
      ? `Motorista com ID ${id} não encontrado`
      : cpf 
        ? `Motorista com CPF ${cpf} não encontrado`
        : 'Motorista não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Motorista Not Found', {
      id,
      cpf,
      timestamp: new Date().toISOString(),
    });
  }
}

export class MotoristaAlreadyExistsException extends BaseException {
  constructor(cpf: string) {
    super(
      `Já existe um motorista com o CPF ${cpf}`,
      HttpStatus.CONFLICT,
      'Motorista Already Exists',
      {
        cpf,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaInactiveException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = nome
      ? `Motorista ${nome} está inativo`
      : id
        ? `Motorista com ID ${id} está inativo`
        : 'Motorista está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Motorista Inactive', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class MotoristaCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir motorista com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir motorista com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class MotoristaInvalidCpfException extends BaseException {
  constructor(cpf: string) {
    super(
      `CPF inválido: ${cpf}`,
      HttpStatus.BAD_REQUEST,
      'Invalid CPF',
      {
        cpf,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaInvalidCnhException extends BaseException {
  constructor(cnh: string) {
    super(
      `CNH inválida: ${cnh}`,
      HttpStatus.BAD_REQUEST,
      'Invalid CNH',
      {
        cnh,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaInvalidCategoriaCnhException extends BaseException {
  constructor(categoria: string) {
    super(
      `Categoria de CNH inválida: ${categoria}. Categorias válidas: A, B, C, D, E`,
      HttpStatus.BAD_REQUEST,
      'Invalid CNH Category',
      {
        categoria,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaInvalidDataNascimentoException extends BaseException {
  constructor(dataNascimento: Date) {
    const age = new Date().getFullYear() - dataNascimento.getFullYear();
    super(
      `Data de nascimento inválida: ${dataNascimento.toISOString()}. Idade: ${age} anos`,
      HttpStatus.BAD_REQUEST,
      'Invalid Birth Date',
      {
        dataNascimento,
        age,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaMissingPrefeituraException extends BaseException {
  constructor(prefeituraId: number) {
    super(
      `Prefeitura com ID ${prefeituraId} não encontrada para o motorista`,
      HttpStatus.BAD_REQUEST,
      'Missing Prefeitura',
      {
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaMissingCategoriaException extends BaseException {
  constructor(categoriaId: number) {
    super(
      `Categoria com ID ${categoriaId} não encontrada para o motorista`,
      HttpStatus.BAD_REQUEST,
      'Missing Categoria',
      {
        categoriaId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaInvalidTelefoneException extends BaseException {
  constructor(telefone: string) {
    super(
      `Telefone inválido: ${telefone}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Telefone',
      {
        telefone,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action} motorista`
      : `Não tem permissão para ${action} motorista`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class MotoristaInvalidImageException extends BaseException {
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

export class MotoristaDuplicateCpfException extends BaseException {
  constructor(cpf: string) {
    super(
      `Já existe um motorista com o CPF ${cpf}`,
      HttpStatus.CONFLICT,
      'Duplicate CPF',
      {
        cpf,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class MotoristaDuplicateCnhException extends BaseException {
  constructor(cnh: string) {
    super(
      `Já existe um motorista com a CNH ${cnh}`,
      HttpStatus.CONFLICT,
      'Duplicate CNH',
      {
        cnh,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
