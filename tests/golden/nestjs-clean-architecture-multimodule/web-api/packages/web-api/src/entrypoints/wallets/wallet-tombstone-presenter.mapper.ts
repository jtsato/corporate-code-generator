import { WalletTombstone } from '@wallet-service/core/models/wallet-tombstone.model';
import { WalletTombstoneResponse } from './wallet-tombstone-response.model';

export class WalletTombstonePresenter {
  public static of(walletTombstone: WalletTombstone): WalletTombstoneResponse {
    const response = new WalletTombstoneResponse();
    response.id = walletTombstone.id;
    response.balance = walletTombstone.balance;
    response.deletedAt = walletTombstone.deletedAt;
    return response;
  }
}
