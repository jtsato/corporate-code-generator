import { Wallet } from '../../core/models/wallet.model';
import { WalletTombstone } from '../../core/models/wallet-tombstone.model';
import { WalletEntity } from '../models/wallet-entity.model';

export class WalletMapper {
  public static toEntity(wallet: Wallet): WalletEntity {
    const entity = new WalletEntity(
      wallet.id,
      wallet.balance,
    );

    // `createdAt` is copied only when the domain object carries one, which is
    // true on creation and false on every update. Leaving it alone is what lets
    // `UpdateWalletProvider` write the stored value back instead.
    if (wallet.createdAt !== null) {
      entity.createdAt = wallet.createdAt;
    }

    entity.updatedAt = wallet.updatedAt;

    return entity;
  }

  public static toDomain(entity: WalletEntity): Wallet {
    return new Wallet(
      entity.id,
      entity.balance,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  public static toTombstone(entity: WalletEntity): WalletTombstone {
    // Loud rather than lenient. Only the deleted-only queries reach this, so a
    // null timestamp here means the query stopped filtering by deletion, and a
    // fabricated date would hide that behind a plausible response.
    if (entity.deletedAt === null || entity.deletedAt === undefined) {
      throw new Error('WalletMapper.toTombstone requires a soft-deleted row.');
    }

    return new WalletTombstone(
      entity.id,
      entity.balance,
      entity.deletedAt,
    );
  }
}
