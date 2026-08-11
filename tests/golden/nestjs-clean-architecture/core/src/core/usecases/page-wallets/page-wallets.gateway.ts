import { FilterExpression } from '../../common/filter/filter-expression';
import { PageRequest } from '../../common/paging/page-request';
import { PageResult } from '../../common/paging/page-result';
import { Wallet } from '../../models/wallet.model';

export interface IPageWalletGateway {
  execute(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<Wallet>>;
}

export const IPageWalletGatewaySymbol = Symbol('IPageWalletGateway');
