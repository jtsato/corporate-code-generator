import { Wallet } from '../../models/wallet.model';

export interface ICreateWalletGateway {
  execute(wallet: Wallet): Promise<Wallet>;
}

export const ICreateWalletGatewaySymbol = Symbol('ICreateWalletGateway');
