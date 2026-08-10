package io.github.jtsato.walletservice.infra.database.domains.wallet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

/**
 * Persistence integration test for {@link WalletGatewayProvider}.
 *
 * <p>The slice test runs against an embedded database, which accepts mappings and queries a
 * production engine can reject. This test runs the same provider against postgres:18-alpine in a
 * container, so the JPA mapping, the schema generated from it and the paging query are verified on
 * a real database engine.</p>
 *
 * <p>The class is named {@code *IT} so Surefire ignores it during {@code mvn test}. Failsafe runs
 * it only under the {@code integration-test} Maven profile, which requires a running Docker
 * daemon.</p>
 */
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(WalletGatewayProvider.class)
class WalletGatewayProviderIT {
    @Container
    private static final PostgreSQLContainer DATABASE = new PostgreSQLContainer("postgres:18-alpine");

    private static final UUID CREATED_WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111121");
    private static final BigDecimal CREATED_WALLET_BALANCE = new BigDecimal("133.45");
    private static final UUID SEEDED_WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Autowired
    private WalletGatewayProvider walletGatewayProvider;

    @Autowired
    private WalletRepository walletRepository;

    @DynamicPropertySource
    static void registerContainerDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::getJdbcUrl);
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Test
    void shouldCreateAndReadRecordOnTheContainerDatabase() {
        walletGatewayProvider.create(new Wallet(CREATED_WALLET_ID, CREATED_WALLET_BALANCE));

        Wallet wallet = walletGatewayProvider.findById(CREATED_WALLET_ID);

        assertThat(wallet).isNotNull();
        assertThat(wallet.getId()).isEqualTo(CREATED_WALLET_ID);
        assertThat(wallet.getBalance()).isEqualTo(CREATED_WALLET_BALANCE);
        assertThat(walletRepository.count()).isEqualTo(1L);
    }

    @Test
    void shouldFailToFindUnknownIdentifierOnTheContainerDatabase() {
        assertThatThrownBy(() -> walletGatewayProvider.findById(SEEDED_WALLET_ID))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldPageActiveRecordsOnTheContainerDatabase() {
        walletGatewayProvider.create(new Wallet(CREATED_WALLET_ID, CREATED_WALLET_BALANCE));

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
    void shouldSoftDeleteAndExposeTombstoneOnTheContainerDatabase() {
        walletGatewayProvider.create(new Wallet(CREATED_WALLET_ID, CREATED_WALLET_BALANCE));

        walletGatewayProvider.deleteById(CREATED_WALLET_ID);

        assertThatThrownBy(() -> walletGatewayProvider.findById(CREATED_WALLET_ID))
            .isInstanceOf(NotFoundException.class);

        WalletTombstone tombstone = walletGatewayProvider.findDeletedById(CREATED_WALLET_ID);
        assertThat(tombstone.getDeletedAt()).isNotNull();
        assertThat(walletRepository.count()).isEqualTo(1L);
    }
}
