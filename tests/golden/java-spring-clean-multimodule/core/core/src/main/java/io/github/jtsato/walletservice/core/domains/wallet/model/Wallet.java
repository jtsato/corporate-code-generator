package io.github.jtsato.walletservice.core.domains.wallet.model;

import io.github.jtsato.walletservice.core.common.validation.SelfValidating;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class Wallet extends SelfValidating<Wallet> {
    @NotNull
    private final UUID id;
    @NotNull
    private final BigDecimal balance;

    public Wallet(UUID id, BigDecimal balance) {
        this.id = id;
        this.balance = balance;
        validateSelf();
    }

    public UUID getId() {
        return id;
    }

    public BigDecimal getBalance() {
        return balance;
    }
}
