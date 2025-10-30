import { HttpException, HttpStatus } from '@nestjs/common';

export interface ExceptionResponse {
  message: string;
  error: string;
  statusCode: number;
  details?: any;
}

export abstract class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    error: string,
    details?: any,
  ) {
    const response: ExceptionResponse = {
      message,
      error,
      statusCode,
      details,
    };
    super(response, statusCode);
  }
}
