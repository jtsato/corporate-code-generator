import { NotFoundException } from '../../exceptions/not-found.exception';
import { Wallet } from '../../models/wallet.model';
import { GetWalletByIdQuery } from './get-wallet-by-id.query';
import { GetWalletByIdQueryValidator } from './get-wallet-by-id-query.validator';
import { IGetWalletByIdGateway } from './get-wallet-by-id.gateway';
import { IGetWalletByIdUseCase } from './get-wallet-by-id-usecase.interface';

export class GetWalletByIdUseCase implements IGetWalletByIdUseCase {
  public constructor(
    private readonly gateway: IGetWalletByIdGateway,
    private readonly validator: GetWalletByIdQueryValidator = new GetWalletByIdQueryValidator(),
  ) {}

  public async execute(query: GetWalletByIdQuery): Promise<Wallet> {
    this.validator.validate(query);

    const wallet = await this.gateway.execute(query.id);

    if (wallet === undefined) {
      throw new NotFoundException(`Wallet not found: ${query.id}`);
    }

    return wallet;
  }
}
