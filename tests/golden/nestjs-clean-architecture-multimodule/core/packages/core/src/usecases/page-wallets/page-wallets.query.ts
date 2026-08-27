import { FilterExpression } from '../../common/filter/filter-expression';
import { PageRequest } from '../../common/paging/page-request';

export class PageWalletQuery {
  public constructor(
    public readonly pageRequest: PageRequest,
    public readonly filterExpression: FilterExpression,
  ) {}
}
