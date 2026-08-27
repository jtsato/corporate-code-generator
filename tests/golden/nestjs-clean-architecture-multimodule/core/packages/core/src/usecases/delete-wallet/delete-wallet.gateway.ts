export interface IDeleteWalletGateway {
  execute(id: string): Promise<boolean>;
}

export const IDeleteWalletGatewaySymbol = Symbol('IDeleteWalletGateway');
