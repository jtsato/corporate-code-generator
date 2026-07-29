package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.math.BigDecimal;
import java.util.UUID;

public record WalletResponse(
    UUID id,
    BigDecimal balance
) {
    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(
            wallet.getId(),
            wallet.getBalance()
        );
    }
}
