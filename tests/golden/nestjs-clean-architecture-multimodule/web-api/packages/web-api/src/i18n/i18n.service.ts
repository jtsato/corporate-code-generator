import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService as NestI18nService } from 'nestjs-i18n';

import { II18nService } from '@wallet-service/core/i18n/i18n-service.interface';

@Injectable()
export class I18nService implements II18nService {
  public constructor(private readonly service: NestI18nService) {}

  public translate(key: string, defaultMessage: string): string {
    const context = I18nContext.current();
    const translated = this.service.translate(`messages.${key}`, {
      lang: context?.lang,
      defaultValue: defaultMessage,
    });

    return translated === `messages.${key}` || typeof translated !== 'string'
      ? defaultMessage
      : translated;
  }
}
