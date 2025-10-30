import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class CombustivelNotFoundException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = id 
      ? `Combustível com ID ${id} não encontrado`
      : nome 
        ? `Combustível "${nome}" não encontrado`
        : 'Combustível não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Combustivel Not Found', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class CombustivelAlreadyExistsException extends BaseException {
  constructor(nome: string, sigla?: string) {
    const message = sigla
      ? `Já existe um combustível com o nome "${nome}" ou sigla "${sigla}"`
      : `Já existe um combustível com o nome "${nome}"`;
    
    super(message, HttpStatus.CONFLICT, 'Combustivel Already Exists', {
      nome,
      sigla,
      timestamp: new Date().toISOString(),
    });
  }
}

export class CombustivelInactiveException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = nome
      ? `Combustível "${nome}" está inativo`
      : id
        ? `Combustível com ID ${id} está inativo`
        : 'Combustível está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Combustivel Inactive', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class CombustivelCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir combustível com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir combustível com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class CombustivelInvalidNomeException extends BaseException {
  constructor(nome: string) {
    super(
      `Nome do combustível inválido: "${nome}". Deve ter pelo menos 2 caracteres`,
      HttpStatus.BAD_REQUEST,
      'Invalid Nome',
      {
        nome,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelInvalidSiglaException extends BaseException {
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

export class CombustivelInvalidTipoException extends BaseException {
  constructor(tipo: string) {
    super(
      `Tipo de combustível inválido: ${tipo}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Combustivel Type',
      {
        tipo,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelInvalidPrecoException extends BaseException {
  constructor(preco: number) {
    super(
      `Preço inválido: ${preco}. Deve ser maior que zero`,
      HttpStatus.BAD_REQUEST,
      'Invalid Preco',
      {
        preco,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelInvalidAnpException extends BaseException {
  constructor(anp: string) {
    super(
      `Código ANP inválido: ${anp}`,
      HttpStatus.BAD_REQUEST,
      'Invalid ANP',
      {
        anp,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelMissingEmpresaException extends BaseException {
  constructor(empresaId: number) {
    super(
      `Empresa com ID ${empresaId} não encontrada para o combustível`,
      HttpStatus.BAD_REQUEST,
      'Missing Empresa',
      {
        empresaId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action} combustível`
      : `Não tem permissão para ${action} combustível`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class CombustivelDuplicateNomeException extends BaseException {
  constructor(nome: string) {
    super(
      `Já existe um combustível com o nome "${nome}"`,
      HttpStatus.CONFLICT,
      'Duplicate Nome',
      {
        nome,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelDuplicateSiglaException extends BaseException {
  constructor(sigla: string) {
    super(
      `Já existe um combustível com a sigla "${sigla}"`,
      HttpStatus.CONFLICT,
      'Duplicate Sigla',
      {
        sigla,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class CombustivelInvalidStatusException extends BaseException {
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

export class CombustivelPriceUpdateException extends BaseException {
  constructor(combustivelId: number, oldPrice: number, newPrice: number) {
    super(
      `Erro ao atualizar preço do combustível ID ${combustivelId}: de ${oldPrice} para ${newPrice}`,
      HttpStatus.BAD_REQUEST,
      'Price Update Error',
      {
        combustivelId,
        oldPrice,
        newPrice,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
