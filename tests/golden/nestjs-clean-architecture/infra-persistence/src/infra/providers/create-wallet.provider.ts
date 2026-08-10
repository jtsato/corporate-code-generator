import { Injectable } from '@nestjs/common';

import { Wallet } from '../../core/models/wallet.model';
import { ICreateWalletGateway } from '../../core/usecases/create-wallet/create-wallet.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class CreateWalletProvider implements ICreateWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(wallet: Wallet): Promise<Wallet> {
    const saved = await this.repository.save(WalletMapper.toEntity(wallet));
    return WalletMapper.toDomain(saved);
  }
}
