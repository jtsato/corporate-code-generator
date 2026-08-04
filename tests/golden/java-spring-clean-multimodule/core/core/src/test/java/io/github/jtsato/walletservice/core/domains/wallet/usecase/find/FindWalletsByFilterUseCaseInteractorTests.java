package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterCondition;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.filter.FilterGroup;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class FindWalletsByFilterUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private final List<Wallet> result = new ArrayList<>();
        private FilterExpression received;
        private int findAllCallCount;
        private int findByFilterCallCount;

        @Override
        public List<Wallet> findAll() {
            findAllCallCount++;
            return result;
        }

        @Override
        public List<Wallet> findByFilter(FilterExpression filterExpression) {
            findByFilterCallCount++;
            received = filterExpression;
            return result;
        }

        @Override
        public PageResult<Wallet> findPage(PageRequest pageRequest) {
            return null;
        }
    }

    @Test
    void shouldDelegateFilterExpressionToGatewayWithoutModifyingIt() {
        var gateway = new FakeWalletGateway();
        var expression = FilterExpression.of(FilterGroup.and(List.of(FilterCondition.isNotNull("id"))));

        var result = new FindWalletsByFilterUseCaseInteractor(gateway).execute(expression);

        assertSame(expression, gateway.received);
        assertSame(gateway.result, result);
        assertEquals(1, gateway.findByFilterCallCount);
        assertEquals(0, gateway.findAllCallCount);
    }

    @Test
    void shouldAcceptEmptyFilterExpression() {
        var gateway = new FakeWalletGateway();
        var expression = FilterExpression.empty();

        var result = new FindWalletsByFilterUseCaseInteractor(gateway).execute(expression);

        assertSame(expression, gateway.received);
        assertFalse(gateway.received.hasFilters());
        assertSame(gateway.result, result);
        assertEquals(1, gateway.findByFilterCallCount);
    }

    @Test
    void shouldRejectNullFilterExpression() {
        var gateway = new FakeWalletGateway();

        var exception = assertThrows(
            ValidationException.class,
            () -> new FindWalletsByFilterUseCaseInteractor(gateway).execute(null)
        );

        assertEquals("filterExpression", exception.getFields().getFirst().name());
        assertEquals("common.filter.expression.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findByFilterCallCount);
        assertEquals(0, gateway.findAllCallCount);
    }
}
