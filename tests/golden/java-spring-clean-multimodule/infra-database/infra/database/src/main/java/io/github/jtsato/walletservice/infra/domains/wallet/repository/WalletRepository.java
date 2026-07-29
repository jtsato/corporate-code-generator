package io.github.jtsato.walletservice.infra.domains.wallet.repository;

import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<WalletEntity, UUID> {
}
