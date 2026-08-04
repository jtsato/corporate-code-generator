package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;

public interface FindWalletsPageUseCase {
    PageResult<Wallet> execute(PageRequest pageRequest);
}
