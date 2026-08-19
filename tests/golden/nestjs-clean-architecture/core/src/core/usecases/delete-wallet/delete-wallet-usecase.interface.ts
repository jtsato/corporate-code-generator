import { DeleteWalletCommand } from './delete-wallet.command';

export interface IDeleteWalletUseCase {
  execute(command: DeleteWalletCommand): Promise<void>;
}

export const IDeleteWalletUseCaseSymbol = Symbol('IDeleteWalletUseCase');
