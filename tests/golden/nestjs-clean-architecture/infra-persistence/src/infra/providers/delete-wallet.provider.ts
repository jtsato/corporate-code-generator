import { Injectable } from '@nestjs/common';

import { IDeleteWalletGateway } from '../../core/usecases/delete-wallet/delete-wallet.gateway';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class DeleteWalletProvider implements IDeleteWalletGateway {
  public constructor(private readonly repository: WalletRepository) {}

  public async execute(id: string): Promise<boolean> {
    return this.repository.deleteById(id);
  }
}
