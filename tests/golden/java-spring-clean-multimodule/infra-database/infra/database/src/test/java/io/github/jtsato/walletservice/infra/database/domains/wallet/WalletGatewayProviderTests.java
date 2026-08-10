package io.github.jtsato.walletservice.infra.database.domains.wallet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.infra.database.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

/**
 * Persistence slice test for {@link WalletGatewayProvider}.
 *
 * <p>Runs against a real embedded database with the schema derived from the JPA mapping, and
 * seeds one active row through SQL so the column mapping itself is exercised rather than assumed.
 * Each test method runs in its own rolled-back transaction.</p>
 */
@DataJpaTest
@Import(WalletGatewayProvider.class)
@Sql("WalletGatewayProviderTests.sql")
class WalletGatewayProviderTests {
    private static final UUID SEEDED_WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal SEEDED_WALLET_BALANCE = new BigDecimal("123.45");
    private static final UUID CREATED_WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111121");
    private static final BigDecimal CREATED_WALLET_BALANCE = new BigDecimal("133.45");
    private static final UUID UPDATED_WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111131");
    private static final BigDecimal UPDATED_WALLET_BALANCE = new BigDecimal("143.45");

    @Autowired
    private WalletGatewayProvider walletGatewayProvider;

    @Autowired
    private WalletRepository walletRepository;

    @Test
    void shouldFindSeededActiveRecordByIdentifier() {
        Wallet wallet = walletGatewayProvider.findById(SEEDED_WALLET_ID);

        assertThat(wallet).isNotNull();
        assertThat(wallet.getId()).isEqualTo(SEEDED_WALLET_ID);
        assertThat(wallet.getBalance()).isEqualTo(SEEDED_WALLET_BALANCE);
        assertThat(walletRepository.count()).isEqualTo(1L);
    }

    @Test
    void shouldFailToFindUnknownIdentifier() {
        assertThatThrownBy(() -> walletGatewayProvider.findById(CREATED_WALLET_ID))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldCreateAndPersistRecord() {
        Wallet created = walletGatewayProvider.create(new Wallet(CREATED_WALLET_ID, CREATED_WALLET_BALANCE));

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(CREATED_WALLET_ID);
        assertThat(walletRepository.findById(CREATED_WALLET_ID)).isPresent();
        assertThat(walletRepository.count()).isEqualTo(2L);
    }

    @Test
    void shouldRejectCreatingAnExistingIdentifier() {
        assertThatThrownBy(() -> walletGatewayProvider.create(new Wallet(SEEDED_WALLET_ID, SEEDED_WALLET_BALANCE)))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void shouldUpdateExistingRecord() {
        Wallet updated = walletGatewayProvider.update(new Wallet(SEEDED_WALLET_ID, UPDATED_WALLET_BALANCE));

        assertThat(updated).isNotNull();
        assertThat(walletRepository.count()).isEqualTo(1L);
    }

    @Test
    void shouldSoftDeleteThenExposeRecordAsTombstone() {
        walletGatewayProvider.deleteById(SEEDED_WALLET_ID);

        assertThatThrownBy(() -> walletGatewayProvider.findById(SEEDED_WALLET_ID))
            .isInstanceOf(NotFoundException.class);

        WalletTombstone tombstone = walletGatewayProvider.findDeletedById(SEEDED_WALLET_ID);
        assertThat(tombstone.getId()).isEqualTo(SEEDED_WALLET_ID);
        assertThat(tombstone.getDeletedAt()).isNotNull();
        assertThat(walletRepository.count()).isEqualTo(1L);
    }

    @Test
    void shouldRestoreSoftDeletedRecord() {
        walletGatewayProvider.deleteById(SEEDED_WALLET_ID);
        walletGatewayProvider.restoreById(SEEDED_WALLET_ID);

        assertThat(walletGatewayProvider.findById(SEEDED_WALLET_ID)).isNotNull();
    }

    @Test
    void shouldReturnOnlyActiveRecordsFromFindAll() {
        List<Wallet> before = walletGatewayProvider.findAll();
        assertThat(before).hasSize(1);

        walletGatewayProvider.deleteById(SEEDED_WALLET_ID);

        assertThat(walletGatewayProvider.findAll()).isEmpty();
    }

    @Test
    void shouldPageActiveRecordsWithMetadata() {
        PageResult<Wallet> page = walletGatewayProvider.findByFilterPage(
            FilterExpression.empty(),
            PageRequest.of(0, 20, List.of())
        );

        assertThat(page.items()).hasSize(1);
        assertThat(page.page()).isZero();
        assertThat(page.size()).isEqualTo(20);
        assertThat(page.totalItems()).isEqualTo(1L);
        assertThat(page.totalPages()).isEqualTo(1L);
    }

    @Test
    void shouldPageDeletedRecordsAfterSoftDelete() {
        walletGatewayProvider.deleteById(SEEDED_WALLET_ID);

        PageResult<WalletTombstone> page = walletGatewayProvider.findDeletedByFilterPage(
            FilterExpression.empty(),
            PageRequest.of(0, 20, List.of())
        );

        assertThat(page.items()).hasSize(1);
        assertThat(page.totalItems()).isEqualTo(1L);
    }
}
