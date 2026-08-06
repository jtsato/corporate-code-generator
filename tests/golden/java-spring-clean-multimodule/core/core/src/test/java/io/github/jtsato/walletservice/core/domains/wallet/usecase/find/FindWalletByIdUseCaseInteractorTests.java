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
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FindWalletByIdUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private UUID received;
        private Wallet result;
        private int findByIdCallCount;

        @Override
        public List<Wallet> findAll() { return List.of(); }

        @Override
        public List<Wallet> findByFilter(FilterExpression filterExpression) { return List.of(); }

        @Override
        public PageResult<Wallet> findPage(PageRequest pageRequest) { return null; }

        @Override
        public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }

        @Override
        public Wallet findById(UUID id) {
            findByIdCallCount++;
            received = id;
            return result;
        }

        @Override
        public Wallet create(Wallet entity) { return null; }

        @Override
        public Wallet update(Wallet entity) { return null; }
    }

    @Test
    void shouldDelegateIdentifierToGatewayAndReturnItsResult() {
        var gateway = new FakeWalletGateway();
        var identifier = UUID.fromString("11111111-1111-1111-1111-111111111111");
        gateway.result = new Wallet(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            new BigDecimal("124.45")
        );

        var result = new FindWalletByIdUseCaseInteractor(gateway).execute(identifier);

        assertSame(identifier, gateway.received);
        assertSame(gateway.result, result);
        assertEquals(1, gateway.findByIdCallCount);
    }

    @Test
    void shouldRejectNullIdentifier() {
        var gateway = new FakeWalletGateway();

        var exception = assertThrows(
            ValidationException.class,
            () -> new FindWalletByIdUseCaseInteractor(gateway).execute(null)
        );

        assertEquals("id", exception.getFields().getFirst().name());
        assertEquals("common.identifier.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findByIdCallCount);
    }
}
