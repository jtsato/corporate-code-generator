import { RestoreWalletCommand } from './restore-wallet.command';

export interface IRestoreWalletUseCase {
  execute(command: RestoreWalletCommand): Promise<void>;
}

export const IRestoreWalletUseCaseSymbol = Symbol('IRestoreWalletUseCase');
