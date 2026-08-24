import { Module } from '@nestjs/common';
import { join } from 'path';
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule as NestI18nModule } from 'nestjs-i18n';

import { II18nServiceSymbol } from '../../core/i18n/i18n-service.interface';
import { I18nService } from './i18n.service';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      fallbacks: {
        'en-*': 'en',
        'pt-*': 'pt',
      },
      loader: I18nJsonLoader,
      loaderOptions: {
        path: join(__dirname, '/'),
        watch: false,
      },
      logging: false,
      resolvers: [AcceptLanguageResolver],
    }),
  ],
  providers: [
    I18nService,
    {
      provide: II18nServiceSymbol,
      useExisting: I18nService,
    },
  ],
  exports: [II18nServiceSymbol, I18nService],
})
export class I18nModule {}
