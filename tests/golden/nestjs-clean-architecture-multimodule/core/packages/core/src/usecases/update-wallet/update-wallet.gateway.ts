import { Wallet } from '../../models/wallet.model';

export interface IUpdateWalletGateway {
  execute(wallet: Wallet): Promise<Wallet | undefined>;
}

export const IUpdateWalletGatewaySymbol = Symbol('IUpdateWalletGateway');
