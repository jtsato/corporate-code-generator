import { Injectable } from '@nestjs/common';

import { Wallet } from '../../core/models/wallet.model';
import { IUpdateWalletGateway } from '../../core/usecases/update-wallet/update-wallet.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class UpdateWalletProvider implements IUpdateWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(wallet: Wallet): Promise<Wallet | undefined> {
    const entity = WalletMapper.toEntity(wallet);
    const current = await this.repository.findById(wallet.id);

    if (current === undefined) {
      return undefined;
    }
    const updated = await this.repository.updateById(
      wallet.id,
      entity,
    );

    if (updated === undefined) {
      return undefined;
    }

    return WalletMapper.toDomain(updated);
  }
}
