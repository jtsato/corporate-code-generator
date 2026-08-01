package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.math.BigDecimal;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
@Schema(description = "Wallet response")
public record WalletResponse(
    @Schema(description = "Wallet id.") UUID id,
    @Schema(description = "Wallet balance.") BigDecimal balance
) {
    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(
            wallet.getId(),
            wallet.getBalance()
        );
    }
}
