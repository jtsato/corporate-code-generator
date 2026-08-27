import { ApiProperty } from '@nestjs/swagger';

export class WalletResponse {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public balance: number;

  // Read-only: no request model accepts either, and both are always
  // server-generated.
  @ApiProperty()
  public createdAt: Date;

  @ApiProperty()
  public updatedAt: Date;
}
