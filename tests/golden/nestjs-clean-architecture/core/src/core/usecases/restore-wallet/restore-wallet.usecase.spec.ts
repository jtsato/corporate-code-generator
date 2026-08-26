import { NotFoundException } from '../../exceptions/not-found.exception';
import { ValidationException } from '../../exceptions/validation.exception';
import { RestoreWalletCommand } from './restore-wallet.command';
import { RestoreWalletUseCase } from './restore-wallet.usecase';

describe('RestoreWalletUseCase', () => {
  it('delegates restoration and returns no body value', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<boolean> => true),
    };
    const useCase = new RestoreWalletUseCase(gateway);

    const result = await useCase.execute(new RestoreWalletCommand("00000000-0000-4000-8000-000000000001"));

    expect(result).toBeUndefined();
    expect(gateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });

  it('raises NotFoundException when no row carries the identifier', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<boolean> => false),
    };
    const useCase = new RestoreWalletUseCase(gateway);

    await expect(useCase.execute(new RestoreWalletCommand("00000000-0000-4000-8000-000000000001")))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid identifier before reaching the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<boolean> => true),
    };
    const useCase = new RestoreWalletUseCase(gateway);

    await expect(useCase.execute(new RestoreWalletCommand(123 as never)))
      .rejects.toBeInstanceOf(ValidationException);
    expect(gateway.execute).not.toHaveBeenCalled();
  });
});
