export interface IRestoreWalletGateway {
  /**
   * Restores a soft-deleted wallet.
   *
   * Returns false only when no row carries the identifier at all. An identifier
   * that names an active row, or one whose restoration would collide with an
   * active unique value, raises a conflict from the adapter instead: both are
   * refusals to act rather than absences, and the REST contract distinguishes
   * them with 409 rather than 404.
   */
  execute(id: string): Promise<boolean>;
}

export const IRestoreWalletGatewaySymbol = Symbol('IRestoreWalletGateway');
