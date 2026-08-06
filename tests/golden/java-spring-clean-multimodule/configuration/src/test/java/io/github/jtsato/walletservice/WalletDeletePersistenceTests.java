package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class WalletDeletePersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final String WALLET_CURRENCY = "sample";
    @Autowired
    private DeleteWalletUseCase deleteWalletUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldDeleteExistingWallet() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));

        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));

        assertThat(walletRepository.findById(WALLET_ID))
            .hasValueSatisfying(entity -> assertThat(entity.isActive()).isFalse());
    }

    @Test
    void shouldRejectMissingWallet() {
        var exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () ->
            deleteWalletUseCase.execute(new DeleteWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111112")))
        );

        assertThat(exception.getMessageKey()).isEqualTo("wallet.not-found");
        assertThat(exception.getDefaultMessage()).isEqualTo("Wallet was not found.");
        assertThat(walletRepository.findById(UUID.fromString("11111111-1111-1111-1111-111111111112"))).isEmpty();
    }

    @Test
    void shouldRejectRepeatedWalletDeletion() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));
        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));

        var exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () ->
            deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID))
        );

        assertThat(exception.getMessageKey()).isEqualTo("wallet.not-found");
        assertThat(exception.getDefaultMessage()).isEqualTo("Wallet was not found.");
        assertThat(walletRepository.findById(WALLET_ID))
            .hasValueSatisfying(entity -> assertThat(entity.isActive()).isFalse());
    }
}
