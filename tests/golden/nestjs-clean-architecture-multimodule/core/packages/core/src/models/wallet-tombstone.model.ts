/**
 * A soft-deleted Wallet, as the deleted-only routes expose it.
 *
 * This is a separate model rather than a nullable field on Wallet: the
 * ordinary contract is active-only, and adding a deletion timestamp there would
 * put a value on every response that is always null for every caller who is not
 * asking about tombstones.
 */
export class WalletTombstone {
  public constructor(
    public readonly id: string,
    public readonly balance: number,
    public readonly deletedAt: Date,
  ) {}
}
