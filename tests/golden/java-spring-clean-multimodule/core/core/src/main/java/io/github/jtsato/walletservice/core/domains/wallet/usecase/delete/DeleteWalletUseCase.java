package io.github.jtsato.walletservice.core.domains.wallet.usecase.delete;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;

public interface DeleteWalletUseCase {
    void execute(DeleteWalletCommand command);
}
