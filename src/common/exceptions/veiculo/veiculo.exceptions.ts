import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class VeiculoNotFoundException extends BaseException {
  constructor(id?: number, placa?: string) {
    const message = id 
      ? `Veículo com ID ${id} não encontrado`
      : placa 
        ? `Veículo com placa ${placa} não encontrado`
        : 'Veículo não encontrado';
    
    super(message, HttpStatus.NOT_FOUND, 'Veiculo Not Found', {
      id,
      placa,
      timestamp: new Date().toISOString(),
    });
  }
}

export class VeiculoAlreadyExistsException extends BaseException {
  constructor(placa: string) {
    super(
      `Já existe um veículo com a placa ${placa}`,
      HttpStatus.CONFLICT,
      'Veiculo Already Exists',
      {
        placa,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoInactiveException extends BaseException {
  constructor(id?: number, placa?: string) {
    const message = placa
      ? `Veículo com placa ${placa} está inativo`
      : id
        ? `Veículo com ID ${id} está inativo`
        : 'Veículo está inativo';
    
    super(message, HttpStatus.FORBIDDEN, 'Veiculo Inactive', {
      id,
      placa,
      timestamp: new Date().toISOString(),
    });
  }
}

export class VeiculoCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir veículo com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir veículo com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class VeiculoInvalidPlacaException extends BaseException {
  constructor(placa: string) {
    super(
      `Placa inválida: ${placa}. Formato esperado: ABC-1234 ou ABC1234`,
      HttpStatus.BAD_REQUEST,
      'Invalid Placa',
      {
        placa,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoInvalidTipoException extends BaseException {
  constructor(tipo: string) {
    super(
      `Tipo de veículo inválido: ${tipo}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Veiculo Type',
      {
        tipo,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoInvalidSituacaoException extends BaseException {
  constructor(situacao: string) {
    super(
      `Situação do veículo inválida: ${situacao}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Situacao',
      {
        situacao,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoMissingPrefeituraException extends BaseException {
  constructor(prefeituraId: number) {
    super(
      `Prefeitura com ID ${prefeituraId} não encontrada para o veículo`,
      HttpStatus.BAD_REQUEST,
      'Missing Prefeitura',
      {
        prefeituraId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoMissingCategoriaException extends BaseException {
  constructor(categoriaId: number) {
    super(
      `Categoria com ID ${categoriaId} não encontrada para o veículo`,
      HttpStatus.BAD_REQUEST,
      'Missing Categoria',
      {
        categoriaId,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoInvalidAnoException extends BaseException {
  constructor(ano: number) {
    const currentYear = new Date().getFullYear();
    super(
      `Ano inválido: ${ano}. Deve estar entre 1900 e ${currentYear + 1}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Ano',
      {
        ano,
        currentYear,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoInvalidQuilometragemException extends BaseException {
  constructor(quilometragem: number) {
    super(
      `Quilometragem inválida: ${quilometragem}. Deve ser maior ou igual a zero`,
      HttpStatus.BAD_REQUEST,
      'Invalid Quilometragem',
      {
        quilometragem,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class VeiculoUnauthorizedException extends BaseException {
  constructor(action: string, userId?: number) {
    const message = userId
      ? `Usuário ${userId} não tem permissão para ${action} veículo`
      : `Não tem permissão para ${action} veículo`;
    
    super(message, HttpStatus.FORBIDDEN, 'Unauthorized Action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export class VeiculoInvalidImageException extends BaseException {
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

export class VeiculoDuplicatePlacaException extends BaseException {
  constructor(placa: string) {
    super(
      `Já existe um veículo com a placa ${placa}`,
      HttpStatus.CONFLICT,
      'Duplicate Placa',
      {
        placa,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
