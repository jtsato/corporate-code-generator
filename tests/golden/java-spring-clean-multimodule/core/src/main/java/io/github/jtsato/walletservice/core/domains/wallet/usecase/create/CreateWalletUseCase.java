package io.github.jtsato.walletservice.core.domains.wallet.usecase.create;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;

public interface CreateWalletUseCase {
    Wallet execute(CreateWalletCommand command);
}
