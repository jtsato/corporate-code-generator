import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';
import { ICreateWalletGateway } from './create-wallet.gateway';
import { ICreateWalletUseCase } from './create-wallet-usecase.interface';

export class CreateWalletUseCase implements ICreateWalletUseCase {
  public constructor(private readonly gateway: ICreateWalletGateway) {}

  public async execute(command: CreateWalletCommand): Promise<Wallet> {
    const wallet = new Wallet(
      command.id,
      command.balance,
    );

    return this.gateway.execute(wallet);
  }
}
