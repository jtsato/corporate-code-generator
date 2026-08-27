import { Injectable } from '@nestjs/common';

import { FilterExpression } from '@wallet-service/core/common/filter/filter-expression';
import { PageRequest } from '@wallet-service/core/common/paging/page-request';
import { PageResult } from '@wallet-service/core/common/paging/page-result';
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

function isActive(entity: WalletEntity): boolean {
  return isNullish(entity.deletedAt);
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
      this.wallets.find((entity) => isActive(entity) && entity.id === id),
    );
  }

  /**
   * Resolves a row whether it is active or soft-deleted.
   *
   * Restore needs this: it has to tell "no such row" from "already active", and
   * an active-only lookup collapses those two into the same absence.
   */
  public async findAnyById(id: string): Promise<WalletEntity | undefined> {
    return Promise.resolve(
      this.wallets.find((entity) => entity.id === id),
    );
  }

  public async findDeletedById(id: string): Promise<WalletEntity | undefined> {
    return Promise.resolve(
      this.wallets.find((entity) => !isActive(entity) && entity.id === id),
    );
  }

  public async updateById(id: string, entity: WalletEntity): Promise<WalletEntity | undefined> {
    const index = this.wallets.findIndex((current) => isActive(current) && current.id === id);
    if (index < 0) return undefined;
    this.wallets[index] = entity;
    return entity;
  }

  /**
   * Marks the row deleted and keeps it. Returns false when no *active* row
   * carries the identifier, which is what makes a repeated delete a 404 rather
   * than a second success.
   */
  public async softDeleteById(id: string, deletedAt: Date): Promise<boolean> {
    const entity = this.wallets.find((current) => isActive(current) && current.id === id);
    if (entity === undefined) return false;
    entity.deletedAt = deletedAt;
    return true;
  }

  /** Clears the marker. The caller has already decided the row may be restored. */
  public async restoreById(id: string): Promise<boolean> {
    const entity = this.wallets.find((current) => !isActive(current) && current.id === id);
    if (entity === undefined) return false;
    entity.deletedAt = null;
    return true;
  }

  public async existsById(id: string): Promise<boolean> {
    return Promise.resolve(this.wallets.some((current) =>
      isActive(current) && compareValues(current.id, id) === 0,
    ));
  }

  /**
   * Whether the identifier is taken at all, tombstones included.
   *
   * Soft delete releases a unique *business* value but never the identifier: the
   * row that holds it still exists, and restore is how it comes back. Creating
   * over it would either resurrect a tombstone or leave two rows sharing an
   * identifier, depending on the adapter — which is exactly the kind of
   * divergence the two persistence options must not have.
   */
  public async existsAnyById(id: string): Promise<boolean> {
    return Promise.resolve(this.wallets.some((current) =>
      compareValues(current.id, id) === 0,
    ));
  }

  public async findPage(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletEntity>> {
    return this.page(this.wallets.filter(isActive), pageRequest, filterExpression);
  }

  public async findDeletedPage(pageRequest: PageRequest, filterExpression: FilterExpression): Promise<PageResult<WalletEntity>> {
    return this.page(this.wallets.filter((entity) => !isActive(entity)), pageRequest, filterExpression);
  }

  private async page(
    source: readonly WalletEntity[],
    pageRequest: PageRequest,
    filterExpression: FilterExpression,
  ): Promise<PageResult<WalletEntity>> {
    const filtered = source.filter((entity) => filterExpression.conditions.every((condition) => {
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
