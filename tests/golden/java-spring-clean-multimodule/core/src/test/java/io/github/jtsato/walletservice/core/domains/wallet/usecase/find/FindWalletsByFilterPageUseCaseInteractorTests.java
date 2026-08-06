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
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FindWalletsByFilterPageUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private final List<Wallet> result = new ArrayList<>();
        private FilterExpression receivedFilter;
        private PageRequest receivedPageRequest;
        private PageResult<Wallet> pageResult;
        private int findAllCallCount;
        private int findByFilterCallCount;
        private int findPageCallCount;
        private int findByFilterPageCallCount;

        @Override
        public List<Wallet> findAll() {
            findAllCallCount++;
            return result;
        }

        @Override
        public List<Wallet> findByFilter(FilterExpression filterExpression) {
            findByFilterCallCount++;
            return result;
        }

        @Override
        public PageResult<Wallet> findPage(PageRequest pageRequest) {
            findPageCallCount++;

            return pageResult;

        }

        @Override
        public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) {
            findByFilterPageCallCount++;
            receivedFilter = filterExpression;
            receivedPageRequest = pageRequest;
            return pageResult;
        }



        @Override
        public Wallet findById(UUID id) {
            return null;
        }

        @Override
        public WalletTombstone findDeletedById(UUID id) { return null; }

        @Override
        public PageResult<WalletTombstone> findDeletedByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }


        @Override
        public Wallet create(Wallet entity) { return null; }

        @Override
        public Wallet update(Wallet entity) { return null; }

        @Override
        public void deleteById(UUID id) { }

        @Override
        public void restoreById(UUID id) { }
    }

    @Test
    void shouldDelegateFilterAndPageRequestToGatewayAndReturnItsResult() {
        var gateway = new FakeWalletGateway();
        var expression = FilterExpression.of(FilterGroup.and(List.of(FilterCondition.isNotNull("id"))));
        var pageRequest = PageRequest.of(1, 2);
        gateway.pageResult = new PageResult<>(List.of(), 1, 2, 0);

        var result = new FindWalletsByFilterPageUseCaseInteractor(gateway).execute(expression, pageRequest);

        assertSame(expression, gateway.receivedFilter);
        assertSame(pageRequest, gateway.receivedPageRequest);
        assertSame(gateway.pageResult, result);
        assertEquals(1, gateway.findByFilterPageCallCount);
        assertEquals(0, gateway.findAllCallCount);
        assertEquals(0, gateway.findByFilterCallCount);
        assertEquals(0, gateway.findPageCallCount);
    }

    @Test
    void shouldAcceptEmptyFilterExpression() {
        var gateway = new FakeWalletGateway();
        var expression = FilterExpression.empty();
        var pageRequest = PageRequest.of(0, 2);
        gateway.pageResult = new PageResult<>(List.of(), 0, 2, 0);

        var result = new FindWalletsByFilterPageUseCaseInteractor(gateway).execute(expression, pageRequest);

        assertFalse(gateway.receivedFilter.hasFilters());
        assertSame(gateway.pageResult, result);
        assertEquals(1, gateway.findByFilterPageCallCount);
    }

    @Test
    void shouldRejectNullFilterExpression() {
        var gateway = new FakeWalletGateway();
        var pageRequest = PageRequest.of(0, 2);

        var exception = assertThrows(
            ValidationException.class,
            () -> new FindWalletsByFilterPageUseCaseInteractor(gateway).execute(null, pageRequest)
        );

        assertEquals("filterExpression", exception.getFields().getFirst().name());
        assertEquals("common.filter.expression.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findByFilterPageCallCount);
    }

    @Test
    void shouldRejectNullPageRequest() {
        var gateway = new FakeWalletGateway();
        var expression = FilterExpression.empty();

        var exception = assertThrows(
            ValidationException.class,
            () -> new FindWalletsByFilterPageUseCaseInteractor(gateway).execute(expression, null)
        );

        assertEquals("pageRequest", exception.getFields().getFirst().name());
        assertEquals("common.paging.page-request.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findByFilterPageCallCount);
    }
}
