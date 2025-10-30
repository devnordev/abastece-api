import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class EmpresaNotFoundException extends BaseException {
  constructor(id?: number, cnpj?: string) {
    const message = id 
      ? `Empresa com ID ${id} não encontrada`
      : cnpj 
        ? `Empresa com CNPJ ${cnpj} não encontrada`
        : 'Empresa não encontrada';
    
    super(message, HttpStatus.NOT_FOUND, 'Empresa Not Found', {
      id,
      cnpj,
      timestamp: new Date().toISOString(),
    });
  }
}

export class EmpresaAlreadyExistsException extends BaseException {
  constructor(cnpj: string) {
    super(
      `Já existe uma empresa com o CNPJ ${cnpj}`,
      HttpStatus.CONFLICT,
      'Empresa Already Exists',
      {
        cnpj,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class EmpresaInactiveException extends BaseException {
  constructor(id?: number, nome?: string) {
    const message = nome
      ? `Empresa ${nome} está inativa`
      : id
        ? `Empresa com ID ${id} está inativa`
        : 'Empresa está inativa';
    
    super(message, HttpStatus.FORBIDDEN, 'Empresa Inactive', {
      id,
      nome,
      timestamp: new Date().toISOString(),
    });
  }
}

export class EmpresaCannotDeleteWithRelationsException extends BaseException {
  constructor(relations?: string[]) {
    const message = relations && relations.length > 0
      ? `Não é possível excluir empresa com relacionamentos ativos: ${relations.join(', ')}`
      : 'Não é possível excluir empresa com relacionamentos ativos';
    
    super(message, HttpStatus.BAD_REQUEST, 'Cannot Delete With Relations', {
      relations,
      timestamp: new Date().toISOString(),
    });
  }
}

export class EmpresaInvalidCoordinatesException extends BaseException {
  constructor(latitude?: number, longitude?: number) {
    super(
      'Coordenadas inválidas fornecidas',
      HttpStatus.BAD_REQUEST,
      'Invalid Coordinates',
      {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class EmpresaNotFoundNearbyException extends BaseException {
  constructor(latitude: number, longitude: number, radius: number) {
    super(
      `Nenhuma empresa encontrada nas proximidades (raio: ${radius}km)`,
      HttpStatus.NOT_FOUND,
      'No Nearby Empresas Found',
      {
        latitude,
        longitude,
        radius,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class EmpresaInvalidCnpjException extends BaseException {
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

export class EmpresaInvalidUfException extends BaseException {
  constructor(uf: string) {
    super(
      `UF inválida: ${uf}. Use uma das UFs válidas do Brasil`,
      HttpStatus.BAD_REQUEST,
      'Invalid UF',
      {
        uf,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

export class EmpresaInvalidTipoException extends BaseException {
  constructor(tipo: string) {
    super(
      `Tipo de empresa inválido: ${tipo}`,
      HttpStatus.BAD_REQUEST,
      'Invalid Empresa Type',
      {
        tipo,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
