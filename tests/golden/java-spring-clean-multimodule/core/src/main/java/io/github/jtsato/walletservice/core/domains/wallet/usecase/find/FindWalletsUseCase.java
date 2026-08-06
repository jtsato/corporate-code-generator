package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public interface FindWalletsUseCase {
    List<Wallet> execute();
}
