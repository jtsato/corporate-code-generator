import { Injectable } from '@nestjs/common';

import { FilterExpression } from '@wallet-service/core/common/filter/filter-expression';
import { PageRequest } from '@wallet-service/core/common/paging/page-request';
import { PageResult } from '@wallet-service/core/common/paging/page-result';
import { WalletTombstone } from '@wallet-service/core/models/wallet-tombstone.model';
import { IPageDeletedWalletGateway } from '@wallet-service/core/usecases/page-deleted-wallets/page-deleted-wallets.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class PageDeletedWalletProvider implements IPageDeletedWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletTombstone>> {
    const page = await this.repository.findDeletedPage(pageRequest, filterExpression);

    return new PageResult(
      page.items.map(WalletMapper.toTombstone),
      page.page,
      page.size,
      page.totalItems,
    );
  }
}
