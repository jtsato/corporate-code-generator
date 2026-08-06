package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public final class FindWalletsPageUseCaseInteractor implements FindWalletsPageUseCase {
    private final WalletGateway walletGateway;

    public FindWalletsPageUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public PageResult<Wallet> execute(PageRequest pageRequest) {
        if (pageRequest == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "pageRequest",
                "common.paging.page-request.required",
                "Page request is required."
            )));
        }

        return walletGateway.findPage(pageRequest);
    }
}
