import { Module } from '@nestjs/common';

import {
  ICreateWalletGateway,
  ICreateWalletGatewaySymbol,
} from '@wallet-service/core/usecases/create-wallet/create-wallet.gateway';
import { ICreateWalletUseCaseSymbol } from '@wallet-service/core/usecases/create-wallet/create-wallet-usecase.interface';
import { CreateWalletUseCase } from '@wallet-service/core/usecases/create-wallet/create-wallet.usecase';
import {
  IGetWalletByIdGateway,
  IGetWalletByIdGatewaySymbol,
} from '@wallet-service/core/usecases/get-wallet-by-id/get-wallet-by-id.gateway';
import { IGetWalletByIdUseCaseSymbol } from '@wallet-service/core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface';
import { GetWalletByIdUseCase } from '@wallet-service/core/usecases/get-wallet-by-id/get-wallet-by-id.usecase';
import {
  IUpdateWalletGateway,
  IUpdateWalletGatewaySymbol,
} from '@wallet-service/core/usecases/update-wallet/update-wallet.gateway';
import { IUpdateWalletUseCaseSymbol } from '@wallet-service/core/usecases/update-wallet/update-wallet-usecase.interface';
import { UpdateWalletUseCase } from '@wallet-service/core/usecases/update-wallet/update-wallet.usecase';
import { IPatchWalletUseCaseSymbol } from '@wallet-service/core/usecases/patch-wallet/patch-wallet-usecase.interface';
import { PatchWalletUseCase } from '@wallet-service/core/usecases/patch-wallet/patch-wallet.usecase';
import {
  IDeleteWalletGateway,
  IDeleteWalletGatewaySymbol,
} from '@wallet-service/core/usecases/delete-wallet/delete-wallet.gateway';
import { IDeleteWalletUseCaseSymbol } from '@wallet-service/core/usecases/delete-wallet/delete-wallet-usecase.interface';
import { DeleteWalletUseCase } from '@wallet-service/core/usecases/delete-wallet/delete-wallet.usecase';
import {
  IPageWalletGateway,
  IPageWalletGatewaySymbol,
} from '@wallet-service/core/usecases/page-wallets/page-wallets.gateway';
import {
  IGetDeletedWalletByIdGateway,
  IGetDeletedWalletByIdGatewaySymbol,
} from '@wallet-service/core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.gateway';
import { IGetDeletedWalletByIdUseCaseSymbol } from '@wallet-service/core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id-usecase.interface';
import { GetDeletedWalletByIdUseCase } from '@wallet-service/core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.usecase';
import {
  IPageDeletedWalletGateway,
  IPageDeletedWalletGatewaySymbol,
} from '@wallet-service/core/usecases/page-deleted-wallets/page-deleted-wallets.gateway';
import { IPageDeletedWalletUseCaseSymbol } from '@wallet-service/core/usecases/page-deleted-wallets/page-deleted-wallets-usecase.interface';
import { PageDeletedWalletUseCase } from '@wallet-service/core/usecases/page-deleted-wallets/page-deleted-wallets.usecase';
import {
  IRestoreWalletGateway,
  IRestoreWalletGatewaySymbol,
} from '@wallet-service/core/usecases/restore-wallet/restore-wallet.gateway';
import { IRestoreWalletUseCaseSymbol } from '@wallet-service/core/usecases/restore-wallet/restore-wallet-usecase.interface';
import { RestoreWalletUseCase } from '@wallet-service/core/usecases/restore-wallet/restore-wallet.usecase';
import { IPageWalletUseCaseSymbol } from '@wallet-service/core/usecases/page-wallets/page-wallets-usecase.interface';
import { PageWalletUseCase } from '@wallet-service/core/usecases/page-wallets/page-wallets.usecase';
import { CreateWalletProvider } from '@wallet-service/infra-persistence/providers/create-wallet.provider';
import { GetWalletByIdProvider } from '@wallet-service/infra-persistence/providers/get-wallet-by-id.provider';
import { UpdateWalletProvider } from '@wallet-service/infra-persistence/providers/update-wallet.provider';
import { DeleteWalletProvider } from '@wallet-service/infra-persistence/providers/delete-wallet.provider';
import { PageWalletProvider } from '@wallet-service/infra-persistence/providers/page-wallets.provider';
import { GetDeletedWalletByIdProvider } from '@wallet-service/infra-persistence/providers/get-deleted-wallet-by-id.provider';
import { PageDeletedWalletProvider } from '@wallet-service/infra-persistence/providers/page-deleted-wallets.provider';
import { RestoreWalletProvider } from '@wallet-service/infra-persistence/providers/restore-wallet.provider';
import { WalletRepository } from '@wallet-service/infra-persistence/repositories/wallet.repository';
import { WalletController } from '@wallet-service/web-api/entrypoints/wallets/wallet.controller';

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
      provide: IUpdateWalletGatewaySymbol,
      useClass: UpdateWalletProvider,
    },
    {
      provide: IDeleteWalletGatewaySymbol,
      useClass: DeleteWalletProvider,
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
    {
      provide: IUpdateWalletUseCaseSymbol,
      useFactory: (gateway: IUpdateWalletGateway): UpdateWalletUseCase =>
        new UpdateWalletUseCase(gateway),
      inject: [IUpdateWalletGatewaySymbol],
    },
    {
      provide: IPatchWalletUseCaseSymbol,
      useFactory: (getByIdGateway: IGetWalletByIdGateway, updateGateway: IUpdateWalletGateway): PatchWalletUseCase =>
        new PatchWalletUseCase(getByIdGateway, updateGateway),
      inject: [IGetWalletByIdGatewaySymbol, IUpdateWalletGatewaySymbol],
    },
    {
      provide: IDeleteWalletUseCaseSymbol,
      useFactory: (gateway: IDeleteWalletGateway): DeleteWalletUseCase =>
        new DeleteWalletUseCase(gateway),
      inject: [IDeleteWalletGatewaySymbol],
    },
    {
      provide: IPageWalletGatewaySymbol,
      useClass: PageWalletProvider,
    },
    {
      provide: IPageWalletUseCaseSymbol,
      useFactory: (gateway: IPageWalletGateway): PageWalletUseCase =>
        new PageWalletUseCase(gateway),
      inject: [IPageWalletGatewaySymbol],
    },
    {
      provide: IGetDeletedWalletByIdGatewaySymbol,
      useClass: GetDeletedWalletByIdProvider,
    },
    {
      provide: IGetDeletedWalletByIdUseCaseSymbol,
      useFactory: (gateway: IGetDeletedWalletByIdGateway): GetDeletedWalletByIdUseCase =>
        new GetDeletedWalletByIdUseCase(gateway),
      inject: [IGetDeletedWalletByIdGatewaySymbol],
    },
    {
      provide: IPageDeletedWalletGatewaySymbol,
      useClass: PageDeletedWalletProvider,
    },
    {
      provide: IPageDeletedWalletUseCaseSymbol,
      useFactory: (gateway: IPageDeletedWalletGateway): PageDeletedWalletUseCase =>
        new PageDeletedWalletUseCase(gateway),
      inject: [IPageDeletedWalletGatewaySymbol],
    },
    {
      provide: IRestoreWalletGatewaySymbol,
      useClass: RestoreWalletProvider,
    },
    {
      provide: IRestoreWalletUseCaseSymbol,
      useFactory: (gateway: IRestoreWalletGateway): RestoreWalletUseCase =>
        new RestoreWalletUseCase(gateway),
      inject: [IRestoreWalletGatewaySymbol],
    },
  ],
})
export class WalletModule {}
