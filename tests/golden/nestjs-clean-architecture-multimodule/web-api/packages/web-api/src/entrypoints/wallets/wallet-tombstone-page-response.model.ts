import { ApiProperty } from '@nestjs/swagger';

import { PageResult } from '@wallet-service/core/common/paging/page-result';
import { WalletTombstoneResponse } from './wallet-tombstone-response.model';

export class WalletTombstonePageResponse {
  @ApiProperty({ type: [WalletTombstoneResponse] })
  public readonly items: readonly WalletTombstoneResponse[];

  @ApiProperty()
  public readonly page: number;

  @ApiProperty()
  public readonly size: number;

  @ApiProperty()
  public readonly totalItems: number;

  @ApiProperty()
  public readonly totalPages: number;

  public constructor(page: PageResult<WalletTombstoneResponse>) {
    this.items = page.items;
    this.page = page.page;
    this.size = page.size;
    this.totalItems = page.totalItems;
    this.totalPages = page.totalPages;
  }
}
