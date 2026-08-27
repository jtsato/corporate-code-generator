import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class WalletPageRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  public page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public size?: number;

  @IsOptional()
  public filter?: string | string[];

  @ApiPropertyOptional({ type: String, isArray: true, example: 'balance:desc' })
  @IsOptional()
  public sort?: string | string[];
}
