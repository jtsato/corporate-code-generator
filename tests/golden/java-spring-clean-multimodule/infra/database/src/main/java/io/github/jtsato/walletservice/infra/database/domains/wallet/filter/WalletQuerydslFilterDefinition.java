package io.github.jtsato.walletservice.infra.database.domains.wallet.filter;

import io.github.jtsato.walletservice.infra.database.common.filter.*;
import io.github.jtsato.walletservice.core.common.filter.FilterOperator;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.QWalletEntity;
import java.util.*;
import java.util.UUID;
import java.math.BigDecimal;


public final class WalletQuerydslFilterDefinition {
    private WalletQuerydslFilterDefinition() {
    }

    public static QuerydslFilterDefinition create() {
        var entity = QWalletEntity.walletEntity;
        var id = new LinkedHashMap<FilterOperator, QuerydslFilterFieldDefinition.Operation<UUID>>();
        id.put(FilterOperator.EQUALS, values -> entity.id.eq(values.get(0)));
        id.put(FilterOperator.NOT_EQUALS, values -> entity.id.ne(values.get(0)));
        id.put(FilterOperator.IN, values -> entity.id.in(values));
        id.put(FilterOperator.IS_NULL, values -> entity.id.isNull());
        id.put(FilterOperator.IS_NOT_NULL, values -> entity.id.isNotNull());
        var balance = new LinkedHashMap<FilterOperator, QuerydslFilterFieldDefinition.Operation<BigDecimal>>();
        balance.put(FilterOperator.EQUALS, values -> entity.balance.eq(values.get(0)));
        balance.put(FilterOperator.NOT_EQUALS, values -> entity.balance.ne(values.get(0)));
        balance.put(FilterOperator.GREATER_THAN, values -> entity.balance.gt(values.get(0)));
        balance.put(FilterOperator.GREATER_THAN_OR_EQUALS, values -> entity.balance.goe(values.get(0)));
        balance.put(FilterOperator.LESS_THAN, values -> entity.balance.lt(values.get(0)));
        balance.put(FilterOperator.LESS_THAN_OR_EQUALS, values -> entity.balance.loe(values.get(0)));
        balance.put(FilterOperator.IN, values -> entity.balance.in(values));
        balance.put(FilterOperator.IS_NULL, values -> entity.balance.isNull());
        balance.put(FilterOperator.IS_NOT_NULL, values -> entity.balance.isNotNull());
        var currency = new LinkedHashMap<FilterOperator, QuerydslFilterFieldDefinition.Operation<String>>();
        currency.put(FilterOperator.EQUALS, values -> entity.currency.eq(values.get(0)));
        currency.put(FilterOperator.NOT_EQUALS, values -> entity.currency.ne(values.get(0)));
        currency.put(FilterOperator.CONTAINS, values -> entity.currency.contains(values.get(0)));
        currency.put(FilterOperator.STARTS_WITH, values -> entity.currency.startsWith(values.get(0)));
        currency.put(FilterOperator.ENDS_WITH, values -> entity.currency.endsWith(values.get(0)));
        currency.put(FilterOperator.IN, values -> entity.currency.in(values));
        currency.put(FilterOperator.IS_NULL, values -> entity.currency.isNull());
        currency.put(FilterOperator.IS_NOT_NULL, values -> entity.currency.isNotNull());
        return QuerydslFilterDefinition.of(List.of(QuerydslFilterFieldDefinition.of("id", UUID.class, id), QuerydslFilterFieldDefinition.of("balance", BigDecimal.class, balance), QuerydslFilterFieldDefinition.of("currency", String.class, currency)));
    }
}
