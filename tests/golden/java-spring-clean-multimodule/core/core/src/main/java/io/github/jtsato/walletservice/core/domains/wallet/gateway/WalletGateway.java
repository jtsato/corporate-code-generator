package io.github.jtsato.walletservice.core.domains.wallet.gateway;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public interface WalletGateway {
    List<Wallet> findAll();

    List<Wallet> findByFilter(FilterExpression filterExpression);

    PageResult<Wallet> findPage(PageRequest pageRequest);

    PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest);
}
