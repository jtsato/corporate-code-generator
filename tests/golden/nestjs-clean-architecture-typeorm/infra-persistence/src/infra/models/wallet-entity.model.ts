import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

import { numericTransformer } from '../persistence/column.transformers';

/**
 * Persistence shape of Wallet. The Core model never sees this class;
 * `WalletMapper` is the only thing that crosses between them.
 *
 * Most columns declare no `type`. That is deliberate rather than an omission:
 * no single spelling of a date column is accepted by both PostgreSQL and
 * SQLite, so the portable choice is to let each driver derive the column type
 * from the reflected TypeScript type. It works only while `tsconfig.json` keeps
 * `emitDecoratorMetadata` enabled.
 *
 * TypeORM does not call this constructor when it hydrates a row; it assigns the
 * properties directly. The constructor exists for the mapper.
 */
@Entity({ name: 'wallets' })
export class WalletEntity {
  @PrimaryColumn({ name: 'id' })
  public readonly id: string;

  @Column({ name: 'balance', type: 'numeric', transformer: numericTransformer })
  public readonly balance: number;

  /**
   * Soft-delete marker. `@DeleteDateColumn` makes every ordinary query and
   * `existsBy` exclude the row automatically, so hiding a tombstone is a
   * property of the mapping rather than something each query has to remember;
   * `withDeleted()` is the explicit opt-out the deleted-only routes use.
   *
   * Not a constructor parameter: the mapper builds entities from business fields
   * only, and TypeORM writes this column itself.
   */
  @DeleteDateColumn({ name: 'deleted_at' })
  public deletedAt: Date | null;

  public constructor(
    id: string,
    balance: number,
  ) {
    this.id = id;
    this.balance = balance;
  }
}
