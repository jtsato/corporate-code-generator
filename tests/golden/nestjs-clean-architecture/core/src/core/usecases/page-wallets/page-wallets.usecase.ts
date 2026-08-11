import { FilterExpression } from '../../common/filter/filter-expression';
import { PageRequest } from '../../common/paging/page-request';
import { PageResult } from '../../common/paging/page-result';
import { Wallet } from '../../models/wallet.model';
import { PageWalletQuery } from './page-wallets.query';
import { IPageWalletGateway } from './page-wallets.gateway';
import { IPageWalletUseCase } from './page-wallets-usecase.interface';

export class PageWalletUseCase implements IPageWalletUseCase {
  public constructor(private readonly gateway: IPageWalletGateway) {}

  public async execute(query: PageWalletQuery): Promise<PageResult<Wallet>> {
    return this.gateway.execute(query.pageRequest, query.filterExpression);
  }
}
