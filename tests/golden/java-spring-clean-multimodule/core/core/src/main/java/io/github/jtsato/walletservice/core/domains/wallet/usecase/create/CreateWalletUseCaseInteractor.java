package io.github.jtsato.walletservice.core.domains.wallet.usecase.create;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;
import java.util.List;

public final class CreateWalletUseCaseInteractor implements CreateWalletUseCase {
    private final WalletGateway walletGateway;

    public CreateWalletUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public Wallet execute(CreateWalletCommand command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "common.command.required",
                "Command is required."
            )));
        }

        Wallet entity = new Wallet(
            command.id(),
            command.balance()
        );

        return walletGateway.create(entity);
    }
}
