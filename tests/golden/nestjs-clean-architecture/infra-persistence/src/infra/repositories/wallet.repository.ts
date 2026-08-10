import { Injectable } from '@nestjs/common';

import { WalletEntity } from '../models/wallet-entity.model';

@Injectable()
export class WalletRepository {
  private readonly wallets: WalletEntity[] = [];

  public async save(entity: WalletEntity): Promise<WalletEntity> {
    this.wallets.push(entity);
    return Promise.resolve(entity);
  }

  public async findById(id: string): Promise<WalletEntity | undefined> {
    return Promise.resolve(
      this.wallets.find((entity) => entity.id === id),
    );
  }
}
