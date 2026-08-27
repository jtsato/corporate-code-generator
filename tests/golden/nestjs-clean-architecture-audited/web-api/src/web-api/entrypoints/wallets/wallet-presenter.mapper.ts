import { Wallet } from '../../../core/models/wallet.model';
import { WalletResponse } from './wallet-response.model';

export class WalletPresenter {
  public static of(wallet: Wallet): WalletResponse {
    const response = new WalletResponse();
    response.id = wallet.id;
    response.balance = wallet.balance;

    // Everything presented here has been through a gateway, so a null creation
    // timestamp means the adapter failed to preserve the stored one. That is a
    // defect, not a state a caller should see rendered as null.
    if (wallet.createdAt === null) {
      throw new Error('WalletPresenter requires a persisted Wallet.');
    }

    response.createdAt = wallet.createdAt;
    response.updatedAt = wallet.updatedAt;
    return response;
  }
}
