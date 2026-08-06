package io.github.jtsato.walletservice.entrypoint.rest.common;

import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.WalletTombstoneResponse;
import java.util.List;

public record WalletTombstonePageResponse(
    List<WalletTombstoneResponse> items,
    int page,
    int size,
    long totalItems,
    long totalPages
) {
    public static WalletTombstonePageResponse from(PageResult<WalletTombstoneResponse> pageResult) {
        return new WalletTombstonePageResponse(
            pageResult.items(),
            pageResult.page(),
            pageResult.size(),
            pageResult.totalItems(),
            pageResult.totalPages()
        );
    }
}
