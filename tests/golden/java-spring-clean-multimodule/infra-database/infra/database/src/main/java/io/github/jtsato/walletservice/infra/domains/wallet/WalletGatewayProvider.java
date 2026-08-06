package io.github.jtsato.walletservice.infra.domains.wallet;

import com.querydsl.core.types.dsl.BooleanExpression;
import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.infra.database.common.filter.QuerydslFilterMapper;
import io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageRequestMapper;
import io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageResultMapper;
import io.github.jtsato.walletservice.infra.database.domains.wallet.filter.WalletQuerydslFilterDefinition;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.mapper.WalletPersistenceMapper;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    public Wallet findById(UUID id) {
        Objects.requireNonNull(id, "id");

        return walletRepository.findById(id)
            .map(WalletPersistenceMapper::toDomain)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            ));
    }

    @Override
    public Wallet create(Wallet wallet) {
        Objects.requireNonNull(wallet, "wallet");

        if (walletRepository.existsById(wallet.getId())) {
            throw new ConflictException(
                "wallet.already-exists",
                "Wallet already exists."
            );
        }

        WalletEntity entity = WalletPersistenceMapper.toEntity(wallet);
        WalletEntity saved = walletRepository.save(entity);

        return WalletPersistenceMapper.toDomain(saved);
    }

    @Override
    public Wallet update(Wallet wallet) {
        Objects.requireNonNull(wallet, "wallet");

        if (!walletRepository.existsById(wallet.getId())) {
            throw new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            );
        }

        WalletEntity entity = WalletPersistenceMapper.toEntity(wallet);
        WalletEntity saved = walletRepository.save(entity);

        return WalletPersistenceMapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        Objects.requireNonNull(id, "id");

        if (!walletRepository.existsById(id)) {
            throw new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            );
        }

        walletRepository.deleteById(id);
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

    @Override
    public PageResult<Wallet> findPage(PageRequest pageRequest) {
        Objects.requireNonNull(pageRequest, "pageRequest");

        Pageable pageable = SpringDataPageRequestMapper.toPageable(
        pageRequest,
            Map.ofEntries(
                Map.entry("id", "id"),
                Map.entry("balance", "balance")
            )
        );

        Page<WalletEntity> page = walletRepository.findAll(pageable);

        return SpringDataPageResultMapper.toPageResult(
            page,
            WalletPersistenceMapper::toDomain
        );
    }

    @Override
    public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) {
        Objects.requireNonNull(filterExpression, "filterExpression");
        Objects.requireNonNull(pageRequest, "pageRequest");

        Optional<BooleanExpression> predicate = QuerydslFilterMapper.toPredicate(
            filterExpression,
            WalletQuerydslFilterDefinition.create()
        );
        Pageable pageable = SpringDataPageRequestMapper.toPageable(
            pageRequest,
            Map.ofEntries(
                Map.entry("id", "id"),
                Map.entry("balance", "balance")
            )
        );
        Page<WalletEntity> page = predicate
            .map(value -> walletRepository.findAll(value, pageable))
            .orElseGet(() -> walletRepository.findAll(pageable));

        return SpringDataPageResultMapper.toPageResult(
            page,
            WalletPersistenceMapper::toDomain
        );
    }
}
