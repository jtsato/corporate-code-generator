import { Wallet } from '@wallet-service/core/models/wallet.model';
import { WalletResponse } from './wallet-response.model';

export class WalletPresenter {
  public static of(wallet: Wallet): WalletResponse {
    const response = new WalletResponse();
    response.id = wallet.id;
    response.balance = wallet.balance;
    return response;
  }
}
