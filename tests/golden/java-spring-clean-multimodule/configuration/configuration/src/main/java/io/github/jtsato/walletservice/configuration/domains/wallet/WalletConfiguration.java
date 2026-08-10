package io.github.jtsato.walletservice.configuration.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletByIdUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletsByFilterPageUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsPageUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletUseCaseInteractor;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletUseCaseInteractor;
import io.github.jtsato.walletservice.infra.database.domains.wallet.repository.WalletRepository;
import io.github.jtsato.walletservice.infra.database.domains.wallet.WalletGatewayProvider;
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
    public FindWalletByIdUseCase findWalletByIdUseCase(WalletGateway walletGateway) {
        return new FindWalletByIdUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindWalletsByFilterUseCase findWalletsByFilterUseCase(WalletGateway walletGateway) {
        return new FindWalletsByFilterUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindWalletsPageUseCase findWalletsPageUseCase(WalletGateway walletGateway) {
        return new FindWalletsPageUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase(WalletGateway walletGateway) {
        return new FindWalletsByFilterPageUseCaseInteractor(walletGateway);
    }

    @Bean
    public CreateWalletUseCase createWalletUseCase(WalletGateway walletGateway) {
        return new CreateWalletUseCaseInteractor(walletGateway);
    }

    @Bean
    public UpdateWalletUseCase updateWalletUseCase(WalletGateway walletGateway) {
        return new UpdateWalletUseCaseInteractor(walletGateway);
    }

    @Bean
    public PatchWalletUseCase patchWalletUseCase(WalletGateway walletGateway) {
        return new PatchWalletUseCaseInteractor(walletGateway);
    }

    @Bean
    public DeleteWalletUseCase deleteWalletUseCase(WalletGateway walletGateway) {
        return new DeleteWalletUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase(WalletGateway walletGateway) {
        return new FindDeletedWalletByIdUseCaseInteractor(walletGateway);
    }

    @Bean
    public FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase(WalletGateway walletGateway) {
        return new FindDeletedWalletsByFilterPageUseCaseInteractor(walletGateway);
    }

    @Bean
    public RestoreWalletUseCase restoreWalletUseCase(WalletGateway walletGateway) {
        return new RestoreWalletUseCaseInteractor(walletGateway);
    }
}
