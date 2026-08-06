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
    @NotNull
    private final String currency;

    public Wallet(UUID id, BigDecimal balance, String currency) {
        this.id = id;
        this.balance = balance;
        this.currency = currency;
        validateSelf();
    }

    public UUID getId() {
        return id;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public String getCurrency() {
        return currency;
    }
}
