package io.github.jtsato.walletservice.core.domains.wallet.usecase.update;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletCommand;

public interface UpdateWalletUseCase {
    Wallet execute(UpdateWalletCommand command);
}
