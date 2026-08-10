import { Wallet } from '../../core/models/wallet.model';
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
}
