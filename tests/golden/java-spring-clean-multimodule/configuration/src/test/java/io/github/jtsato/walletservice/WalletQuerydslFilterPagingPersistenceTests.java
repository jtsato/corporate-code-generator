package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterCondition;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.filter.FilterGroup;
import io.github.jtsato.walletservice.core.common.filter.FilterOperator;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
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
class WalletQuerydslFilterPagingPersistenceTests {
    private static final UUID WALLET_ID1 =
        UUID.fromString("11111111-1111-1111-1111-111111111111");

    private static final UUID WALLET_ID2 =
        UUID.fromString("11111111-1111-1111-1111-111111111112");

    private static final UUID WALLET_ID3 =
        UUID.fromString("11111111-1111-1111-1111-111111111113");

    private static final UUID WALLET_ID4 =
        UUID.fromString("11111111-1111-1111-1111-111111111114");

    private static final UUID WALLET_ID5 =
        UUID.fromString("11111111-1111-1111-1111-111111111115");

    @Autowired
    private FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @BeforeEach
    void arrange() {
        walletRepository.deleteAll();
        walletRepository.saveAllAndFlush(List.of(
            new WalletEntity(WALLET_ID1, new BigDecimal("123.45"), "sample"),
            new WalletEntity(WALLET_ID2, new BigDecimal("124.45"), "sample"),
            new WalletEntity(WALLET_ID3, new BigDecimal("125.45"), "sample"),
            new WalletEntity(WALLET_ID4, new BigDecimal("126.45"), "sample"),
            new WalletEntity(WALLET_ID5, new BigDecimal("127.45"), "sample")
        ));
    }

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldReturnFirstPageForEmptyFilter() {
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(
            FilterExpression.empty(),
            PageRequest.of(0, 2)
        );

        assertThat(result.items()).hasSize(2);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldFilterByBalanceAndReturnFirstPage() {
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(
            FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "124.45")))),
            PageRequest.of(0, 2)
        );

        assertThat(result.items()).hasSize(2);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldFilterByBalanceAndReturnSecondPage() {
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(
            FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "124.45")))),
            PageRequest.of(1, 2)
        );

        assertThat(result.items()).hasSize(1);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldApplyBalanceAndFilterWithPaging() {
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(
            FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "123.45"), FilterCondition.of("balance", FilterOperator.LESS_THAN, "125.45")))),
            PageRequest.of(0, 2)
        );

        assertThat(result.items()).hasSize(1);
        assertThat(result.totalItems()).isEqualTo(1);
        assertThat(result.totalPages()).isEqualTo(1);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldReturnEmptyPageForBalanceFilterOutOfRange() {
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(
            FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("balance", FilterOperator.GREATER_THAN, "124.45")))),
            PageRequest.of(5, 2)
        );

        assertThat(result.items()).hasSize(0);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.totalPages()).isEqualTo(2);
        assertThat(result.page()).isEqualTo(5);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldPropagateInvalidFilter() {
        assertThatThrownBy(() -> findWalletsByFilterPageUseCase.execute(
            FilterExpression.of(FilterGroup.and(List.of(FilterCondition.of("unsupported", FilterOperator.EQUALS, "value")))),
            PageRequest.of(0, 2)
        )).isInstanceOf(ValidationException.class);
    }

}
