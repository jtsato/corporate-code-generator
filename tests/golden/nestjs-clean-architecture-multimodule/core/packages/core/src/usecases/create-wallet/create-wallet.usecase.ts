import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';
import { CreateWalletCommandValidator } from './create-wallet-command.validator';
import { ICreateWalletGateway } from './create-wallet.gateway';
import { ICreateWalletUseCase } from './create-wallet-usecase.interface';

export class CreateWalletUseCase implements ICreateWalletUseCase {
  public constructor(
    private readonly gateway: ICreateWalletGateway,
    private readonly validator: CreateWalletCommandValidator = new CreateWalletCommandValidator(),
  ) {}

  public async execute(command: CreateWalletCommand): Promise<Wallet> {
    this.validator.validate(command);

    const wallet = new Wallet(
      command.id,
      command.balance,
    );

    return this.gateway.execute(wallet);
  }
}
