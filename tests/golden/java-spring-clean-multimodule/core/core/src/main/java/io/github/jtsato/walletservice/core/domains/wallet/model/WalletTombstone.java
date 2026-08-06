package io.github.jtsato.walletservice.core.domains.wallet.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class WalletTombstone {
    private final UUID id;
    private final BigDecimal balance;
    private final Instant deletedAt;

    public WalletTombstone(UUID id, BigDecimal balance, Instant deletedAt) {
        this.id = id;
        this.balance = balance;
        this.deletedAt = deletedAt;
    }

    public UUID getId() {
        return id;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }
}
