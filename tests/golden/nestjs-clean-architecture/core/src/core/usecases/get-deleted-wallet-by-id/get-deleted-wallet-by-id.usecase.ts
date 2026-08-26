import { NotFoundException } from '../../exceptions/not-found.exception';
import { WalletTombstone } from '../../models/wallet-tombstone.model';
import { GetWalletByIdQueryValidator } from '../get-wallet-by-id/get-wallet-by-id-query.validator';
import { GetDeletedWalletByIdQuery } from './get-deleted-wallet-by-id.query';
import { IGetDeletedWalletByIdGateway } from './get-deleted-wallet-by-id.gateway';
import { IGetDeletedWalletByIdUseCase } from './get-deleted-wallet-by-id-usecase.interface';

export class GetDeletedWalletByIdUseCase implements IGetDeletedWalletByIdUseCase {
  public constructor(
    private readonly gateway: IGetDeletedWalletByIdGateway,
    // Same identifier, same rules as the ordinary read; a second validator would
    // be the existing one under another name.
    private readonly validator: GetWalletByIdQueryValidator = new GetWalletByIdQueryValidator(),
  ) {}

  public async execute(query: GetDeletedWalletByIdQuery): Promise<WalletTombstone> {
    this.validator.validate(query);

    const tombstone = await this.gateway.execute(query.id);

    // An active wallet is absent from this route by design, and answers
    // 404 here just as an unknown identifier does: the two routes partition the
    // rows, so neither leaks the existence of the other's.
    if (tombstone === undefined) {
      throw new NotFoundException(`Deleted Wallet not found: ${query.id}`);
    }

    return tombstone;
  }
}
