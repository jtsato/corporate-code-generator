import { Injectable } from '@nestjs/common';

import { Wallet } from '../../core/models/wallet.model';
import { IGetWalletByIdGateway } from '../../core/usecases/get-wallet-by-id/get-wallet-by-id.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class GetWalletByIdProvider implements IGetWalletByIdGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(id: string): Promise<Wallet | undefined> {
    const entity = await this.repository.findById(id);

    if (entity === undefined) {
      return undefined;
    }

    return WalletMapper.toDomain(entity);
  }
}
