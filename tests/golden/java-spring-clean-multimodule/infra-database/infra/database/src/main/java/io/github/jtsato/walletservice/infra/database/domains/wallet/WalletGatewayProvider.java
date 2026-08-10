package io.github.jtsato.walletservice.infra.database.domains.wallet;

import com.querydsl.core.types.dsl.BooleanExpression;
import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.infra.database.common.filter.QuerydslFilterMapper;
import io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageRequestMapper;
import io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageResultMapper;
import io.github.jtsato.walletservice.infra.database.domains.wallet.entity.QWalletEntity;
import io.github.jtsato.walletservice.infra.database.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.database.domains.wallet.filter.WalletQuerydslFilterDefinition;
import io.github.jtsato.walletservice.infra.database.domains.wallet.mapper.WalletPersistenceMapper;
import io.github.jtsato.walletservice.infra.database.domains.wallet.repository.WalletRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

public class WalletGatewayProvider implements WalletGateway {
    private static final QWalletEntity ENTITY = QWalletEntity.walletEntity;
    private final WalletRepository walletRepository;

    public WalletGatewayProvider(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Override
    public List<Wallet> findAll() {
        return walletRepository.findAll(activePredicate())
            .stream()
            .map(WalletPersistenceMapper::toDomain)
            .toList();
    }

    @Override
    public Wallet findById(UUID id) {
        Objects.requireNonNull(id, "id");

        return walletRepository.findById(id)
            .filter(WalletEntity::isActive)
            .map(WalletPersistenceMapper::toDomain)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
        ));
    }

    @Override
    public WalletTombstone findDeletedById(UUID id) {
        Objects.requireNonNull(id, "id");

        return walletRepository.findById(id)
            .filter(entity -> !entity.isActive())
            .map(WalletPersistenceMapper::toTombstone)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            ));
    }

    @Override
    public Wallet create(Wallet wallet) {
        Objects.requireNonNull(wallet, "wallet");

        if (walletRepository.existsById(wallet.getId()) || hasActiveUniqueConflict(wallet, null)) {
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

        walletRepository.findById(wallet.getId())
            .filter(WalletEntity::isActive)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            ));

        if (hasActiveUniqueConflict(wallet, wallet.getId())) {
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
    public void deleteById(UUID id) {
        Objects.requireNonNull(id, "id");

        WalletEntity entity = walletRepository.findById(id)
            .filter(WalletEntity::isActive)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            ));
        entity.markDeleted(id.toString());
        walletRepository.save(entity);
    }

    @Override
    public List<Wallet> findByFilter(FilterExpression filterExpression) {
        Objects.requireNonNull(filterExpression, "filterExpression");

        BooleanExpression predicate = activePredicate();
        predicate = QuerydslFilterMapper.toPredicate(
            filterExpression,
            WalletQuerydslFilterDefinition.create()
        ).map(predicate::and).orElse(predicate);

        return walletRepository.findAll(predicate)
            .stream()
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

        Page<WalletEntity> page = walletRepository.findAll(activePredicate(), pageable);

        return SpringDataPageResultMapper.toPageResult(
            page,
            WalletPersistenceMapper::toDomain
        );
    }

    @Override
    public PageResult<Wallet> findByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) {
        Objects.requireNonNull(filterExpression, "filterExpression");
        Objects.requireNonNull(pageRequest, "pageRequest");

        BooleanExpression predicate = activePredicate();
        predicate = QuerydslFilterMapper.toPredicate(
            filterExpression,
            WalletQuerydslFilterDefinition.create()
        ).map(predicate::and).orElse(predicate);
        Pageable pageable = SpringDataPageRequestMapper.toPageable(
            pageRequest,
            Map.ofEntries(
                Map.entry("id", "id"),
                Map.entry("balance", "balance")
            )
        );
        Page<WalletEntity> page = walletRepository.findAll(predicate, pageable);

        return SpringDataPageResultMapper.toPageResult(
            page,
            WalletPersistenceMapper::toDomain
        );
    }

    @Override
    public PageResult<WalletTombstone> findDeletedByFilterPage(FilterExpression filterExpression, PageRequest pageRequest) {
        Objects.requireNonNull(filterExpression, "filterExpression");
        Objects.requireNonNull(pageRequest, "pageRequest");

        BooleanExpression predicate = deletedPredicate();
        predicate = QuerydslFilterMapper.toPredicate(
            filterExpression,
            WalletQuerydslFilterDefinition.create()
        ).map(predicate::and).orElse(predicate);
        Pageable pageable = SpringDataPageRequestMapper.toPageable(
            pageRequest,
            Map.ofEntries(
                Map.entry("id", "id"),
                Map.entry("balance", "balance")
            )
        );
        Page<WalletEntity> page = walletRepository.findAll(predicate, pageable);

        return SpringDataPageResultMapper.toPageResult(
            page,
            WalletPersistenceMapper::toTombstone
        );
    }

    @Override
    @Transactional
    public void restoreById(UUID id) {
        Objects.requireNonNull(id, "id");

        WalletEntity entity = walletRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(
                "wallet.not-found",
                "Wallet was not found."
            ));
        if (entity.isActive()) {
            throw new ConflictException(
                "wallet.already-exists",
                "Wallet already exists."
            );
        }

        Wallet domain = WalletPersistenceMapper.toDomain(entity);
        if (hasActiveUniqueConflict(domain, id)) {
            throw new ConflictException(
                "wallet.already-exists",
                "Wallet already exists."
            );
        }
        entity.restore();
        walletRepository.save(entity);
    }

    private BooleanExpression activePredicate() {
        return ENTITY.deletedAt.isNull().and(ENTITY.deletionScope.eq(WalletEntity.ACTIVE_SCOPE));
    }

    private BooleanExpression deletedPredicate() {
        return ENTITY.deletedAt.isNotNull().and(ENTITY.deletionScope.ne(WalletEntity.ACTIVE_SCOPE));
    }

    private boolean hasActiveUniqueConflict(Wallet wallet, UUID ignoredIdentifier) {
        if (wallet.getBalance() != null) {
            BooleanExpression predicate = activePredicate().and(ENTITY.balance.eq(wallet.getBalance()));
            if (ignoredIdentifier != null) predicate = predicate.and(ENTITY.id.ne(ignoredIdentifier));
            if (walletRepository.exists(predicate)) return true;
        }
        return false;
    }
}
