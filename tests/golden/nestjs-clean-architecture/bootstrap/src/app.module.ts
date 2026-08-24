import { Module } from '@nestjs/common';

import { WalletModule } from './modules/wallet.module';

import { ConflictExceptionFilter } from './web-api/commons/filters/conflict.exception.filter';
import { HealthController } from './web-api/health/health.controller';
import { I18nModule } from './web-api/i18n/i18n.module';
import { NotFoundExceptionFilter } from './web-api/commons/filters/not-found.exception.filter';
import { ValidationExceptionFilter } from './web-api/commons/filters/validation.exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { Scope } from '@nestjs/common';

@Module({
  imports: [
    I18nModule,
    WalletModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ConflictExceptionFilter,
      scope: Scope.REQUEST,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
      scope: Scope.REQUEST,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
      scope: Scope.REQUEST,
    },
  ],
})
export class AppModule {}
