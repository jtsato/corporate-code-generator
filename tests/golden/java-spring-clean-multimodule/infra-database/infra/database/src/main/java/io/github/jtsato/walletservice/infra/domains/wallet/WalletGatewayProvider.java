package io.github.jtsato.walletservice.infra.domains.wallet;

import com.querydsl.core.types.dsl.BooleanExpression;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.infra.database.common.filter.QuerydslFilterMapper;
import io.github.jtsato.walletservice.infra.database.domains.wallet.filter.WalletQuerydslFilterDefinition;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.mapper.WalletPersistenceMapper;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class WalletGatewayProvider implements WalletGateway {
    private final WalletRepository walletRepository;

    public WalletGatewayProvider(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Override
    public List<Wallet> findAll() {
        return walletRepository.findAll()
            .stream()
            .map(WalletPersistenceMapper::toDomain)
            .toList();
    }

    @Override
    public List<Wallet> findByFilter(FilterExpression filterExpression) {
        Objects.requireNonNull(filterExpression, "filterExpression");

        Optional<BooleanExpression> predicate = QuerydslFilterMapper.toPredicate(
            filterExpression,
            WalletQuerydslFilterDefinition.create()
        );

        List<WalletEntity> walletEntities = predicate
            .map(walletRepository::findAll)
            .orElseGet(() -> walletRepository.findAll());

        return walletEntities.stream()
            .map(WalletPersistenceMapper::toDomain)
            .toList();
    }
}
