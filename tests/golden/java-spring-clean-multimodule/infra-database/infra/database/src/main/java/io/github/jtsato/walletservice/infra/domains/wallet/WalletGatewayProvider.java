package io.github.jtsato.walletservice.infra.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public class WalletGatewayProvider implements WalletGateway {
    @Override
    public List<Wallet> findAll() {
        return List.of();
    }
}
