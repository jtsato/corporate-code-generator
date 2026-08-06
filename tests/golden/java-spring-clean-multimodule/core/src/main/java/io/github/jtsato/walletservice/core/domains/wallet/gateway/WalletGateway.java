package io.github.jtsato.walletservice.core.domains.wallet.gateway;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.util.List;
import java.util.UUID;

public interface WalletGateway {
    List<Wallet> findAll();

    List<Wallet> findByFilter(FilterExpression filterExpression);

    PageResult<Wallet> findPage(PageRequest pageRequest);

    PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest);

    Wallet findById(UUID id);

    WalletTombstone findDeletedById(UUID id);

    PageResult<WalletTombstone> findDeletedByFilterPage(FilterExpression filterExpression, PageRequest pageRequest);

    Wallet create(Wallet wallet);

    Wallet update(Wallet wallet);

    void deleteById(UUID id);

    void restoreById(UUID id);
}
