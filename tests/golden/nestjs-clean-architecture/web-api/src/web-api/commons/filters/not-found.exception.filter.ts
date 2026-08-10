import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { NotFoundException } from '../../../core/exceptions/not-found.exception';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  public catch(exception: NotFoundException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
    });
  }
}
