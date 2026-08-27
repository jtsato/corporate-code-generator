import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class PatchWalletRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  public balance?: number;
}
