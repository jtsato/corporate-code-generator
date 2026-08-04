package io.github.jtsato.walletservice.entrypoint.rest.common;

import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.WalletResponse;
import java.util.List;

public record WalletPageResponse(
    List<WalletResponse> items,
    int page,
    int size,
    long totalItems,
    long totalPages
) {
    public static WalletPageResponse from(PageResult<WalletResponse> pageResult) {
        return new WalletPageResponse(
            pageResult.items(),
            pageResult.page(),
            pageResult.size(),
            pageResult.totalItems(),
            pageResult.totalPages()
        );
    }
}
