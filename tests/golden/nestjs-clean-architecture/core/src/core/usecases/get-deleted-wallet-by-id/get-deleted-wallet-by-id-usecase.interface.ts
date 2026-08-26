import { WalletTombstone } from '../../models/wallet-tombstone.model';
import { GetDeletedWalletByIdQuery } from './get-deleted-wallet-by-id.query';

export interface IGetDeletedWalletByIdUseCase {
  execute(query: GetDeletedWalletByIdQuery): Promise<WalletTombstone>;
}

export const IGetDeletedWalletByIdUseCaseSymbol = Symbol('IGetDeletedWalletByIdUseCase');
