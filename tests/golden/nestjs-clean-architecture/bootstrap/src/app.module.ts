import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WalletModule } from './modules/wallet.module';

import { ConflictExceptionFilter } from './web-api/commons/filters/conflict.exception.filter';
import { HealthController } from './web-api/health/health.controller';
import { I18nModule } from './web-api/i18n/i18n.module';
import { NotFoundExceptionFilter } from './web-api/commons/filters/not-found.exception.filter';
import { ValidationExceptionFilter } from './web-api/commons/filters/validation.exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { Scope } from '@nestjs/common';

import { EnvironmentSymbol, validateEnvironment } from './config/environment';
import type { Environment } from './config/environment';

@Module({
  imports: [
    // `.env` is listed first because @nestjs/config gives precedence to the
    // earlier file, so an uncommitted local override beats the committed default.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV ?? 'development'}`],
    }),
    I18nModule,
    WalletModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      // Eagerly instantiated during application start, so invalid configuration
      // fails the boot rather than the first request that needs a value. It runs
      // after ConfigModule has loaded the environment files.
      provide: EnvironmentSymbol,
      useFactory: (): Environment => validateEnvironment(),
    },
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
