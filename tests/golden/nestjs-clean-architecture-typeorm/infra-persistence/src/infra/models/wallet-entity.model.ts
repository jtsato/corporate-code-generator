import { Column, Entity, PrimaryColumn } from 'typeorm';

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

  public constructor(
    id: string,
    balance: number,
  ) {
    this.id = id;
    this.balance = balance;
  }
}
