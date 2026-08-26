import { NotFoundException } from '../../exceptions/not-found.exception';
import { GetWalletByIdQueryValidator } from '../get-wallet-by-id/get-wallet-by-id-query.validator';
import { RestoreWalletCommand } from './restore-wallet.command';
import { IRestoreWalletGateway } from './restore-wallet.gateway';
import { IRestoreWalletUseCase } from './restore-wallet-usecase.interface';

export class RestoreWalletUseCase implements IRestoreWalletUseCase {
  public constructor(
    private readonly gateway: IRestoreWalletGateway,
    // The identifier reaches this use case straight from the request path, so it
    // needs the same rejection the ordinary read applies. A second validator
    // would be the existing one under another name.
    private readonly validator: GetWalletByIdQueryValidator = new GetWalletByIdQueryValidator(),
  ) {}

  public async execute(command: RestoreWalletCommand): Promise<void> {
    this.validator.validate(command);

    const restored = await this.gateway.execute(command.id);

    if (!restored) {
      throw new NotFoundException(`Wallet not found: ${command.id}`);
    }
  }
}
