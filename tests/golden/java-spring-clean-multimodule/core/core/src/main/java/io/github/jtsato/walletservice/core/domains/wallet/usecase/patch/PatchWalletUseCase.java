package io.github.jtsato.walletservice.core.domains.wallet.usecase.patch;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand;

public interface PatchWalletUseCase {
    Wallet execute(PatchWalletCommand command);
}
