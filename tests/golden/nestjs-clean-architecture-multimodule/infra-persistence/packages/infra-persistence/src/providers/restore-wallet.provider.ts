import { Injectable } from '@nestjs/common';

import { ConflictException } from '@wallet-service/core/exceptions/conflict.exception';
import { IRestoreWalletGateway } from '@wallet-service/core/usecases/restore-wallet/restore-wallet.gateway';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class RestoreWalletProvider implements IRestoreWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(id: string): Promise<boolean> {
    const entity = await this.repository.findAnyById(id);

    // Absent means no row at all. The use case turns that into 404.
    if (entity === undefined) {
      return false;
    }

    // Already active is a refusal, not an absence: the caller asked for a state
    // the row is already in, and answering 404 would claim it does not exist.
    if (entity.deletedAt === null || entity.deletedAt === undefined) {
      throw new ConflictException('wallet.already-exists', 'Wallet already exists.');
    }

    return this.repository.restoreById(id);
  }
}
