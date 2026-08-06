package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
@Schema(description = "WalletTombstone response")
public record WalletTombstoneResponse(
    @Schema(description = "Wallet id.") UUID id,
    @Schema(description = "Wallet balance.") BigDecimal balance,
    @Schema(description = "Wallet deletion timestamp.") Instant deletedAt
) {
    public static WalletTombstoneResponse from(WalletTombstone walletTombstone) {
        return new WalletTombstoneResponse(
            walletTombstone.getId(),
            walletTombstone.getBalance(),
            walletTombstone.getDeletedAt()
        );
    }
}
