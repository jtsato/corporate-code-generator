package io.github.jtsato.walletservice.core.domains.wallet.usecase.restore;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletCommand;
import java.util.List;

public final class RestoreWalletUseCaseInteractor implements RestoreWalletUseCase {
    private final WalletGateway walletGateway;

    public RestoreWalletUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public void execute(RestoreWalletCommand command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "common.command.required",
                "Command is required."
            )));
        }

        walletGateway.restoreById(command.id());
    }
}
