package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import java.math.BigDecimal;
import java.util.UUID;

public record WalletResponse(
    UUID id,
    BigDecimal balance
) {
}
