import { WalletTombstone } from '../../models/wallet-tombstone.model';

export interface IGetDeletedWalletByIdGateway {
  /** Resolves only soft-deleted rows; an active wallet reads as absent here. */
  execute(id: string): Promise<WalletTombstone | undefined>;
}

export const IGetDeletedWalletByIdGatewaySymbol = Symbol('IGetDeletedWalletByIdGateway');
