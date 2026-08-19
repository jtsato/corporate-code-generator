export class UpdateWalletCommand {
  public constructor(
    public readonly id: string,
    public readonly balance: number,
  ) {}
}
