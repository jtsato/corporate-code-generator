import { Wallet } from '../../models/wallet.model';
import { GetWalletByIdQuery } from './get-wallet-by-id.query';

export interface IGetWalletByIdUseCase {
  execute(query: GetWalletByIdQuery): Promise<Wallet>;
}

export const IGetWalletByIdUseCaseSymbol = Symbol('IGetWalletByIdUseCase');
