package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand;
import java.math.BigDecimal;
import java.util.UUID;

public final class PatchWalletRequest {
    private BigDecimal balance;
    private boolean balanceProvided;

    public PatchWalletRequest() {
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
        this.balanceProvided = true;
    }

    public PatchWalletCommand toCommand(UUID id) {
        return new PatchWalletCommand(
            id,
            balance,
            balanceProvided
        );
    }
}
