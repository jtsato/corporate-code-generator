import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { NotFoundException } from '../../../core/exceptions/not-found.exception';
import { I18nService } from '../../i18n/i18n.service';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  public constructor(private readonly i18n: I18nService) {}

  public catch(exception: NotFoundException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<{ headers: { 'accept-language'?: string | string[] } }>();
    const detail = exception.message.includes(': ')
      ? exception.message.slice(exception.message.indexOf(': ') + 2)
      : undefined;
    const message = this.i18n.locale(request.headers['accept-language']) === 'en'
      ? exception.message
      : `${this.i18n.translate('notFound', request.headers['accept-language'])}${detail === undefined ? '' : `: ${detail}`}`;

    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message,
    });
  }
}
