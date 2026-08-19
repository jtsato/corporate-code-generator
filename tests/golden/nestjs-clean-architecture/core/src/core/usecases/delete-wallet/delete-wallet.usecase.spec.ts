import { NotFoundException } from '../../exceptions/not-found.exception';
import { DeleteWalletCommand } from './delete-wallet.command';
import { DeleteWalletUseCase } from './delete-wallet.usecase';

describe('DeleteWalletUseCase', () => {
  it('delegates deletion and returns no body value', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<boolean> => true),
    };
    const useCase = new DeleteWalletUseCase(gateway);

    const result = await useCase.execute(new DeleteWalletCommand("00000000-0000-4000-8000-000000000001"));

    expect(result).toBeUndefined();
    expect(gateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });

  it('raises NotFoundException when the gateway reports a missing entity', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<boolean> => false),
    };
    const useCase = new DeleteWalletUseCase(gateway);

    await expect(useCase.execute(new DeleteWalletCommand("00000000-0000-4000-8000-000000000001")))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('raises NotFoundException when deletion is repeated', async () => {
    const gateway = {
      execute: jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    };
    const useCase = new DeleteWalletUseCase(gateway);
    const command = new DeleteWalletCommand("00000000-0000-4000-8000-000000000001");

    await expect(useCase.execute(command)).resolves.toBeUndefined();
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(NotFoundException);
    expect(gateway.execute).toHaveBeenCalledTimes(2);
  });
});
