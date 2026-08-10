import { Wallet } from '../../models/wallet.model';

export interface IGetWalletByIdGateway {
  execute(id: string): Promise<Wallet | undefined>;
}

export const IGetWalletByIdGatewaySymbol = Symbol('IGetWalletByIdGateway');
