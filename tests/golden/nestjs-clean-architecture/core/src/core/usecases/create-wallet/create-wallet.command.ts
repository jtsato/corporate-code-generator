export class CreateWalletCommand {
  public constructor(
    public readonly id: string,
    public readonly balance: number,
  ) {}
}
