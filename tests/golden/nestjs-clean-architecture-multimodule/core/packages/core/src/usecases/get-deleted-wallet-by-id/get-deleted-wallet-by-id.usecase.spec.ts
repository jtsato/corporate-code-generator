import { NotFoundException } from '../../exceptions/not-found.exception';
import { ValidationException } from '../../exceptions/validation.exception';
import { WalletTombstone } from '../../models/wallet-tombstone.model';
import { GetDeletedWalletByIdQuery } from './get-deleted-wallet-by-id.query';
import { GetDeletedWalletByIdUseCase } from './get-deleted-wallet-by-id.usecase';

describe('GetDeletedWalletByIdUseCase', () => {
  const deletedAt = new Date('2025-06-01T00:00:00.000Z');
  const tombstone = new WalletTombstone(
    "00000000-0000-4000-8000-000000000001",
    1.5,
    deletedAt,
  );

  it('returns the tombstone the gateway resolves', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<WalletTombstone | undefined> => tombstone),
    };
    const useCase = new GetDeletedWalletByIdUseCase(gateway);

    const result = await useCase.execute(new GetDeletedWalletByIdQuery("00000000-0000-4000-8000-000000000001"));

    expect(result).toBe(tombstone);
    expect(result.deletedAt).toEqual(deletedAt);
    expect(gateway.execute).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });

  it('raises NotFoundException for a row this route does not cover', async () => {
    // Both an unknown identifier and an active one arrive here as undefined.
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<WalletTombstone | undefined> => undefined),
    };
    const useCase = new GetDeletedWalletByIdUseCase(gateway);

    await expect(useCase.execute(new GetDeletedWalletByIdQuery("00000000-0000-4000-8000-000000000001")))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid identifier before reaching the gateway', async () => {
    const gateway = {
      execute: jest.fn(async (_id: string): Promise<WalletTombstone | undefined> => tombstone),
    };
    const useCase = new GetDeletedWalletByIdUseCase(gateway);

    await expect(useCase.execute(new GetDeletedWalletByIdQuery(123 as never)))
      .rejects.toBeInstanceOf(ValidationException);
    expect(gateway.execute).not.toHaveBeenCalled();
  });
});
