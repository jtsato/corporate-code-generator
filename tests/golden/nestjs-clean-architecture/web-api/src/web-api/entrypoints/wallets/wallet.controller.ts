import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateWalletCommand } from '../../../core/usecases/create-wallet/create-wallet.command';
import { DeleteWalletCommand } from '../../../core/usecases/delete-wallet/delete-wallet.command';
import {
  IDeleteWalletUseCase,
  IDeleteWalletUseCaseSymbol,
} from '../../../core/usecases/delete-wallet/delete-wallet-usecase.interface';
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
import { PatchWalletCommand } from '../../../core/usecases/patch-wallet/patch-wallet.command';
import type { PatchWalletChanges } from '../../../core/usecases/patch-wallet/patch-wallet.changes';
import {
  IPatchWalletUseCase,
  IPatchWalletUseCaseSymbol,
} from '../../../core/usecases/patch-wallet/patch-wallet-usecase.interface';
import { GetDeletedWalletByIdQuery } from '../../../core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.query';
import {
  IGetDeletedWalletByIdUseCase,
  IGetDeletedWalletByIdUseCaseSymbol,
} from '../../../core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id-usecase.interface';
import { PageDeletedWalletQuery } from '../../../core/usecases/page-deleted-wallets/page-deleted-wallets.query';
import {
  IPageDeletedWalletUseCase,
  IPageDeletedWalletUseCaseSymbol,
} from '../../../core/usecases/page-deleted-wallets/page-deleted-wallets-usecase.interface';
import { RestoreWalletCommand } from '../../../core/usecases/restore-wallet/restore-wallet.command';
import {
  IRestoreWalletUseCase,
  IRestoreWalletUseCaseSymbol,
} from '../../../core/usecases/restore-wallet/restore-wallet-usecase.interface';
import { GetWalletByIdQuery } from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id.query';
import {
  IGetWalletByIdUseCase,
  IGetWalletByIdUseCaseSymbol,
} from '../../../core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface';
import { CreateWalletRequest } from './create-wallet-request.model';
import { PatchWalletRequest } from './patch-wallet-request.model';
import { WalletFilterParser } from './wallet-filter.parser';
import { WalletSortParser } from './wallet-sort.parser';
import { WalletPageRequest } from './wallet-page-request.model';
import { WalletPageResponse } from './wallet-page-response.model';
import { UpdateWalletRequest } from './update-wallet-request.model';
import { UpdateWalletCommand } from '../../../core/usecases/update-wallet/update-wallet.command';
import {
  IUpdateWalletUseCase,
  IUpdateWalletUseCaseSymbol,
} from '../../../core/usecases/update-wallet/update-wallet-usecase.interface';
import { HttpResponseBuilder } from '../../commons/models/http-response.builder';
import { HttpResponse } from '../../commons/models/http-response.model';
import { WalletPresenter } from './wallet-presenter.mapper';
import { WalletResponse } from './wallet-response.model';
import { WalletTombstonePageResponse } from './wallet-tombstone-page-response.model';
import { WalletTombstonePresenter } from './wallet-tombstone-presenter.mapper';
import { WalletTombstoneResponse } from './wallet-tombstone-response.model';

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
    @Inject(IUpdateWalletUseCaseSymbol)
    private readonly updateWalletUseCase: IUpdateWalletUseCase,
    @Inject(IPatchWalletUseCaseSymbol)
    private readonly patchWalletUseCase: IPatchWalletUseCase,
    @Inject(IDeleteWalletUseCaseSymbol)
    private readonly deleteWalletUseCase: IDeleteWalletUseCase,
    @Inject(IPageDeletedWalletUseCaseSymbol)
    private readonly pageDeletedWalletUseCase: IPageDeletedWalletUseCase,
    @Inject(IGetDeletedWalletByIdUseCaseSymbol)
    private readonly getDeletedWalletByIdUseCase: IGetDeletedWalletByIdUseCase,
    @Inject(IRestoreWalletUseCaseSymbol)
    private readonly restoreWalletUseCase: IRestoreWalletUseCase,
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
        new PageRequest(request.page ?? 0, request.size ?? 20, WalletSortParser.parse(request.sort)),
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

  // Declared before `/:id`. Nest matches routes in declaration order, so a later
  // `/deleted` would never be reached: `/:id` would claim it and the identifier
  // validator would answer 400 for the literal string 'deleted'.
  @Get('/deleted')
  @ApiOkResponse({ type: WalletTombstonePageResponse })
  public async pageDeleted(@Query() request: WalletPageRequest): Promise<HttpResponse<WalletTombstonePageResponse>> {
    const page = await this.pageDeletedWalletUseCase.execute(
      new PageDeletedWalletQuery(
        new PageRequest(request.page ?? 0, request.size ?? 20, WalletSortParser.parse(request.sort)),
        WalletFilterParser.parse(request.filter),
      ),
    );
    const responsePage = new PageResult(
      page.items.map(WalletTombstonePresenter.of),
      page.page,
      page.size,
      page.totalItems,
    );

    return new HttpResponseBuilder<WalletTombstonePageResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(new WalletTombstonePageResponse(responsePage))
      .build();
  }

  @Get('/deleted/:id')
  @ApiOkResponse({ type: WalletTombstoneResponse })
  @ApiNotFoundResponse()
  public async getDeletedById(@Param('id') id: string): Promise<HttpResponse<WalletTombstoneResponse>> {
    const tombstone = await this.getDeletedWalletByIdUseCase.execute(
      new GetDeletedWalletByIdQuery(id),
    );

    return new HttpResponseBuilder<WalletTombstoneResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(WalletTombstonePresenter.of(tombstone))
      .build();
  }

  @Get('/:id')
  @ApiOkResponse({ type: WalletResponse })
  @ApiNotFoundResponse()
  public async getById(@Param('id') id: string): Promise<HttpResponse<WalletResponse>> {
    const wallet = await this.getWalletByIdUseCase.execute(
      new GetWalletByIdQuery(id),
    );

    return new HttpResponseBuilder<WalletResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(WalletPresenter.of(wallet))
      .build();
  }

  @Put('/:id')
  @ApiOkResponse({ type: WalletResponse })
  @ApiNotFoundResponse()
  public async update(
    @Param('id') id: string,
    @Body() request: UpdateWalletRequest,
  ): Promise<HttpResponse<WalletResponse>> {
    const wallet = await this.updateWalletUseCase.execute(
      new UpdateWalletCommand(
        id,
        request.balance,
      ),
    );

    return new HttpResponseBuilder<WalletResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(WalletPresenter.of(wallet))
      .build();
  }

  @Patch('/:id')
  @ApiOkResponse({ type: WalletResponse })
  @ApiNotFoundResponse()
  public async patch(
    @Param('id') id: string,
    @Body() request: PatchWalletRequest,
  ): Promise<HttpResponse<WalletResponse>> {
    const changes: PatchWalletChanges = {
      ...(Object.prototype.hasOwnProperty.call(request, 'balance') && request.balance !== undefined
        ? { balance: request.balance }
        : {}),
    };

    const wallet = await this.patchWalletUseCase.execute(
      new PatchWalletCommand(id, changes),
    );

    return new HttpResponseBuilder<WalletResponse>()
      .withStatus(HttpStatus.OK)
      .withBody(WalletPresenter.of(wallet))
      .build();
  }

  @Post('/:id/restore')
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  public async restore(@Param('id') id: string): Promise<HttpResponse<void>> {
    await this.restoreWalletUseCase.execute(
      new RestoreWalletCommand(id),
    );

    return new HttpResponseBuilder<void>()
      .withStatus(HttpStatus.NO_CONTENT)
      .build();
  }

  // Soft delete: the row is retained and hidden from every active-only route.
  // `GET /deleted` and `POST /:id/restore` are how it is reached afterwards.
  @Delete('/:id')
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  public async delete(@Param('id') id: string): Promise<HttpResponse<void>> {
    await this.deleteWalletUseCase.execute(
      new DeleteWalletCommand(id),
    );

    return new HttpResponseBuilder<void>()
      .withStatus(HttpStatus.NO_CONTENT)
      .build();
  }
}
