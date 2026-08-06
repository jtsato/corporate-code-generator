package io.github.jtsato.walletservice.core.domains.wallet.usecase.create;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CreateWalletUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private Wallet received;
        private Wallet result;
        private int createCallCount;

        @Override
        public List<Wallet> findAll() { return List.of(); }

        @Override
        public List<Wallet> findByFilter(FilterExpression filterExpression) { return List.of(); }

        @Override
        public PageResult<Wallet> findPage(PageRequest pageRequest) { return null; }

        @Override
        public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }

        @Override
        public Wallet findById(UUID id) { return null; }

        @Override
        public WalletTombstone findDeletedById(UUID id) { return null; }

        @Override
        public PageResult<WalletTombstone> findDeletedByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }

        @Override
        public Wallet create(Wallet entity) {
            createCallCount++;
            received = entity;
            return result;
        }

        @Override
        public Wallet update(Wallet entity) { return null; }

        @Override
        public void deleteById(UUID id) { }

        @Override
        public void restoreById(UUID id) { }
    }

    @Test
    void shouldRejectNullCommand() {
        var gateway = new FakeWalletGateway();

        var exception = assertThrows(
            ValidationException.class,
            () -> new CreateWalletUseCaseInteractor(gateway).execute(null)
        );

        assertEquals("command", exception.getFields().getFirst().name());
        assertEquals("common.command.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.createCallCount);
    }

    @Test
    void shouldRejectNullIdInCommand() {
        var exception = assertThrows(
            ValidationException.class,
            () -> new CreateWalletCommand(null, new BigDecimal("124.45"))
        );

        assertEquals("id", exception.getFields().getFirst().name());
        assertEquals("common.identifier.required", exception.getFields().getFirst().messageKey());
    }
    @Test
    void shouldRejectNullBalanceInCommand() {
        var exception = assertThrows(
            ValidationException.class,
            () -> new CreateWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111111"), null)
        );

        assertEquals("balance", exception.getFields().getFirst().name());
        assertEquals("wallet.balance.required", exception.getFields().getFirst().messageKey());
    }


    @Test
    void shouldCreateAndDelegateWalletPreservingItsValues() {
        var gateway = new FakeWalletGateway();
        gateway.result = new Wallet(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            new BigDecimal("124.45")
        );
        var command = new CreateWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111111"), new BigDecimal("124.45"));

        var result = new CreateWalletUseCaseInteractor(gateway).execute(command);

        assertEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"), gateway.received.getId());
        assertEquals(new BigDecimal("124.45"), gateway.received.getBalance());

        assertSame(gateway.result, result);
        assertEquals(1, gateway.createCallCount);
    }
}
