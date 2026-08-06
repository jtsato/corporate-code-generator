package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsPageUseCase;
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
class WalletPagingPersistenceTests {
    @Autowired
    private FindWalletsPageUseCase findWalletsPageUseCase;

    @Autowired
    private WalletRepository walletRepository;

    @BeforeEach
    void arrange() {
        walletRepository.deleteAll();
        walletRepository.saveAllAndFlush(List.of(
            new WalletEntity(UUID.fromString("11111111-1111-1111-1111-111111111111"), new BigDecimal("123.45"), "sample"),
            new WalletEntity(UUID.fromString("11111111-1111-1111-1111-111111111112"), new BigDecimal("124.45"), "sample-2"),
            new WalletEntity(UUID.fromString("11111111-1111-1111-1111-111111111113"), new BigDecimal("125.45"), "sample-3"),
            new WalletEntity(UUID.fromString("11111111-1111-1111-1111-111111111114"), new BigDecimal("126.45"), "sample-4"),
            new WalletEntity(UUID.fromString("11111111-1111-1111-1111-111111111115"), new BigDecimal("127.45"), "sample-5")
        ));
    }

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldReturnFirstPage() {
        PageResult<Wallet> result = findWalletsPageUseCase.execute(PageRequest.of(0, 2));

        assertThat(result.items()).hasSize(2);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldReturnSecondPage() {
        PageResult<Wallet> result = findWalletsPageUseCase.execute(PageRequest.of(1, 2));

        assertThat(result.items()).hasSize(2);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldReturnLastPage() {
        PageResult<Wallet> result = findWalletsPageUseCase.execute(PageRequest.of(2, 2));

        assertThat(result.items()).hasSize(1);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.page()).isEqualTo(2);
        assertThat(result.size()).isEqualTo(2);
    }

    @Test
    void shouldReturnEmptyPageOutOfRange() {
        PageResult<Wallet> result = findWalletsPageUseCase.execute(PageRequest.of(10, 2));

        assertThat(result.items()).hasSize(0);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.page()).isEqualTo(10);
        assertThat(result.size()).isEqualTo(2);
    }

}
