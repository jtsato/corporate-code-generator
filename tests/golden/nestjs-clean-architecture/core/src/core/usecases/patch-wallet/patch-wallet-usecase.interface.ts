import { Wallet } from '../../models/wallet.model';
import { PatchWalletCommand } from './patch-wallet.command';

export interface IPatchWalletUseCase {
  execute(command: PatchWalletCommand): Promise<Wallet>;
}

export const IPatchWalletUseCaseSymbol = Symbol('IPatchWalletUseCase');
