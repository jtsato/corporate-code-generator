package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateWalletRequest(
    UUID id,
    BigDecimal balance,
    String currency
) {
    public CreateWalletCommand toCommand() {
        return new CreateWalletCommand(
            id,
            balance,
            currency
        );
    }
}
