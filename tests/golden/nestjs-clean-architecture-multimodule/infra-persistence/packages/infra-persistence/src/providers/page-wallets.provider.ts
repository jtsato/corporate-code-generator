import { Injectable } from '@nestjs/common';

import { FilterExpression } from '@wallet-service/core/common/filter/filter-expression';
import { PageRequest } from '@wallet-service/core/common/paging/page-request';
import { PageResult } from '@wallet-service/core/common/paging/page-result';
import { Wallet } from '@wallet-service/core/models/wallet.model';
import { IPageWalletGateway } from '@wallet-service/core/usecases/page-wallets/page-wallets.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class PageWalletProvider implements IPageWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<Wallet>> {
    const page = await this.repository.findPage(pageRequest, filterExpression);
    return new PageResult(
      page.items.map(WalletMapper.toDomain),
      page.page,
      page.size,
      page.totalItems,
    );
  }
}
