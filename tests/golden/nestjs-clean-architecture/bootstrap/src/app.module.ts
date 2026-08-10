import { Module } from '@nestjs/common';

import { WalletModule } from './web-api/entrypoints/wallets/wallet.module';

@Module({
  imports: [
    WalletModule,
  ],
})
export class AppModule {}
