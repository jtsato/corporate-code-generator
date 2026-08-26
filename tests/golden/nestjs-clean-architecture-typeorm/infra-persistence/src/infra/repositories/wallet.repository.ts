import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';

import { FilterExpression } from '../../core/common/filter/filter-expression';
import { PageRequest } from '../../core/common/paging/page-request';
import { PageResult } from '../../core/common/paging/page-result';
import { WalletEntity } from '../models/wallet-entity.model';

/**
 * Property names this repository will place in a query.
 *
 * `WalletFilterParser` and `WalletSortParser` already reject anything else with a
 * 400, so no HTTP request can reach the check below. It exists because a name
 * that reaches SQL as an identifier cannot be parameterized: were a caller ever
 * to pass one straight through, the allowlist is what stands between that and an
 * injected fragment.
 */
const QUERYABLE_PROPERTIES: ReadonlySet<string> = new Set([
  'id',
  'balance',
]);

function queryableProperty(name: string): string {
  if (!QUERYABLE_PROPERTIES.has(name)) {
    throw new Error(`WalletRepository cannot query by '${name}'.`);
  }

  return name;
}

@Injectable()
export class WalletRepository {
  public constructor(
    @InjectRepository(WalletEntity)
    private readonly entities: Repository<WalletEntity>,
  ) {}

  public async save(entity: WalletEntity): Promise<WalletEntity> {
    return this.entities.save(entity);
  }

  public async findById(id: string): Promise<WalletEntity | undefined> {
    // TypeORM reports a miss as `null`; the gateway contract is `undefined`.
    const found = await this.entities.findOne({
      where: { id } as FindOptionsWhere<WalletEntity>,
    });

    return found ?? undefined;
  }

  public async updateById(id: string, entity: WalletEntity): Promise<WalletEntity | undefined> {
    // The existence check is what makes a missing row `undefined` rather than an
    // insert: `save` upserts on the primary key. Callers never reassign the
    // identifier, so the row `save` writes is the row this checked for.
    if (!(await this.existsById(id))) {
      return undefined;
    }

    return this.entities.save(entity);
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await this.entities.delete({
      id,
    } as FindOptionsWhere<WalletEntity>);

    return (result.affected ?? 0) > 0;
  }

  public async existsById(id: string): Promise<boolean> {
    return this.entities.existsBy({ id } as FindOptionsWhere<WalletEntity>);
  }

  public async findPage(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletEntity>> {
    const query = this.entities.createQueryBuilder('entity');

    filterExpression.conditions.forEach((condition, index) => {
      const property = queryableProperty(condition.field);
      const parameter = `filter${index}`;
      const comparison = condition.operator === 'eq' ? '=' : '!=';

      // Filter values arrive as strings and the in-memory adapter compares them
      // as strings, so the column is cast rather than the value parsed. Without
      // the cast PostgreSQL rejects `numeric = text` outright, and the two
      // persistence options would disagree about what a filter means.
      query.andWhere(`CAST(entity.${property} AS TEXT) ${comparison} :${parameter}`, {
        [parameter]: condition.value,
      });
    });

    // TypeORM keys its ORDER BY clauses by expression, so ordering by the same
    // property twice replaces the first entry rather than appending. Repeats are
    // therefore dropped, which also matches the in-memory adapter: the first
    // decisive comparison is the one that wins there too.
    const orderedProperties = new Set<string>();

    for (const sortOrder of pageRequest.sort) {
      const property = queryableProperty(sortOrder.property);
      if (orderedProperties.has(property)) continue;
      orderedProperties.add(property);

      // NULLS LAST in both directions: SQL orders nulls by dialect, while the
      // REST contract puts absent values last however the page is sorted.
      query.addOrderBy(
        `entity.${property}`,
        sortOrder.direction === 'asc' ? 'ASC' : 'DESC',
        'NULLS LAST',
      );
    }

    // Without a total order two requests for the same page may disagree about
    // which rows belong to it. The identifier is unique, so appending it makes
    // the order total whatever the caller sorted by — unless the caller already
    // sorted by it, in which case appending would overwrite their direction.
    if (!orderedProperties.has('id')) {
      query.addOrderBy('entity.id', 'ASC');
    }

    const [items, totalItems] = await query
      .skip(pageRequest.page * pageRequest.size)
      .take(pageRequest.size)
      .getManyAndCount();

    return new PageResult(items, pageRequest.page, pageRequest.size, totalItems);
  }
}
