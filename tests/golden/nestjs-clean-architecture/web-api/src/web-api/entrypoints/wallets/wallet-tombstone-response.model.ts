import { ApiProperty } from '@nestjs/swagger';

/**
 * The deleted-only routes answer with this rather than with WalletResponse.
 * Adding `deletedAt` to the ordinary response would put a value on every reply
 * that is always null for every caller not asking about tombstones.
 */
export class WalletTombstoneResponse {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public balance: number;

  @ApiProperty()
  public deletedAt: Date;
}
