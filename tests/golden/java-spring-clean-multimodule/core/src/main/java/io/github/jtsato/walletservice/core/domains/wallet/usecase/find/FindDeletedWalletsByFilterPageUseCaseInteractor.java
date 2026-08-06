package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.util.List;

public final class FindDeletedWalletsByFilterPageUseCaseInteractor implements FindDeletedWalletsByFilterPageUseCase {
    private final WalletGateway walletGateway;

    public FindDeletedWalletsByFilterPageUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public PageResult<WalletTombstone> execute(FilterExpression filterExpression, PageRequest pageRequest) {
        if (filterExpression == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "filterExpression",
                "common.filter.expression.required",
                "Filter expression is required."
            )));
        }
        if (pageRequest == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "pageRequest",
                "common.paging.page-request.required",
                "Page request is required."
            )));
        }

        return walletGateway.findDeletedByFilterPage(filterExpression, pageRequest);
    }
}
