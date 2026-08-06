package io.github.jtsato.walletservice.core.domains.wallet.usecase.restore;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletCommand;

public interface RestoreWalletUseCase {
    void execute(RestoreWalletCommand command);
}
