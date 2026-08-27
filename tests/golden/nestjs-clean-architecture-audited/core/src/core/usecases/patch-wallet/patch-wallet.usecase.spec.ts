import { NotFoundException } from '../../exceptions/not-found.exception';
import { ValidationException } from '../../exceptions/validation.exception';
import { Wallet } from '../../models/wallet.model';
import { IGetWalletByIdGateway } from '../get-wallet-by-id/get-wallet-by-id.gateway';
import { IUpdateWalletGateway } from '../update-wallet/update-wallet.gateway';
import { PatchWalletCommand } from './patch-wallet.command';
import { PatchWalletUseCase } from './patch-wallet.usecase';

/**
 * A fixed clock. An assertion about a timestamp the production code invented is
 * either tautological or flaky; pinning "now" makes it neither.
 */
const NOW = new Date('2025-01-01T00:00:00.000Z');
const clock = { now: (): Date => NOW };

describe('PatchWalletUseCase', () => {
  it('rejects invalid commands before loading the current entity', async () => {
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => undefined),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (entity: Wallet): Promise<Wallet | undefined> => entity),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    await expect(useCase.execute(new PatchWalletCommand(
      123 as never,
      {
        balance: 1.5,
      },
    ))).rejects.toBeInstanceOf(ValidationException);
    expect(getByIdGateway.execute).not.toHaveBeenCalled();
    expect(updateGateway.execute).not.toHaveBeenCalled();
  });

  it('rejects an empty patch before loading the current entity', async () => {
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => undefined),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (entity: Wallet): Promise<Wallet | undefined> => entity),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    await expect(useCase.execute(new PatchWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      {},
    ))).rejects.toBeInstanceOf(ValidationException);
    expect(getByIdGateway.execute).not.toHaveBeenCalled();
    expect(updateGateway.execute).not.toHaveBeenCalled();
  });

  it('rejects an invalid supplied value before loading the current entity', async () => {
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => undefined),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (entity: Wallet): Promise<Wallet | undefined> => entity),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    await expect(useCase.execute(new PatchWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      {
        balance: Number.NaN,
      },
    ))).rejects.toBeInstanceOf(ValidationException);
    expect(getByIdGateway.execute).not.toHaveBeenCalled();
    expect(updateGateway.execute).not.toHaveBeenCalled();
  });
  it('preserves omitted properties and delegates the merged entity to update', async () => {
    const current = new Wallet(
      "00000000-0000-4000-8000-000000000001",
      1.5,
      // Stands for a stored record, so it carries a real creation timestamp.
      NOW,
      NOW,
    );
    const updated = new Wallet(
      "00000000-0000-4000-8000-000000000001",
      2.5,
      // Stands for a stored record, so it carries a real creation timestamp.
      NOW,
      NOW,
    );
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => current),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (entity: Wallet): Promise<Wallet | undefined> => updated),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    const result = await useCase.execute(new PatchWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      {
        balance: 2.5,
      },
    ));

    expect(result).toBe(updated);
    expect(current.balance).not.toBe(2.5);
    expect(getByIdGateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    expect(updateGateway.execute).toHaveBeenCalledTimes(1);
    expect(updateGateway.execute).toHaveBeenCalledWith(new Wallet(
      "00000000-0000-4000-8000-000000000001",
      2.5,
      // What patch supplies, not what the row holds: the creation timestamp is
      // the adapter's to preserve, so patch states the same rule update does.
      null,
      NOW,
    ));
  });

  it('raises NotFoundException when the current entity is missing', async () => {
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => undefined),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (entity: Wallet): Promise<Wallet | undefined> => entity),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    await expect(useCase.execute(new PatchWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      {
        balance: 1.5,
      },
    ))).rejects.toBeInstanceOf(NotFoundException);
    expect(updateGateway.execute).not.toHaveBeenCalled();
  });

  it('raises NotFoundException when the update gateway reports a missing entity', async () => {
    const current = new Wallet(
      "00000000-0000-4000-8000-000000000001",
      1.5,
      // Stands for a stored record, so it carries a real creation timestamp.
      NOW,
      NOW,
    );
    const getByIdGateway: IGetWalletByIdGateway = {
      execute: jest.fn(async (_id: string): Promise<Wallet | undefined> => current),
    };
    const updateGateway: IUpdateWalletGateway = {
      execute: jest.fn(async (_entity: Wallet): Promise<Wallet | undefined> => undefined),
    };
    const useCase = new PatchWalletUseCase(getByIdGateway, updateGateway, clock);

    await expect(useCase.execute(new PatchWalletCommand(
      "00000000-0000-4000-8000-000000000001",
      {
        balance: 2.5,
      },
    ))).rejects.toBeInstanceOf(NotFoundException);
    expect(getByIdGateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    expect(updateGateway.execute).toHaveBeenCalledTimes(1);
  });
});
