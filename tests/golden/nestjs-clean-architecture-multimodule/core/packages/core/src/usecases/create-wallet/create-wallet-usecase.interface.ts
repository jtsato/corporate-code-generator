import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';

export interface ICreateWalletUseCase {
  execute(command: CreateWalletCommand): Promise<Wallet>;
}

export const ICreateWalletUseCaseSymbol = Symbol('ICreateWalletUseCase');
