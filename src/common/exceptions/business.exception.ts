import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BusinessException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'Business Error', details);
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'Validation Error', details);
  }
}

export class ConflictException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.CONFLICT, 'Conflict Error', details);
  }
}

export class NotFoundException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.NOT_FOUND, 'Not Found Error', details);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized Error', details);
  }
}

export class ForbiddenException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.FORBIDDEN, 'Forbidden Error', details);
  }
}
