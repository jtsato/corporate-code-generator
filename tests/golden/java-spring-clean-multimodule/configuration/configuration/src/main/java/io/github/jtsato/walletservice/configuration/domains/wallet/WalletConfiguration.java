package io.github.jtsato.walletservice.configuration.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCaseInteractor;
import io.github.jtsato.walletservice.infra.domains.wallet.WalletGatewayProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WalletConfiguration {
    @Bean
    public WalletGateway walletGateway() {
        return new WalletGatewayProvider();
    }

    @Bean
    public FindWalletsUseCase findWalletsUseCase(WalletGateway walletGateway) {
        return new FindWalletsUseCaseInteractor(walletGateway);
    }
}
