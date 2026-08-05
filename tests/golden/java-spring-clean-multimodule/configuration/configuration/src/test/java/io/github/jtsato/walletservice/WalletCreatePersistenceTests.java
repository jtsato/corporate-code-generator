package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCase;
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
class WalletCreatePersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("124.45");
    @Autowired
    private CreateWalletUseCase createWalletUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldCreateAndPersistWallet() {
        var result = createWalletUseCase.execute(new CreateWalletCommand(
            WALLET_ID,
            WALLET_BALANCE
        ));

        assertThat(result.getId()).isEqualTo(WALLET_ID);
        assertThat(result.getBalance()).isEqualTo(WALLET_BALANCE);

        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(WALLET_ID);
        assertThat(persisted.getBalance()).isEqualTo(WALLET_BALANCE);
    }

    @Test
    void shouldRejectDuplicateWalletWithoutOverwritingOriginal() {
        createWalletUseCase.execute(new CreateWalletCommand(
            WALLET_ID,
            WALLET_BALANCE
        ));

        var exception = org.junit.jupiter.api.Assertions.assertThrows(ConflictException.class, () -> createWalletUseCase.execute(new CreateWalletCommand(
            WALLET_ID,
            new BigDecimal("125.45")
        )));

        assertThat(exception.getMessageKey()).isEqualTo("wallet.already-exists");
        assertThat(exception.getDefaultMessage()).isEqualTo("Wallet already exists.");

        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(WALLET_ID);
        assertThat(persisted.getBalance()).isEqualTo(WALLET_BALANCE);
        assertThat(walletRepository.count()).isEqualTo(1);
    }
}
