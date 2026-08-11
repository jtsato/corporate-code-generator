import { Body, Controller, Get, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateWalletCommand } from '../../../core/usecases/create-wallet/create-wallet.command';
import { PageRequest } from '../../../core/common/paging/page-request';
import { PageResult } from '../../../core/common/paging/page-result';
import { PageWalletQuery } from '../../../core/usecases/page-wallets/page-wallets.query';
import {
  IPageWalletUseCase,
  IPageWalletUseCaseSymbol,
} from '../../../core/usecases/page-wallets/page-wallets-usecase.interface';
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
import { WalletFilterParser } from './wallet-filter.parser';
import { WalletPageRequest } from './wallet-page-request.model';
import { WalletPageResponse } from './wallet-page-response.model';
import { HttpResponseBuilder } from '../../commons/models/http-response.builder';
import { HttpResponse } from '../../commons/models/http-response.model';
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
    @Inject(IPageWalletUseCaseSymbol)
    private readonly pageWalletUseCase: IPageWalletUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: WalletResponse })
  public async create(@Body() request: CreateWalletRequest): Promise<HttpResponse<WalletResponse>> {
    const wallet = await this.createWalletUseCase.execute(
      new CreateWalletCommand(
        request.id,
        request.balance,
      ),
    );

    return new HttpResponseBuilder<WalletResponse>()
      .withStatus(HttpStatus.CREATED)
      .withHeaders({ Location: `/wallets/${request.id}` })
      .withBody(WalletPresenter.of(wallet))
      .build();
  }

  @Get()
  @ApiOkResponse({ type: WalletPageResponse })
  public async page(@Query() request: WalletPageRequest): Promise<HttpResponse<WalletPageResponse>> {
    const page = await this.pageWalletUseCase.execute(
      new PageWalletQuery(
        new PageRequest(request.page ?? 0, request.size ?? 20),
        WalletFilterParser.parse(request.filter),
      ),
    );
    const responsePage = new PageResult(
      page.items.map(WalletPresenter.of),
      page.page,
      page.size,
      page.totalItems,
    );

    return new HttpResponseBuilder<WalletPageResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(new WalletPageResponse(responsePage))
      .build();
  }

  @Get('/:id')
  @ApiOkResponse({ type: WalletResponse })
  public async getById(@Param('id') id: string): Promise<HttpResponse<WalletResponse>> {
    const wallet = await this.getWalletByIdUseCase.execute(
      new GetWalletByIdQuery(id),
    );

    return new HttpResponseBuilder<WalletResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(WalletPresenter.of(wallet))
      .build();
  }
}
