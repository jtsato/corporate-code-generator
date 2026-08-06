package io.github.jtsato.walletservice.infra.domains.wallet.mapper;

import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;

public final class WalletPersistenceMapper {
    private WalletPersistenceMapper() {
    }

    public static WalletEntity toEntity(Wallet wallet) {
        return new WalletEntity(
            wallet.getId(),
            wallet.getBalance()
        );
    }

    public static Wallet toDomain(WalletEntity walletEntity) {
        return new Wallet(
            walletEntity.getId(),
            walletEntity.getBalance()
        );
    }

    public static WalletTombstone toTombstone(WalletEntity walletEntity) {
        return new WalletTombstone(
            walletEntity.getId(),
            walletEntity.getBalance(),
            walletEntity.getDeletedAt()
        );
    }
}
