import { Module } from '@nestjs/common';

import { WalletModule } from './web-api/entrypoints/wallets/wallet.module';

import { HealthController } from './web-api/health/health.controller';
@Module({
  imports: [
    WalletModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
