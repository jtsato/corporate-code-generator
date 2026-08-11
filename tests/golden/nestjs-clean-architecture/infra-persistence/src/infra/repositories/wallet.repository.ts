import { Injectable } from '@nestjs/common';

import { FilterExpression } from '../../core/common/filter/filter-expression';
import { PageRequest } from '../../core/common/paging/page-request';
import { PageResult } from '../../core/common/paging/page-result';
import { WalletEntity } from '../models/wallet-entity.model';

@Injectable()
export class WalletRepository {
  private readonly wallets: WalletEntity[] = [];

  public async save(entity: WalletEntity): Promise<WalletEntity> {
    this.wallets.push(entity);
    return Promise.resolve(entity);
  }

  public async findById(id: string): Promise<WalletEntity | undefined> {
    return Promise.resolve(
      this.wallets.find((entity) => entity.id === id),
    );
  }

  public async findPage(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletEntity>> {
    const filtered = this.wallets.filter((entity) => filterExpression.conditions.every((condition) => {
      const actual = entity[condition.field as keyof WalletEntity];
      const matches = String(actual) === condition.value;
      return condition.operator === 'eq' ? matches : !matches;
    }));
    const start = pageRequest.page * pageRequest.size;

    return Promise.resolve(new PageResult(
      filtered.slice(start, start + pageRequest.size),
      pageRequest.page,
      pageRequest.size,
      filtered.length,
    ));
  }
}
