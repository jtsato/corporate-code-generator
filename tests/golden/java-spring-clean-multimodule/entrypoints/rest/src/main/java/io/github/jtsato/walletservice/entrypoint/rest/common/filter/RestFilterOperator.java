package io.github.jtsato.walletservice.entrypoint.rest.common.filter;

import io.github.jtsato.walletservice.core.common.filter.FilterOperator;
import java.util.Optional;

public enum RestFilterOperator {
    EQ("eq", FilterOperator.EQUALS), NE("ne", FilterOperator.NOT_EQUALS), GT("gt", FilterOperator.GREATER_THAN), GTE("gte", FilterOperator.GREATER_THAN_OR_EQUALS), LT("lt", FilterOperator.LESS_THAN), LTE("lte", FilterOperator.LESS_THAN_OR_EQUALS), CONTAINS("contains", FilterOperator.CONTAINS), STARTS("starts", FilterOperator.STARTS_WITH), ENDS("ends", FilterOperator.ENDS_WITH), IN("in", FilterOperator.IN), IS_NULL("isnull", FilterOperator.IS_NULL), NOT_NULL("notnull", FilterOperator.IS_NOT_NULL);
    private final String alias; private final FilterOperator coreOperator;
    RestFilterOperator(String alias, FilterOperator coreOperator) { this.alias = alias; this.coreOperator = coreOperator; }
    public String alias() { return alias; }
    public FilterOperator toCoreOperator() { return coreOperator; }
    public static Optional<RestFilterOperator> fromAlias(String alias) { for (var operator : values()) if (operator.alias.equals(alias)) return Optional.of(operator); return Optional.empty(); }
}
