package io.github.jtsato.walletservice.core.domains.wallet.usecase.delete;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import java.util.List;

public final class DeleteWalletUseCaseInteractor implements DeleteWalletUseCase {
    private final WalletGateway walletGateway;

    public DeleteWalletUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public void execute(DeleteWalletCommand command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "common.command.required",
                "Command is required."
            )));
        }

        walletGateway.deleteById(command.id());
    }
}
