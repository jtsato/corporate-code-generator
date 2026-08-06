package io.github.jtsato.walletservice.infra.database.domains.wallet.query;

import com.querydsl.core.types.dsl.BooleanExpression;
import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.QWalletEntity;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;


public final class WalletPredicateBuilder {
    private static final QWalletEntity ENTITY = QWalletEntity.walletEntity;
    private WalletPredicateBuilder() {
    }
    public static BooleanExpression idEquals(UUID id) { if (id == null) throw new ValidationException(List.of(new FieldViolation("id", "common.querydsl.wallet.id.required", "Wallet id is required."))); return ENTITY.id.eq(id); }
    public static BooleanExpression balanceEquals(BigDecimal balance) { if (balance == null) throw new ValidationException(List.of(new FieldViolation("balance", "common.querydsl.wallet.balance.required", "Wallet balance is required."))); return ENTITY.balance.eq(balance); }
    public static BooleanExpression currencyEquals(String currency) { if (currency == null) throw new ValidationException(List.of(new FieldViolation("currency", "common.querydsl.wallet.currency.required", "Wallet currency is required."))); return ENTITY.currency.eq(currency); }

}
