import { Module } from '@nestjs/common';

import {
  ICreateWalletGateway,
  ICreateWalletGatewaySymbol,
} from '../../../core/usecases/create-wallet/create-wallet.gateway';
import { ICreateWalletUseCaseSymbol } from '../../../core/usecases/create-wallet/create-wallet-usecase.interface';
import { CreateWalletUseCase } from '../../../core/usecases/create-wallet/create-wallet.usecase';
import {
  IGetWalletByIdGateway,
  IGetWalletByIdGatewaySymbol,
} from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id.gateway';
import { IGetWalletByIdUseCaseSymbol } from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface';
import { GetWalletByIdUseCase } from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id.usecase';
import { CreateWalletProvider } from '../../../infra/providers/create-wallet.provider';
import { GetWalletByIdProvider } from '../../../infra/providers/get-wallet-by-id.provider';
import { WalletRepository } from '../../../infra/repositories/wallet.repository';
import { WalletController } from './wallet.controller';

@Module({
  controllers: [WalletController],
  providers: [
    WalletRepository,
    {
      provide: ICreateWalletGatewaySymbol,
      useClass: CreateWalletProvider,
    },
    {
      provide: IGetWalletByIdGatewaySymbol,
      useClass: GetWalletByIdProvider,
    },
    {
      provide: ICreateWalletUseCaseSymbol,
      useFactory: (gateway: ICreateWalletGateway): CreateWalletUseCase =>
        new CreateWalletUseCase(gateway),
      inject: [ICreateWalletGatewaySymbol],
    },
    {
      provide: IGetWalletByIdUseCaseSymbol,
      useFactory: (gateway: IGetWalletByIdGateway): GetWalletByIdUseCase =>
        new GetWalletByIdUseCase(gateway),
      inject: [IGetWalletByIdGatewaySymbol],
    },
  ],
})
export class WalletModule {}
