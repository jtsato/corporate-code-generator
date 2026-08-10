package io.github.jtsato.walletservice.infra.database.domains.wallet.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallet", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wallet_balance_active_scope", columnNames = { "balance", "deletion_scope" })
})
public class WalletEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance;

    protected WalletEntity() {
    }

    public WalletEntity(UUID id, BigDecimal balance) {
        this.id = id;
        this.balance = balance;
        this.deletedAt = null;
        this.deletionScope = ACTIVE_SCOPE;
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
    public boolean isActive() {
        return deletedAt == null && ACTIVE_SCOPE.equals(deletionScope);
    }

    public void markDeleted(String deletionScope) {
        this.deletedAt = Instant.now();
        this.deletionScope = deletionScope;
    }

    public void restore() {
        this.deletedAt = null;
        this.deletionScope = ACTIVE_SCOPE;
    }

    public static final String ACTIVE_SCOPE = "ACTIVE";

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deletion_scope", nullable = false)
    private String deletionScope;
}
