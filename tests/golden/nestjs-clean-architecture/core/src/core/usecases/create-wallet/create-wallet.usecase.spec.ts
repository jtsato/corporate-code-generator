import { ValidationException } from '../../exceptions/validation.exception';
import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';
import { CreateWalletUseCase } from './create-wallet.usecase';

describe('CreateWalletUseCase', () => {
  it('rejects invalid commands before calling the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet> => wallet),
    };
    const useCase = new CreateWalletUseCase(gateway);

    await expect(useCase.execute(new CreateWalletCommand(
      123 as never,
      1.5,
    ))).rejects.toBeInstanceOf(ValidationException);
    expect(gateway.execute).not.toHaveBeenCalled();
  });

  it('passes a validated entity to the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet> => wallet),
    };
    const useCase = new CreateWalletUseCase(gateway);

    const result = await useCase.execute(new CreateWalletCommand(
      "00000000-0000-0000-0000-000000000001",
      1.5,
    ));

    expect(result).toBeInstanceOf(Wallet);
    expect(gateway.execute).toHaveBeenCalledTimes(1);
    expect(gateway.execute.mock.calls[0][0]).toBeInstanceOf(Wallet);
  });
});
