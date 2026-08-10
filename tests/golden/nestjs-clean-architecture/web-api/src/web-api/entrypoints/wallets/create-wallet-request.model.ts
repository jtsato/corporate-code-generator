import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateWalletRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  public id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public balance: number;
}
