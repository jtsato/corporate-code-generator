import { ApiProperty } from '@nestjs/swagger';

export class WalletResponse {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public balance: number;
}
