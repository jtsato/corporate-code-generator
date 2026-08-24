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
