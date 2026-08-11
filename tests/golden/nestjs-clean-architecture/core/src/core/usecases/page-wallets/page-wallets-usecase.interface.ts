import { PageWalletQuery } from './page-wallets.query';
import { PageResult } from '../../common/paging/page-result';
import { Wallet } from '../../models/wallet.model';

export interface IPageWalletUseCase {
  execute(query: PageWalletQuery): Promise<PageResult<Wallet>>;
}

export const IPageWalletUseCaseSymbol = Symbol('IPageWalletUseCase');
