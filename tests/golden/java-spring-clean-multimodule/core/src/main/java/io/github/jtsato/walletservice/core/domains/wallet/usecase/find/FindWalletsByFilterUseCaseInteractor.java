package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public final class FindWalletsByFilterUseCaseInteractor implements FindWalletsByFilterUseCase {
    private final WalletGateway walletGateway;

    public FindWalletsByFilterUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public List<Wallet> execute(FilterExpression filterExpression) {
        if (filterExpression == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "filterExpression",
                "common.filter.expression.required",
                "Filter expression is required."
            )));
        }

        return walletGateway.findByFilter(filterExpression);
    }
}
