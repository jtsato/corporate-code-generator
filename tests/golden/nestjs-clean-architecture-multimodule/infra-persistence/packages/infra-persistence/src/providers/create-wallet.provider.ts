import { Injectable } from '@nestjs/common';

import { ConflictException } from '@wallet-service/core/exceptions/conflict.exception';
import { Wallet } from '@wallet-service/core/models/wallet.model';
import { ICreateWalletGateway } from '@wallet-service/core/usecases/create-wallet/create-wallet.gateway';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class CreateWalletProvider implements ICreateWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(wallet: Wallet): Promise<Wallet> {
    const entity = WalletMapper.toEntity(wallet);
    // Tombstones included: soft delete keeps the identifier, so creating over one
    // is a conflict and restore is the way back.
    const identifierConflict = await this.repository.existsAnyById(entity.id);

    if (identifierConflict) {
      throw new ConflictException('wallet.already-exists', 'Wallet already exists.');
    }

    const saved = await this.repository.save(entity);
    return WalletMapper.toDomain(saved);
  }
}
