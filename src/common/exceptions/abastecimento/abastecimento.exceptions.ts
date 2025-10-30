import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class AbastecimentoNotFoundException extends BaseException {
  constructor(id?: number) {
    const message = id 
      ? `Abastecimento com ID ${id} não encontrado`
      : 'Abastecimento não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Abastecimento Not Found', {
      id,
      timestamp: new Date().toISOString(),
    });
  }
}

export class AbastecimentoAlreadyExistsException extends BaseException {
  constructor(veiculoId: number, data: Date) {
    super(
      `Já existe um abastecimento para o veículo ID ${veiculoId} na data ${data.toISOString()}`,
      HttpStatus.CONFLICT,
      'Abastecimento Already Exists',
      {
        veiculoId,
        data,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoInvalidStatusException extends BaseException {
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

export class AbastecimentoCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir abastecimento com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir abastecimento com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class AbastecimentoInvalidQuantityException extends BaseException {
  constructor(quantity: number, maxQuantity?: number) {
    const message = maxQuantity
      ? `Quantidade inválida: ${quantity}. Máximo permitido: ${maxQuantity}`
      : `Quantidade inválida: ${quantity}`;
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid Quantity', {
      quantity,
      maxQuantity,
      timestamp: new Date().toISOString(),
    });
  }
}

export class AbastecimentoInvalidPriceException extends BaseException {
  constructor(price: number) {
    super(
      `Preço inválido: ${price}. Deve ser maior que zero`,
      HttpStatus.BAD_REQUEST,
      'Invalid Price',
      {
        price,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoInvalidDateException extends BaseException {
  constructor(date: Date, reason?: string) {
    const message = reason
      ? `Data inválida: ${date.toISOString()}. ${reason}`
      : `Data inválida: ${date.toISOString()}`;
    
    super(message, HttpStatus.BAD_REQUEST, 'Invalid Date', {
      date,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

export class AbastecimentoMissingVeiculoException extends BaseException {
  constructor(veiculoId: number) {
    super(
      `Veículo com ID ${veiculoId} não encontrado para o abastecimento`,
      HttpStatus.BAD_REQUEST,
      'Missing Veiculo',
      {
        veiculoId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoMissingCombustivelException extends BaseException {
  constructor(combustivelId: number) {
    super(
      `Combustível com ID ${combustivelId} não encontrado para o abastecimento`,
      HttpStatus.BAD_REQUEST,
      'Missing Combustivel',
      {
        combustivelId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoMissingEmpresaException extends BaseException {
  constructor(empresaId: number) {
    super(
      `Empresa com ID ${empresaId} não encontrada para o abastecimento`,
      HttpStatus.BAD_REQUEST,
      'Missing Empresa',
      {
        empresaId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action}`
      : `Não tem permissão para ${action}`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class AbastecimentoInvalidStatusForActionException extends BaseException {
  constructor(currentStatus: string, action: string) {
    super(
      `Não é possível ${action} abastecimento com status '${currentStatus}'`,
      HttpStatus.BAD_REQUEST,
      'Invalid Status For Action',
      {
        currentStatus,
        action,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class AbastecimentoExceedsLimitException extends BaseException {
  constructor(limit: number, current: number) {
    super(
      `Limite excedido: ${current}/${limit}`,
      HttpStatus.BAD_REQUEST,
      'Exceeds Limit',
      {
        limit,
        current,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
