package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.util.List;
import java.util.UUID;

public final class FindWalletByIdUseCaseInteractor implements FindWalletByIdUseCase {
    private final WalletGateway walletGateway;

    public FindWalletByIdUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public Wallet execute(UUID id) {
        if (id == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "id",
                "common.identifier.required",
                "Identifier is required."
            )));
        }

        return walletGateway.findById(id);
    }
}
