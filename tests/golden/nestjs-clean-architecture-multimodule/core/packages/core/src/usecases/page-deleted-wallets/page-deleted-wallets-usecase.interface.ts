import { PageDeletedWalletQuery } from './page-deleted-wallets.query';
import { PageResult } from '../../common/paging/page-result';
import { WalletTombstone } from '../../models/wallet-tombstone.model';

export interface IPageDeletedWalletUseCase {
  execute(query: PageDeletedWalletQuery): Promise<PageResult<WalletTombstone>>;
}

export const IPageDeletedWalletUseCaseSymbol = Symbol('IPageDeletedWalletUseCase');
