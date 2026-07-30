package io.github.jtsato.walletservice.infra.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.infra.domains.wallet.mapper.WalletPersistenceMapper;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.util.List;

public class WalletGatewayProvider implements WalletGateway {
    private final WalletRepository walletRepository;

    public WalletGatewayProvider(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Override
    public List<Wallet> findAll() {
        return walletRepository.findAll()
            .stream()
            .map(WalletPersistenceMapper::toDomain)
            .toList();
    }
}
