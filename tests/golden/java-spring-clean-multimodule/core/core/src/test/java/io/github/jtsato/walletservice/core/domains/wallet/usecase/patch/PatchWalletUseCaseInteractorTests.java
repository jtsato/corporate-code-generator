package io.github.jtsato.walletservice.core.domains.wallet.usecase.patch;

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
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PatchWalletUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private Wallet current;
        private Wallet received;
        private Wallet result;
        private int findByIdCallCount;
        private int updateCallCount;

        @Override public List<Wallet> findAll() { return List.of(); }
        @Override public List<Wallet> findByFilter(FilterExpression filterExpression) { return List.of(); }
        @Override public PageResult<Wallet> findPage(PageRequest pageRequest) { return null; }
        @Override public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }
        @Override public Wallet findById(UUID id) { findByIdCallCount++; return current; }
        @Override public WalletTombstone findDeletedById(UUID id) { return null; }
        @Override public PageResult<WalletTombstone> findDeletedByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) { return null; }
        @Override public Wallet create(Wallet entity) { return null; }
        @Override public Wallet update(Wallet entity) { updateCallCount++; received = entity; return result; }
        @Override public void deleteById(UUID id) { }
        @Override public void restoreById(UUID id) { }
    }

    @Test
    void shouldRejectNullCommand() {
        var gateway = new FakeWalletGateway();
        var exception = assertThrows(ValidationException.class, () -> new PatchWalletUseCaseInteractor(gateway).execute(null));
        assertEquals("command", exception.getFields().getFirst().name());
        assertEquals("common.command.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.findByIdCallCount);
        assertEquals(0, gateway.updateCallCount);
    }

    @Test
    void shouldRejectEmptyPatch() {
        var exception = assertThrows(ValidationException.class, () -> new PatchWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111111"), null, false));
        assertEquals("command", exception.getFields().getFirst().name());
        assertEquals("common.patch.field.required", exception.getFields().getFirst().messageKey());
    }

    @Test
    void shouldRejectNullIdWhenProvided() {
        var exception = assertThrows(ValidationException.class, () -> new PatchWalletCommand(null, new BigDecimal("124.45"), true));
        assertEquals("id", exception.getFields().getFirst().name());
        assertEquals("common.identifier.required", exception.getFields().getFirst().messageKey());
    }
    @Test
    void shouldRejectNullBalanceWhenProvided() {
        var exception = assertThrows(ValidationException.class, () -> new PatchWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111111"), null, true));
        assertEquals("balance", exception.getFields().getFirst().name());
        assertEquals("wallet.balance.required", exception.getFields().getFirst().messageKey());
    }

    @Test
    void shouldFindMergeAndUpdate() {
        var gateway = new FakeWalletGateway();
        gateway.current = new Wallet(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            new BigDecimal("124.45")
        );
        gateway.result = new Wallet(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            new BigDecimal("124.45")
        );
        var result = new PatchWalletUseCaseInteractor(gateway).execute(new PatchWalletCommand(UUID.fromString("11111111-1111-1111-1111-111111111111"), new BigDecimal("125.45"), true));
        assertEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"), gateway.received.getId());
        assertEquals(new BigDecimal("125.45"), gateway.received.getBalance());
        assertSame(gateway.result, result);
        assertEquals(1, gateway.findByIdCallCount);
        assertEquals(1, gateway.updateCallCount);
    }

}
