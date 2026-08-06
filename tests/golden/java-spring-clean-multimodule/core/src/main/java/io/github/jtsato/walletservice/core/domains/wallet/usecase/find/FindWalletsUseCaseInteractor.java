package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;

public class FindWalletsUseCaseInteractor implements FindWalletsUseCase {
    private final WalletGateway walletGateway;

    public FindWalletsUseCaseInteractor(WalletGateway walletGateway) {
        this.walletGateway = walletGateway;
    }

    @Override
    public List<Wallet> execute() {
        return walletGateway.findAll();
    }
}
