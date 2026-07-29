package io.github.jtsato.walletservice.core.domains.wallet.model;

import java.math.BigDecimal;
import java.util.UUID;

public class Wallet {
    private final UUID id;
    private final BigDecimal balance;

    public Wallet(UUID id, BigDecimal balance) {
        this.id = id;
        this.balance = balance;
    }

    public UUID getId() {
        return id;
    }

    public BigDecimal getBalance() {
        return balance;
    }
}
