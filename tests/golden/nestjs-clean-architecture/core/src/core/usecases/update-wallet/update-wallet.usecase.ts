import { NotFoundException } from '../../exceptions/not-found.exception';
import { Wallet } from '../../models/wallet.model';
import { UpdateWalletCommand } from './update-wallet.command';
import { UpdateWalletCommandValidator } from './update-wallet-command.validator';
import { IUpdateWalletGateway } from './update-wallet.gateway';
import { IUpdateWalletUseCase } from './update-wallet-usecase.interface';

export class UpdateWalletUseCase implements IUpdateWalletUseCase {
  public constructor(
    private readonly gateway: IUpdateWalletGateway,
    private readonly validator: UpdateWalletCommandValidator = new UpdateWalletCommandValidator(),
  ) {}

  public async execute(command: UpdateWalletCommand): Promise<Wallet> {
    this.validator.validate(command);

    const wallet = new Wallet(
      command.id,
      command.balance,
    );
    const updated = await this.gateway.execute(wallet);

    if (updated === undefined) {
      throw new NotFoundException(`Wallet not found: ${command.id}`);
    }

    return updated;
  }
}
