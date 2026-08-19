import { ValidationException } from '../../exceptions/validation.exception';
import { Wallet } from '../../models/wallet.model';
import { GetWalletByIdQuery } from './get-wallet-by-id.query';
import { GetWalletByIdUseCase } from './get-wallet-by-id.usecase';

describe('GetWalletByIdUseCase', () => {
  it('rejects an invalid identifier before calling the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => undefined),
    };
    const useCase = new GetWalletByIdUseCase(gateway);

    await expect(useCase.execute(new GetWalletByIdQuery(123 as never)))
      .rejects.toBeInstanceOf(ValidationException);
    expect(gateway.execute).not.toHaveBeenCalled();
  });

  it('returns the entity loaded by the gateway', async () => {
    const expected = new Wallet(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    );
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => expected),
    };
    const useCase = new GetWalletByIdUseCase(gateway);

    const result = await useCase.execute(new GetWalletByIdQuery("00000000-0000-4000-8000-000000000001"));

    expect(result).toBe(expected);
    expect(gateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });
});
