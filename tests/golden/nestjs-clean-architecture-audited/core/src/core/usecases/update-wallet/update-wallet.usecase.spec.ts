import { NotFoundException } from '../../exceptions/not-found.exception';
import { ValidationException } from '../../exceptions/validation.exception';
import { Wallet } from '../../models/wallet.model';
import { UpdateWalletCommand } from './update-wallet.command';
import { UpdateWalletUseCase } from './update-wallet.usecase';

/**
 * A fixed clock. An assertion about a timestamp the production code invented is
 * either tautological or flaky; pinning "now" makes it neither.
 */
const NOW = new Date('2025-01-01T00:00:00.000Z');
const clock = { now: (): Date => NOW };

describe('UpdateWalletUseCase', () => {
  it('rejects invalid commands before calling the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet | undefined> => wallet),
    };
    const useCase = new UpdateWalletUseCase(gateway, clock);

    await expect(useCase.execute(new UpdateWalletCommand(
      123 as never,
      1.5,
    ))).rejects.toBeInstanceOf(ValidationException);
    expect(gateway.execute).not.toHaveBeenCalled();
  });

  it('delegates a full replacement with the identifier and mutable values', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet | undefined> => wallet),
    };
    const useCase = new UpdateWalletUseCase(gateway, clock);

    const result = await useCase.execute(new UpdateWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    ));

    expect(result).toBeInstanceOf(Wallet);
    expect(gateway.execute).toHaveBeenCalledTimes(1);
    expect(gateway.execute).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-4000-8000-000000000001",
      balance: 1.5,
    }));
  });

  it('raises NotFoundException when the gateway cannot find the entity', async () => {
    const gateway = {
      execute: jest.fn(async (_wallet: Wallet): Promise<Wallet | undefined> => undefined),
    };
    const useCase = new UpdateWalletUseCase(gateway, clock);

    await expect(useCase.execute(new UpdateWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    ))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('advances updatedAt and supplies no creation timestamp', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet | undefined> => wallet),
    };
    const useCase = new UpdateWalletUseCase(gateway, clock);

    await useCase.execute(new UpdateWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    ));

    // Null rather than a re-read value: preserving the stored one is the
    // adapter's job, and it already holds the row to preserve it from.
    expect(gateway.execute).toHaveBeenCalledWith(expect.objectContaining({
      createdAt: null,
      updatedAt: NOW,
    }));
  });
});
