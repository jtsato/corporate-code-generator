import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateWalletCommand } from '../../../core/usecases/create-wallet/create-wallet.command';
import {
  ICreateWalletUseCase,
  ICreateWalletUseCaseSymbol,
} from '../../../core/usecases/create-wallet/create-wallet-usecase.interface';
import { GetWalletByIdQuery } from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id.query';
import {
  IGetWalletByIdUseCase,
  IGetWalletByIdUseCaseSymbol,
} from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface';
import { CreateWalletRequest } from './create-wallet-request.model';
import { WalletPresenter } from './wallet-presenter.mapper';
import { WalletResponse } from './wallet-response.model';

@ApiTags('wallets')
@Controller('/wallets')
export class WalletController {
  public constructor(
    @Inject(ICreateWalletUseCaseSymbol)
    private readonly createWalletUseCase: ICreateWalletUseCase,
    @Inject(IGetWalletByIdUseCaseSymbol)
    private readonly getWalletByIdUseCase: IGetWalletByIdUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: WalletResponse })
  public async create(@Body() request: CreateWalletRequest): Promise<WalletResponse> {
    const wallet = await this.createWalletUseCase.execute(
      new CreateWalletCommand(
        request.id,
        request.balance,
      ),
    );

    return WalletPresenter.of(wallet);
  }

  @Get('/:id')
  @ApiOkResponse({ type: WalletResponse })
  public async getById(@Param('id') id: string): Promise<WalletResponse> {
    const wallet = await this.getWalletByIdUseCase.execute(
      new GetWalletByIdQuery(id),
    );

    return WalletPresenter.of(wallet);
  }
}
