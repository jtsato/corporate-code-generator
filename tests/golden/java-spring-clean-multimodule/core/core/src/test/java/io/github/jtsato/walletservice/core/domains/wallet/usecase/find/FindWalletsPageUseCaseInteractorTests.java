package io.github.jtsato.walletservice.core.domains.wallet.usecase.find;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FindWalletsPageUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private PageRequest received;
        private PageResult<Wallet> result;
        private int findAllCallCount;
        private int findByFilterCallCount;
        private int findPageCallCount;

        @Override
        public List<Wallet> findAll() {
            findAllCallCount++;
            return List.of();
        }

        @Override
        public List<Wallet> findByFilter(FilterExpression filterExpression) {
            findByFilterCallCount++;
            return List.of();
        }

        @Override
        public PageResult<Wallet> findPage(PageRequest pageRequest) {
            findPageCallCount++;
            received = pageRequest;
            return result;
        }

        @Override
        public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) {
            return null;
        }

        @Override
        public Wallet findById(UUID id) {
            return null;
        }

        @Override
        public Wallet create(Wallet entity) { return null; }
    }

    @Test
    void shouldDelegatePageRequestToGatewayAndReturnItsResult() {
        var gateway = new FakeWalletGateway();
        var pageRequest = PageRequest.of(0, 2);
        gateway.result = new PageResult<>(List.of(), 0, 2, 0);

        var result = new FindWalletsPageUseCaseInteractor(gateway).execute(pageRequest);

        assertSame(pageRequest, gateway.received);
        assertSame(gateway.result, result);
        assertEquals(1, gateway.findPageCallCount);
        assertEquals(0, gateway.findAllCallCount);
        assertEquals(0, gateway.findByFilterCallCount);
    }

    @Test
    void shouldRejectNullPageRequest() {
        var gateway = new FakeWalletGateway();

        var exception = assertThrows(
            ValidationException.class,
            () -> new FindWalletsPageUseCaseInteractor(gateway).execute(null)
        );

        assertEquals("pageRequest", exception.getFields().getFirst().name());
        assertEquals("common.paging.page-request.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findPageCallCount);
    }
}
