package io.github.jtsato.walletservice.core.domains.wallet.usecase.patch;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand;
import java.util.List;

public final class PatchWalletUseCaseInteractor implements PatchWalletUseCase {
    private final WalletGateway walletGateway;

    public PatchWalletUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public Wallet execute(PatchWalletCommand command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "common.command.required",
                "Command is required."
            )));
        }

        Wallet current = walletGateway.findById(command.id());
        Wallet merged = new Wallet(
            command.id(),
            command.balanceProvided() ? command.balance() : current.getBalance()
        );
        return walletGateway.update(merged);
    }
}
