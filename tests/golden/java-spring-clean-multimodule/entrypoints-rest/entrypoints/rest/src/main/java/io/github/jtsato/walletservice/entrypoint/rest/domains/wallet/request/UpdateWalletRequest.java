package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletCommand;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateWalletRequest(
    BigDecimal balance
) {
    public UpdateWalletCommand toCommand(UUID id) {
        return new UpdateWalletCommand(
            id,
            balance
        );
    }
}
