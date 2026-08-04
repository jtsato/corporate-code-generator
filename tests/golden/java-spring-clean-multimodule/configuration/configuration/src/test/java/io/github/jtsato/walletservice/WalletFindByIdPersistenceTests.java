package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase;
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
class WalletFindByIdPersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("124.45");

    @Autowired
    private FindWalletByIdUseCase findWalletByIdUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldFindPersistedWalletByIdentifier() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));

        Wallet result = findWalletByIdUseCase.execute(WALLET_ID);

        assertThat(result.getId()).isEqualTo(WALLET_ID);
        assertThat(result.getBalance()).isEqualTo(WALLET_BALANCE);
    }

    @Test
    void shouldRejectUnknownIdentifier() {
        assertThatThrownBy(() -> findWalletByIdUseCase.execute(UUID.fromString("11111111-1111-1111-1111-111111111112")))
            .isInstanceOf(NotFoundException.class);
    }
}
