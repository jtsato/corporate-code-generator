package io.github.jtsato.walletservice.core.domains.wallet.usecase.delete;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DeleteWalletUseCaseInteractorTests {
    private static final class FakeWalletGateway implements WalletGateway {
        private int deleteCallCount;
        private UUID receivedId;

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
        public Wallet create(Wallet entity) { return null; }

        @Override
        public Wallet update(Wallet entity) { return null; }

        @Override
        public void deleteById(UUID id) {
            deleteCallCount++;
            receivedId = id;
        }

        @Override
        public void restoreById(UUID id) { }
    }

    @Test
    void shouldRejectNullCommand() {
        var gateway = new FakeWalletGateway();

        var exception = assertThrows(
            ValidationException.class,
            () -> new DeleteWalletUseCaseInteractor(gateway).execute(null)
        );

        assertEquals("command", exception.getFields().getFirst().name());
        assertEquals("common.command.required", exception.getFields().getFirst().messageKey());
        assertEquals(0, gateway.deleteCallCount);
    }

    @Test
    void shouldRejectNullIdentifierInCommand() {
        var exception = assertThrows(
            ValidationException.class,
            () -> new DeleteWalletCommand(null)
        );

        assertEquals("id", exception.getFields().getFirst().name());
        assertEquals("common.identifier.required", exception.getFields().getFirst().messageKey());
    }

    @Test
    void shouldDelegateIdentifierExactlyOnce() {
        var gateway = new FakeWalletGateway();
        var id = UUID.fromString("11111111-1111-1111-1111-111111111111");

        new DeleteWalletUseCaseInteractor(gateway).execute(new DeleteWalletCommand(id));

        assertEquals(1, gateway.deleteCallCount);
        assertEquals(id, gateway.receivedId);
    }
}
