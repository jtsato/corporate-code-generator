import { Injectable } from '@nestjs/common';

import { FilterExpression } from '../../core/common/filter/filter-expression';
import { PageRequest } from '../../core/common/paging/page-request';
import { PageResult } from '../../core/common/paging/page-result';
import { WalletEntity } from '../models/wallet-entity.model';

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined;
}

function compareValues(left: unknown, right: unknown): number {
  if (isNullish(left)) return isNullish(right) ? 0 : 1;
  if (isNullish(right)) return -1;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return compareStrings(String(left), String(right));
}

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

  public async updateById(id: string, entity: WalletEntity): Promise<WalletEntity | undefined> {
    const index = this.wallets.findIndex((current) => current.id === id);
    if (index < 0) return undefined;
    this.wallets[index] = entity;
    return entity;
  }

  public async deleteById(id: string): Promise<boolean> {
    const index = this.wallets.findIndex((current) => current.id === id);
    if (index < 0) return false;
    this.wallets.splice(index, 1);
    return true;
  }

  public async existsById(id: string): Promise<boolean> {
    return Promise.resolve(this.wallets.some((current) =>
      compareValues(current.id, id) === 0,
    ));
  }

  public async findPage(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletEntity>> {
    const filtered = this.wallets.filter((entity) => filterExpression.conditions.every((condition) => {
      const actual = entity[condition.field as keyof WalletEntity];
      const matches = String(actual) === condition.value;
      return condition.operator === 'eq' ? matches : !matches;
    }));
    let ordered = filtered;
    if (pageRequest.sort.length > 0) {
      ordered = filtered
        .map((entity, index) => ({ entity, index }))
        .sort((left, right) => {
          for (const sortOrder of pageRequest.sort) {
            const leftValue = left.entity[sortOrder.property as keyof WalletEntity];
            const rightValue = right.entity[sortOrder.property as keyof WalletEntity];
            const comparison = compareValues(
              leftValue,
              rightValue,
            );
            if (comparison !== 0) {
              return isNullish(leftValue) || isNullish(rightValue)
                ? comparison
                : sortOrder.direction === 'asc' ? comparison : -comparison;
            }
          }
          return left.index - right.index;
        })
        .map(({ entity }) => entity);
    }
    const start = pageRequest.page * pageRequest.size;

    return Promise.resolve(new PageResult(
      ordered.slice(start, start + pageRequest.size),
      pageRequest.page,
      pageRequest.size,
      ordered.length,
    ));
  }
}
