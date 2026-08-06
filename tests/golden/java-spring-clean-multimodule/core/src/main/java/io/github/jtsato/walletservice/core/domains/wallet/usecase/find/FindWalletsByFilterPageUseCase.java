package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;

public interface FindWalletsByFilterPageUseCase {
    PageResult<Wallet> execute(FilterExpression filterExpression, PageRequest pageRequest);
}
