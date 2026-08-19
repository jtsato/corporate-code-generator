import { PatchWalletChanges } from './patch-wallet.changes';

export class PatchWalletCommand {
  public constructor(
    public readonly id: string,
    public readonly changes: PatchWalletChanges,
  ) {}
}
