import { IClock } from '../../common/time/clock';
import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';
import { CreateWalletCommandValidator } from './create-wallet-command.validator';
import { ICreateWalletGateway } from './create-wallet.gateway';
import { ICreateWalletUseCase } from './create-wallet-usecase.interface';

export class CreateWalletUseCase implements ICreateWalletUseCase {
  public constructor(
    private readonly gateway: ICreateWalletGateway,
    private readonly clock: IClock,
    private readonly validator: CreateWalletCommandValidator = new CreateWalletCommandValidator(),
  ) {}

  public async execute(command: CreateWalletCommand): Promise<Wallet> {
    this.validator.validate(command);

    // One clock read, not two: a fresh record is defined to have identical
    // timestamps, and reading twice makes that untrue at sub-millisecond
    // resolution on a real clock.
    const createdAt = this.clock.now();

    const wallet = new Wallet(
      command.id,
      command.balance,
      createdAt,
      createdAt,
    );

    return this.gateway.execute(wallet);
  }
}
