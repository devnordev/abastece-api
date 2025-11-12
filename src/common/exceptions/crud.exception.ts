import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export type CrudAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LIST';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface CrudExceptionContext {
  module: string;
  action: CrudAction;
  operation: string;
  route: string;
  method: HttpMethod;
  expected: string;
  performed: string;
  resourceId?: string | number;
  payload?: any;
  query?: any;
  user?: {
    id?: number | string;
    tipo?: string;
    email?: string;
  };
  correlationId?: string;
  additionalInfo?: any;
}

export interface CrudExceptionOptions {
  message: string;
  statusCode: HttpStatus;
  errorCode: string;
  context: CrudExceptionContext;
}

export class CrudException extends BaseException {
  constructor(options: CrudExceptionOptions) {
    const {
      message,
      statusCode,
      errorCode,
      context: {
        module,
        action,
        operation,
        route,
        method,
        expected,
        performed,
        resourceId,
        payload,
        query,
        user,
        correlationId,
        additionalInfo,
      },
    } = options;

    super(message, statusCode, errorCode, {
      module,
      action,
      operation,
      route,
      method,
      expected,
      performed,
      resourceId,
      payload,
      query,
      user,
      correlationId,
      additionalInfo,
      timestamp: new Date().toISOString(),
    });
  }
}

