package io.github.jtsato.walletservice.infra.domains.wallet.repository;

import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.ListQuerydslPredicateExecutor;

public interface WalletRepository extends JpaRepository<WalletEntity, UUID>, ListQuerydslPredicateExecutor<WalletEntity> {
}
