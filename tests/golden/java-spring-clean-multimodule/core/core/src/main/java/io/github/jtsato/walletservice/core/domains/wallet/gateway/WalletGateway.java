package io.github.jtsato.walletservice.core.domains.wallet.gateway;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public interface WalletGateway {
    List<Wallet> findAll();
}
