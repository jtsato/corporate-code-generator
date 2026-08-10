package io.github.jtsato.walletservice.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.infra.database.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.database.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class WalletDeletedQueryPersistenceTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    @Autowired
    private DeleteWalletUseCase deleteWalletUseCase;

    @Autowired
    private FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase;

    @Autowired
    private FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldQueryDeletedWalletsOnly() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));

        var tombstone = findDeletedWalletByIdUseCase.execute(WALLET_ID);
        assertThat(tombstone.getDeletedAt()).isNotNull();
        assertThat(findDeletedWalletsByFilterPageUseCase.execute(FilterExpression.empty(), PageRequest.of(0, 20, List.of())).items())
            .extracting(WalletTombstone::getId)
            .containsExactly(WALLET_ID);
    }

    @Test
    void shouldHideDeletedWalletFromTheNormalPhysicalLookupContract() {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        deleteWalletUseCase.execute(new DeleteWalletCommand(WALLET_ID));

        assertThat(walletRepository.findById(WALLET_ID)).hasValueSatisfying(entity -> assertThat(entity.isActive()).isFalse());
    }
}
