import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateWalletRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public balance: number;
}
