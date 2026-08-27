import { IClock } from '../../common/time/clock';
import { NotFoundException } from '../../exceptions/not-found.exception';
import { Wallet } from '../../models/wallet.model';
import { IGetWalletByIdGateway } from '../get-wallet-by-id/get-wallet-by-id.gateway';
import { IUpdateWalletGateway } from '../update-wallet/update-wallet.gateway';
import { PatchWalletCommand } from './patch-wallet.command';
import { PatchWalletCommandValidator } from './patch-wallet-command.validator';
import { IPatchWalletUseCase } from './patch-wallet-usecase.interface';

export class PatchWalletUseCase implements IPatchWalletUseCase {
  public constructor(
    private readonly getByIdGateway: IGetWalletByIdGateway,
    private readonly updateGateway: IUpdateWalletGateway,
    private readonly clock: IClock,
    private readonly validator: PatchWalletCommandValidator = new PatchWalletCommandValidator(),
  ) {}

  public async execute(command: PatchWalletCommand): Promise<Wallet> {
    this.validator.validate(command);

    const current = await this.getByIdGateway.execute(command.id);
    if (current === undefined) {
      throw new NotFoundException(`Wallet not found: ${command.id}`);
    }

    const updatedEntity = new Wallet(
      current.id,
      Object.prototype.hasOwnProperty.call(command.changes, 'balance')
        ? (command.changes.balance as number)
        : current.balance,
      // Null even though `current` holds the real value, so that update and
      // patch state the same rule: the creation timestamp is the adapter's to
      // preserve, and nothing else may claim to supply it.
      null,
      this.clock.now(),
    );
    const updated = await this.updateGateway.execute(updatedEntity);

    if (updated === undefined) {
      throw new NotFoundException(`Wallet not found: ${command.id}`);
    }

    return updated;
  }
}
