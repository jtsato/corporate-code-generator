export class WalletEntity {
  /**
   * Soft-delete marker. Null means the row is active; a timestamp hides it from
   * every active-only query while the row itself is retained.
   *
   * Not a constructor parameter: the mapper builds entities from business fields
   * only, and deletion is something the repository does to a row rather than
   * something a caller supplies.
   */
  public deletedAt: Date | null = null;

  /**
   * Written once, by the create path, and carried forward by every update. Not
   * constructor parameters for the same reason `deletedAt` is not: the mapper
   * builds entities from business fields, and these are the adapter's to manage.
   */
  public createdAt: Date;

  public updatedAt: Date;

  public constructor(
    public readonly id: string,
    public readonly balance: number,
  ) {}
}
