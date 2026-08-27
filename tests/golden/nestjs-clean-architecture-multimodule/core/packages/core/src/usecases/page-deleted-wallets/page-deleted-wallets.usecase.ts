import { PageResult } from '../../common/paging/page-result';
import { WalletTombstone } from '../../models/wallet-tombstone.model';
import { PageDeletedWalletQuery } from './page-deleted-wallets.query';
import { IPageDeletedWalletGateway } from './page-deleted-wallets.gateway';
import { IPageDeletedWalletUseCase } from './page-deleted-wallets-usecase.interface';

export class PageDeletedWalletUseCase implements IPageDeletedWalletUseCase {
  public constructor(private readonly gateway: IPageDeletedWalletGateway) {}

  public async execute(query: PageDeletedWalletQuery): Promise<PageResult<WalletTombstone>> {
    return this.gateway.execute(query.pageRequest, query.filterExpression);
  }
}
