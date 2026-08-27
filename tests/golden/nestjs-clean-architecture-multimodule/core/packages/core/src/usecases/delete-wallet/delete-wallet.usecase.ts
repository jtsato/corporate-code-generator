import { NotFoundException } from '../../exceptions/not-found.exception';
import { DeleteWalletCommand } from './delete-wallet.command';
import { IDeleteWalletGateway } from './delete-wallet.gateway';
import { IDeleteWalletUseCase } from './delete-wallet-usecase.interface';

export class DeleteWalletUseCase implements IDeleteWalletUseCase {
  public constructor(private readonly gateway: IDeleteWalletGateway) {}

  public async execute(command: DeleteWalletCommand): Promise<void> {
    const deleted = await this.gateway.execute(command.id);

    if (!deleted) {
      throw new NotFoundException(`Wallet not found: ${command.id}`);
    }
  }
}
