package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.filter.FilterCondition;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.filter.FilterGroup;
import io.github.jtsato.walletservice.core.common.filter.FilterGroupOperator;
import io.github.jtsato.walletservice.core.common.filter.FilterOperator;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCase;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class WalletQuerydslFilterPersistenceTests {
    private static final UUID WALLET_ID1 =
        UUID.fromString("11111111-1111-1111-1111-111111111111");

    private static final UUID WALLET_ID2 =
        UUID.fromString("11111111-1111-1111-1111-111111111112");

    private static final UUID WALLET_ID3 =
        UUID.fromString("11111111-1111-1111-1111-111111111113");

    @Autowired
    private FindWalletsByFilterUseCase findWalletsByFilterUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @BeforeEach
    void arrange() {
        walletRepository.deleteAll();
        walletRepository.saveAllAndFlush(List.of(
            new WalletEntity(WALLET_ID1, new BigDecimal("123.45")),
            new WalletEntity(WALLET_ID2, new BigDecimal("124.45")),
            new WalletEntity(WALLET_ID3, new BigDecimal("125.45"))
        ));
    }

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldReturnAllRecordsWhenFilterExpressionIsEmpty() {
        assertThat(identifiersOf(FilterExpression.empty()))
            .containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceEquals() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.EQUALS, "124.45"))))))
            .containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldFilterByBalanceIn() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.IN, List.of("123.45", "125.45")))))))
            .containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceOrGroup() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.or(List.of(FilterCondition.of("balance", FilterOperator.EQUALS, "123.45"), FilterCondition.of("balance", FilterOperator.EQUALS, "125.45"))))))
            .containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceAndGroup() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.EQUALS, "124.45"), FilterCondition.of("balance", FilterOperator.NOT_EQUALS, "123.45"))))))
            .containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldFilterByBalanceNestedGroup() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.of(FilterGroupOperator.AND, List.of(FilterCondition.of("balance", FilterOperator.NOT_EQUALS, "123.45")), List.of(FilterGroup.or(List.of(FilterCondition.of("balance", FilterOperator.EQUALS, "124.45"), FilterCondition.of("balance", FilterOperator.EQUALS, "125.45"))))))))
            .containsExactlyInAnyOrder(WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceGreaterThan() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "123.45"))))))
            .containsExactlyInAnyOrder(WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceRange() {
        assertThat(identifiersOf(FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "123.45"), FilterCondition.of("balance", FilterOperator.LESS_THAN, "125.45"))))))
            .containsExactlyInAnyOrder(WALLET_ID2);
    }

    private List<UUID> identifiersOf(FilterExpression filterExpression) {
        return findWalletsByFilterUseCase.execute(filterExpression)
            .stream()
            .map(Wallet::getId)
            .toList();
    }
}
