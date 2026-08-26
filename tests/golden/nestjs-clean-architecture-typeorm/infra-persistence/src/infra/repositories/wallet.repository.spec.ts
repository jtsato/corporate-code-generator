/**
 * Runs the repository against a real SQL engine rather than a mock.
 *
 * SQLite runs inside this process, so the suite needs no database to be
 * provisioned and no container runtime. What it cannot do is prove PostgreSQL
 * behaves the same; the entity and the repository are written to the subset both
 * engines agree on precisely because this gate cannot see the difference.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { Repository } from 'typeorm';

import { FilterCondition } from '../../core/common/filter/filter-condition';
import { FilterExpression } from '../../core/common/filter/filter-expression';
import { PageRequest } from '../../core/common/paging/page-request';
import { SortDirection } from '../../core/common/paging/sort-direction';
import { SortOrder } from '../../core/common/paging/sort-order';
import { WalletEntity } from '../models/wallet-entity.model';
import { WalletRepository } from './wallet.repository';

describe('WalletRepository', () => {
  let dataSource: DataSource;
  let repository: WalletRepository;

  function createEntity(overrides: Record<string, unknown> = {}): WalletEntity {
    return new WalletEntity(
      Object.prototype.hasOwnProperty.call(overrides, 'id')
        ? overrides['id'] as unknown as string
        : "00000000-0000-4000-8000-000000000001",
      Object.prototype.hasOwnProperty.call(overrides, 'balance')
        ? overrides['balance'] as unknown as number
        : 1.5,
    );
  }

  async function page(
    sortProperty: string,
    direction: SortDirection,
    size = 20,
    index = 0,
  ): Promise<readonly WalletEntity[]> {
    const result = await repository.findPage(
      new PageRequest(index, size, [new SortOrder(sortProperty, direction)]),
      new FilterExpression(),
    );
    return result.items;
  }

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqljs',
      entities: [WalletEntity],
      synchronize: true,
      dropSchema: true,
    });
    await dataSource.initialize();
    repository = new WalletRepository(
      dataSource.getRepository(WalletEntity) as Repository<WalletEntity>,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('reads back every column with the type it was written with', async () => {
    const saved = await repository.save(createEntity());

    const found = await repository.findById(saved.id);

    expect(found).toBeDefined();
    expect((found as WalletEntity).id).toStrictEqual("00000000-0000-4000-8000-000000000001");
    expect((found as WalletEntity).balance).toStrictEqual(1.5);
  });

  it('reports a row that was never stored as undefined', async () => {
    await repository.save(createEntity());

    await expect(repository.findById("00000000-0000-4000-8000-000000000002")).resolves.toBeUndefined();
    await expect(repository.existsById("00000000-0000-4000-8000-000000000001")).resolves.toBe(true);
    await expect(repository.existsById("00000000-0000-4000-8000-000000000002")).resolves.toBe(false);
  });

  it('does not insert a row when updating one that is not there', async () => {
    // `save` upserts on the primary key, so an update that skipped the existence
    // check would silently create the row it was asked to modify.
    const absent = createEntity({ id: "00000000-0000-4000-8000-000000000002" });

    await expect(repository.updateById("00000000-0000-4000-8000-000000000002", absent)).resolves.toBeUndefined();
    await expect(repository.existsById("00000000-0000-4000-8000-000000000002")).resolves.toBe(false);
  });

  it('reports whether a delete removed anything', async () => {
    await repository.save(createEntity());

    await expect(repository.deleteById("00000000-0000-4000-8000-000000000001")).resolves.toBe(true);
    await expect(repository.deleteById("00000000-0000-4000-8000-000000000001")).resolves.toBe(false);
  });

  it('reverses the page order when the direction is reversed', async () => {
    await repository.save(createEntity());
    await repository.save(createEntity({ id: "00000000-0000-4000-8000-000000000002" }));

    const ascending = await page('id', SortDirection.Asc);
    const descending = await page('id', SortDirection.Desc);

    expect(ascending).toHaveLength(2);
    expect(descending.map((entity) => entity.id)).toEqual(
      [...ascending].reverse().map((entity) => entity.id),
    );
  });

  it('splits tied rows across pages without repeating one', async () => {
    // Both rows carry the same sort key, so only the identifier tiebreaker makes
    // the order total. Without it one row can land on both pages.
    await repository.save(createEntity());
    await repository.save(createEntity({ id: "00000000-0000-4000-8000-000000000002" }));

    const first = await page('balance', SortDirection.Asc, 1, 0);
    const second = await page('balance', SortDirection.Asc, 1, 1);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(new Set([
      String((first[0] as WalletEntity).id),
      String((second[0] as WalletEntity).id),
    ]).size).toBe(2);
  });

  it('filters on a value the caller supplied as text', async () => {
    await repository.save(createEntity());
    await repository.save(createEntity({ id: "00000000-0000-4000-8000-000000000002" }));

    const matching = await repository.findPage(
      new PageRequest(0, 20, []),
      new FilterExpression([
        new FilterCondition('id', 'eq', String("00000000-0000-4000-8000-000000000001")),
      ]),
    );
    const excluded = await repository.findPage(
      new PageRequest(0, 20, []),
      new FilterExpression([
        new FilterCondition('id', 'ne', String("00000000-0000-4000-8000-000000000001")),
      ]),
    );

    expect(matching.totalItems).toBe(1);
    expect((matching.items[0] as WalletEntity).id).toStrictEqual("00000000-0000-4000-8000-000000000001");
    expect(excluded.totalItems).toBe(1);
    expect((excluded.items[0] as WalletEntity).id).toStrictEqual("00000000-0000-4000-8000-000000000002");
  });

  it('refuses to query by a property it does not map', async () => {
    // The generated parsers reject unknown names first, so this is reachable only
    // from code. A name reaching SQL is an identifier, not a parameter, so the
    // allowlist has to hold on its own.
    await expect(
      repository.findPage(
        new PageRequest(0, 20, []),
        new FilterExpression([new FilterCondition('id) OR 1=1 --', 'eq', 'x')]),
      ),
    ).rejects.toThrow('cannot query by');
  });
});
