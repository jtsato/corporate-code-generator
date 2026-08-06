package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletUseCase;
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
class WalletRestorePersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    @Autowired
    private DeleteWalletUseCase deleteWalletUseCase;

    @Autowired
    private RestoreWalletUseCase restoreWalletUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldRestoreDeletedWallet() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));

        restoreWalletUseCase.execute(new RestoreWalletCommand(WALLET_ID));

        assertThat(walletRepository.findById(WALLET_ID)).hasValueSatisfying(entity -> assertThat(entity.isActive()).isTrue());
    }

    @Test
    void shouldRejectRestoreOfAnActiveWallet() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));

        assertThat(org.junit.jupiter.api.Assertions.assertThrows(ConflictException.class, () ->
            restoreWalletUseCase.execute(new RestoreWalletCommand(WALLET_ID))
        ).getMessageKey()).isEqualTo("wallet.already-exists");
    }

    @Test
    void shouldKeepTheTombstoneWhenRestoreConflictsWithAnActiveUniqueValue() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));
        walletRepository.saveAndFlush(new WalletEntity(
            UUID.fromString("11111111-1111-1111-1111-111111111112"),
            WALLET_BALANCE
        ));

        org.junit.jupiter.api.Assertions.assertThrows(ConflictException.class, () ->
            restoreWalletUseCase.execute(new RestoreWalletCommand(WALLET_ID))
        );

        assertThat(walletRepository.findById(WALLET_ID)).hasValueSatisfying(entity -> assertThat(entity.isActive()).isFalse());
    }


    @Test
    void shouldRejectRestoreOfAMissingWallet() {
        org.junit.jupiter.api.Assertions.assertThrows(NotFoundException.class, () ->
            restoreWalletUseCase.execute(new RestoreWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111112")))
        );
    }
}
