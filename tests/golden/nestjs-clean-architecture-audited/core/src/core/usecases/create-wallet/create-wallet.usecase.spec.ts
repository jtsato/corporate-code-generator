import { ValidationException } from '../../exceptions/validation.exception';
import { Wallet } from '../../models/wallet.model';
import { CreateWalletCommand } from './create-wallet.command';
import { CreateWalletUseCase } from './create-wallet.usecase';

/**
 * A fixed clock. An assertion about a timestamp the production code invented is
 * either tautological or flaky; pinning "now" makes it neither.
 */
const NOW = new Date('2025-01-01T00:00:00.000Z');
const clock = { now: (): Date => NOW };

describe('CreateWalletUseCase', () => {
  it('rejects invalid commands before calling the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet> => wallet),
    };
    const useCase = new CreateWalletUseCase(gateway, clock);

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
    const useCase = new CreateWalletUseCase(gateway, clock);

    const result = await useCase.execute(new CreateWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    ));

    expect(result).toBeInstanceOf(Wallet);
    expect(gateway.execute).toHaveBeenCalledTimes(1);
    expect(gateway.execute.mock.calls[0][0]).toBeInstanceOf(Wallet);
  });

  it('stamps a fresh record with one clock reading for both timestamps', async () => {
    const gateway = {
      execute: jest.fn(async (wallet: Wallet): Promise<Wallet> => wallet),
    };
    const useCase = new CreateWalletUseCase(gateway, clock);

    const result = await useCase.execute(new CreateWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      1.5,
    ));

    // Identical, not merely close: a fresh record is defined to have the same
    // value in both, which two clock readings would not guarantee.
    expect(result.createdAt).toEqual(NOW);
    expect(result.updatedAt).toEqual(NOW);
    expect(result.createdAt).toBe(result.updatedAt);
  });
});
