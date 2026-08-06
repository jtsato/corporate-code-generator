package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletUseCase;
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
class WalletUpdatePersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("124.45");
    private static final String WALLET_CURRENCY = "sample-3";
    private static final BigDecimal WALLET_UPDATED_BALANCE = new BigDecimal("125.45");
    private static final String WALLET_UPDATED_CURRENCY = "sample-4";
    private static final UUID WALLET_MISSING_ID = UUID.fromString("11111111-1111-1111-1111-111111111112");
    @Autowired
    private UpdateWalletUseCase updateWalletUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldUpdateAndPersistWallet() {
        walletRepository.save(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));

        var result = updateWalletUseCase.execute(new UpdateWalletCommand(
            WALLET_ID,
            WALLET_UPDATED_BALANCE,
            WALLET_UPDATED_CURRENCY
        ));

        assertThat(result.getId()).isEqualTo(WALLET_ID);
        assertThat(result.getBalance()).isEqualTo(WALLET_UPDATED_BALANCE);
        assertThat(result.getCurrency()).isEqualTo(WALLET_UPDATED_CURRENCY);

        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(WALLET_ID);
        assertThat(persisted.getBalance()).isEqualTo(WALLET_UPDATED_BALANCE);
        assertThat(persisted.getCurrency()).isEqualTo(WALLET_UPDATED_CURRENCY);
    }

    @Test
    void shouldRejectMissingWalletWithoutCreatingNewRecord() {
        var exception = org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () -> updateWalletUseCase.execute(new UpdateWalletCommand(
            WALLET_MISSING_ID,
            WALLET_UPDATED_BALANCE,
            WALLET_UPDATED_CURRENCY
        )));

        assertThat(exception.getMessageKey()).isEqualTo("wallet.not-found");
        assertThat(exception.getDefaultMessage()).isEqualTo("Wallet was not found.");

        assertThat(walletRepository.findById(WALLET_MISSING_ID)).isEmpty();
    }
}
