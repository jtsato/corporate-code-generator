import { FilterExpression } from '../../common/filter/filter-expression';
import { PageRequest } from '../../common/paging/page-request';
import { PageResult } from '../../common/paging/page-result';
import { WalletTombstone } from '../../models/wallet-tombstone.model';

export interface IPageDeletedWalletGateway {
  /** Pages soft-deleted rows only; the active collection is the ordinary route. */
  execute(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletTombstone>>;
}

export const IPageDeletedWalletGatewaySymbol = Symbol('IPageDeletedWalletGateway');
