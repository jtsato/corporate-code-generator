import { Injectable } from '@nestjs/common';

import { IDeleteWalletGateway } from '../../core/usecases/delete-wallet/delete-wallet.gateway';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class DeleteWalletProvider implements IDeleteWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(id: string): Promise<boolean> {
    // The deletion timestamp is read here rather than inside the repository, so
    // both persistence options stamp a tombstone from the same place.
    return this.repository.softDeleteById(id, new Date());
  }
}
