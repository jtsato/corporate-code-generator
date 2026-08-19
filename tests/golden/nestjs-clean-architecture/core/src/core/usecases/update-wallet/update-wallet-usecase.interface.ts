import { Wallet } from '../../models/wallet.model';
import { UpdateWalletCommand } from './update-wallet.command';

export interface IUpdateWalletUseCase {
  execute(command: UpdateWalletCommand): Promise<Wallet>;
}

export const IUpdateWalletUseCaseSymbol = Symbol('IUpdateWalletUseCase');
