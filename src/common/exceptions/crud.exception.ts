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
  // Using 'any' instead of 'Record<string, unknown>' to allow DTOs and other complex types
  payload?: any;
  query?: any;
  user?: {
    id?: number | string;
    tipo?: string;
    email?: string;
  };
  correlationId?: string;
  // Using 'any' instead of 'Record<string, unknown>' to allow flexible additional information
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

