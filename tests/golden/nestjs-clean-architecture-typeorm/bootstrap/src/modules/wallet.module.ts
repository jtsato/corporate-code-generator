import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ICreateWalletGateway,
  ICreateWalletGatewaySymbol,
} from '../core/usecases/create-wallet/create-wallet.gateway';
import { ICreateWalletUseCaseSymbol } from '../core/usecases/create-wallet/create-wallet-usecase.interface';
import { CreateWalletUseCase } from '../core/usecases/create-wallet/create-wallet.usecase';
import {
  IGetWalletByIdGateway,
  IGetWalletByIdGatewaySymbol,
} from '../core/usecases/get-wallet-by-id/get-wallet-by-id.gateway';
import { IGetWalletByIdUseCaseSymbol } from '../core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface';
import { GetWalletByIdUseCase } from '../core/usecases/get-wallet-by-id/get-wallet-by-id.usecase';
import {
  IUpdateWalletGateway,
  IUpdateWalletGatewaySymbol,
} from '../core/usecases/update-wallet/update-wallet.gateway';
import { IUpdateWalletUseCaseSymbol } from '../core/usecases/update-wallet/update-wallet-usecase.interface';
import { UpdateWalletUseCase } from '../core/usecases/update-wallet/update-wallet.usecase';
import { IPatchWalletUseCaseSymbol } from '../core/usecases/patch-wallet/patch-wallet-usecase.interface';
import { PatchWalletUseCase } from '../core/usecases/patch-wallet/patch-wallet.usecase';
import {
  IDeleteWalletGateway,
  IDeleteWalletGatewaySymbol,
} from '../core/usecases/delete-wallet/delete-wallet.gateway';
import { IDeleteWalletUseCaseSymbol } from '../core/usecases/delete-wallet/delete-wallet-usecase.interface';
import { DeleteWalletUseCase } from '../core/usecases/delete-wallet/delete-wallet.usecase';
import {
  IPageWalletGateway,
  IPageWalletGatewaySymbol,
} from '../core/usecases/page-wallets/page-wallets.gateway';
import {
  IGetDeletedWalletByIdGateway,
  IGetDeletedWalletByIdGatewaySymbol,
} from '../core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.gateway';
import { IGetDeletedWalletByIdUseCaseSymbol } from '../core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id-usecase.interface';
import { GetDeletedWalletByIdUseCase } from '../core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.usecase';
import {
  IPageDeletedWalletGateway,
  IPageDeletedWalletGatewaySymbol,
} from '../core/usecases/page-deleted-wallets/page-deleted-wallets.gateway';
import { IPageDeletedWalletUseCaseSymbol } from '../core/usecases/page-deleted-wallets/page-deleted-wallets-usecase.interface';
import { PageDeletedWalletUseCase } from '../core/usecases/page-deleted-wallets/page-deleted-wallets.usecase';
import {
  IRestoreWalletGateway,
  IRestoreWalletGatewaySymbol,
} from '../core/usecases/restore-wallet/restore-wallet.gateway';
import { IRestoreWalletUseCaseSymbol } from '../core/usecases/restore-wallet/restore-wallet-usecase.interface';
import { RestoreWalletUseCase } from '../core/usecases/restore-wallet/restore-wallet.usecase';
import { IPageWalletUseCaseSymbol } from '../core/usecases/page-wallets/page-wallets-usecase.interface';
import { PageWalletUseCase } from '../core/usecases/page-wallets/page-wallets.usecase';
import { CreateWalletProvider } from '../infra/providers/create-wallet.provider';
import { GetWalletByIdProvider } from '../infra/providers/get-wallet-by-id.provider';
import { UpdateWalletProvider } from '../infra/providers/update-wallet.provider';
import { DeleteWalletProvider } from '../infra/providers/delete-wallet.provider';
import { PageWalletProvider } from '../infra/providers/page-wallets.provider';
import { GetDeletedWalletByIdProvider } from '../infra/providers/get-deleted-wallet-by-id.provider';
import { PageDeletedWalletProvider } from '../infra/providers/page-deleted-wallets.provider';
import { RestoreWalletProvider } from '../infra/providers/restore-wallet.provider';
import { WalletEntity } from '../infra/models/wallet-entity.model';
import { WalletRepository } from '../infra/repositories/wallet.repository';
import { WalletController } from '../web-api/entrypoints/wallets/wallet.controller';

@Module({
  // Registers the entity's TypeORM repository so `@InjectRepository` can resolve
  // it, and lets `autoLoadEntities` discover the entity without AppModule having
  // to list every one of them.
  imports: [TypeOrmModule.forFeature([WalletEntity])],
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
