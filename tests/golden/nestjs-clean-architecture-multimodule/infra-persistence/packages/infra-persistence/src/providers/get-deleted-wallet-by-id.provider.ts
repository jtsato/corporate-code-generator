import { Injectable } from '@nestjs/common';

import { WalletTombstone } from '@wallet-service/core/models/wallet-tombstone.model';
import { IGetDeletedWalletByIdGateway } from '@wallet-service/core/usecases/get-deleted-wallet-by-id/get-deleted-wallet-by-id.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class GetDeletedWalletByIdProvider implements IGetDeletedWalletByIdGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(id: string): Promise<WalletTombstone | undefined> {
    const entity = await this.repository.findDeletedById(id);

    if (entity === undefined) {
      return undefined;
    }

    return WalletMapper.toTombstone(entity);
  }
}
