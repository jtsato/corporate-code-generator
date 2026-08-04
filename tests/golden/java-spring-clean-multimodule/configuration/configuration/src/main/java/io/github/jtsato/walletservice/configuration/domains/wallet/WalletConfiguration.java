package io.github.jtsato.walletservice.configuration.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsPageUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCaseInteractor;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import io.github.jtsato.walletservice.infra.domains.wallet.WalletGatewayProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WalletConfiguration {
    @Bean
    public WalletGateway walletGateway(WalletRepository walletRepository) {
        return new WalletGatewayProvider(walletRepository);
    }

    @Bean
    public FindWalletsUseCase findWalletsUseCase(WalletGateway walletGateway) {
        return new FindWalletsUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindWalletsByFilterUseCase findWalletsByFilterUseCase(WalletGateway walletGateway) {
        return new FindWalletsByFilterUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindWalletsPageUseCase findWalletsPageUseCase(WalletGateway walletGateway) {
        return new FindWalletsPageUseCaseInteractor(walletGateway);
    }
}
