import { FilterExpression } from '../../core/common/filter/filter-expression';
import { PageRequest } from '../../core/common/paging/page-request';
import { SortDirection } from '../../core/common/paging/sort-direction';
import { SortOrder } from '../../core/common/paging/sort-order';
import { WalletEntity } from '../models/wallet-entity.model';
import { WalletRepository } from './wallet.repository';

describe('WalletRepository', () => {
  function createEntity(propertyName: string, value: unknown): WalletEntity {
    return new WalletEntity(
      propertyName === 'id' ? value as unknown as string : "00000000-0000-4000-8000-000000000001",
      propertyName === 'balance' ? value as unknown as number : 1.5,
    );
  }

  async function sortedItems(
    repository: WalletRepository,
    property: string,
    direction: SortDirection,
  ): Promise<readonly WalletEntity[]> {
    const result = await repository.findPage(
      new PageRequest(0, 20, [new SortOrder(property, direction)]),
      new FilterExpression(),
    );
    return result.items;
  }

  it('reports whether an identifier exists', async () => {
    const repository = new WalletRepository();
    const entity = createEntity('id', "00000000-0000-4000-8000-000000000001");

    await repository.save(entity);

    await expect(repository.existsById("00000000-0000-4000-8000-000000000001")).resolves.toBe(true);
    await expect(repository.existsById("00000000-0000-4000-8000-000000000002")).resolves.toBe(false);
  });

  it('retains a soft-deleted row and hides it from every active read', async () => {
    const repository = new WalletRepository();
    const deletedAt = new Date('2025-06-01T00:00:00.000Z');
    await repository.save(createEntity('id', "00000000-0000-4000-8000-000000000001"));

    await expect(repository.softDeleteById("00000000-0000-4000-8000-000000000001", deletedAt)).resolves.toBe(true);

    await expect(repository.findById("00000000-0000-4000-8000-000000000001")).resolves.toBeUndefined();
    await expect(repository.existsById("00000000-0000-4000-8000-000000000001")).resolves.toBe(false);
    await expect(repository.findPage(new PageRequest(0, 20, []), new FilterExpression()))
      .resolves.toMatchObject({ totalItems: 0 });

    // Retained, not removed: that is the whole difference from a hard delete.
    const tombstone = await repository.findDeletedById("00000000-0000-4000-8000-000000000001");
    expect(tombstone).toBeDefined();
    expect((tombstone as WalletEntity).deletedAt).toEqual(deletedAt);
    await expect(repository.findDeletedPage(new PageRequest(0, 20, []), new FilterExpression()))
      .resolves.toMatchObject({ totalItems: 1 });
  });

  it('reports a repeated soft delete as nothing to delete', async () => {
    // What makes a second DELETE answer 404 instead of 204.
    const repository = new WalletRepository();
    await repository.save(createEntity('id', "00000000-0000-4000-8000-000000000001"));

    await expect(repository.softDeleteById("00000000-0000-4000-8000-000000000001", new Date())).resolves.toBe(true);
    await expect(repository.softDeleteById("00000000-0000-4000-8000-000000000001", new Date())).resolves.toBe(false);
  });

  it('restores a tombstone back into the active reads', async () => {
    const repository = new WalletRepository();
    await repository.save(createEntity('id', "00000000-0000-4000-8000-000000000001"));
    await repository.softDeleteById("00000000-0000-4000-8000-000000000001", new Date());

    await expect(repository.restoreById("00000000-0000-4000-8000-000000000001")).resolves.toBe(true);

    await expect(repository.findById("00000000-0000-4000-8000-000000000001")).resolves.toBeDefined();
    await expect(repository.findDeletedById("00000000-0000-4000-8000-000000000001")).resolves.toBeUndefined();
    // Restoring one that is already active is nothing to restore, which the
    // provider turns into a conflict rather than a silent success.
    await expect(repository.restoreById("00000000-0000-4000-8000-000000000001")).resolves.toBe(false);
  });

  it('resolves a row by identifier whether it is active or deleted', async () => {
    // Restore needs this to tell "no such row" from "already active".
    const repository = new WalletRepository();
    await repository.save(createEntity('id', "00000000-0000-4000-8000-000000000001"));

    await expect(repository.findAnyById("00000000-0000-4000-8000-000000000001")).resolves.toBeDefined();
    await repository.softDeleteById("00000000-0000-4000-8000-000000000001", new Date());
    await expect(repository.findAnyById("00000000-0000-4000-8000-000000000001")).resolves.toBeDefined();
    await expect(repository.findAnyById("00000000-0000-4000-8000-000000000002")).resolves.toBeUndefined();
  });

  it('keeps nullish values after present values for descending sort', async () => {
    const repository = new WalletRepository();
    const present = createEntity('id', "00000000-0000-4000-8000-000000000001");
    const nullValue = createEntity('id', null);
    const undefinedValue = createEntity('id', undefined);

    await repository.save(present);
    await repository.save(nullValue);
    await repository.save(undefinedValue);

    await expect(sortedItems(repository, 'id', SortDirection.Desc)).resolves.toEqual([
      present,
      nullValue,
      undefinedValue,
    ]);
  });

  it('keeps nullish values after present values for ascending sort', async () => {
    const repository = new WalletRepository();
    const present = createEntity('id', "00000000-0000-4000-8000-000000000001");
    const nullValue = createEntity('id', null);
    const undefinedValue = createEntity('id', undefined);

    await repository.save(present);
    await repository.save(nullValue);
    await repository.save(undefinedValue);

    await expect(sortedItems(repository, 'id', SortDirection.Asc)).resolves.toEqual([
      present,
      nullValue,
      undefinedValue,
    ]);
  });

  it('compares strings deterministically without locale dependence', async () => {
    const repository = new WalletRepository();
    const b = createEntity('id', 'b');
    const a = createEntity('id', 'a');

    await repository.save(b);
    await repository.save(a);

    await expect(sortedItems(repository, 'id', SortDirection.Asc)).resolves.toEqual([
      a,
      b,
    ]);
  });

  it('compares numeric values numerically', async () => {
    const repository = new WalletRepository();
    const ten = createEntity('balance', 10);
    const two = createEntity('balance', 2);

    await repository.save(ten);
    await repository.save(two);

    await expect(sortedItems(repository, 'balance', SortDirection.Asc)).resolves.toEqual([
      two,
      ten,
    ]);
  });
});
