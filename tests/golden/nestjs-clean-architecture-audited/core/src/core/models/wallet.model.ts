export class Wallet {
  public constructor(
    public readonly id: string,
    public readonly balance: number,
    /**
     * Null only on the transient object an update or patch builds. The Core
     * never supplies a creation timestamp, because only the persistence adapter
     * holds the row that already has one; null says "not supplied" rather than
     * offering a plausible wrong value. Every Wallet that comes back
     * from a gateway carries a real one.
     */
    public readonly createdAt: Date | null,
    public readonly updatedAt: Date,
  ) {}
}
