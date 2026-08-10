import { NotFoundException } from '../../exceptions/not-found.exception';
import { Wallet } from '../../models/wallet.model';
import { GetWalletByIdQuery } from './get-wallet-by-id.query';
import { IGetWalletByIdGateway } from './get-wallet-by-id.gateway';
import { IGetWalletByIdUseCase } from './get-wallet-by-id-usecase.interface';

export class GetWalletByIdUseCase implements IGetWalletByIdUseCase {
  public constructor(private readonly gateway: IGetWalletByIdGateway) {}

  public async execute(query: GetWalletByIdQuery): Promise<Wallet> {
    const wallet = await this.gateway.execute(query.id);

    if (wallet === undefined) {
      throw new NotFoundException(`Wallet not found: ${query.id}`);
    }

    return wallet;
  }
}
