import { Wallet } from '@wallet-service/core/models/wallet.model';
import { WalletTombstone } from '@wallet-service/core/models/wallet-tombstone.model';
import { WalletEntity } from '../models/wallet-entity.model';

export class WalletMapper {
  public static toEntity(wallet: Wallet): WalletEntity {
    return new WalletEntity(
      wallet.id,
      wallet.balance,
    );
  }

  public static toDomain(entity: WalletEntity): Wallet {
    return new Wallet(
      entity.id,
      entity.balance,
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
