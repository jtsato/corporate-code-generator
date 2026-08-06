package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.util.UUID;

public interface FindWalletByIdUseCase {
    Wallet execute(UUID id);
}
