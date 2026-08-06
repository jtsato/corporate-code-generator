package io.github.jtsato.walletservice.entrypoint.rest.common.filter;

import io.github.jtsato.walletservice.core.common.filter.FilterCondition;
import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.filter.FilterGroup;
import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.List;

public final class RestFilterParser {
    private RestFilterParser() { }
    public static FilterExpression parse(List<String> filters, RestFilterDefinition definition) {
        if (definition == null) throw violation("definition", "common.rest.filter.definition.required", "Filter definition is required.");
        if (filters == null || filters.isEmpty()) return FilterExpression.empty();
        var conditions = new ArrayList<FilterCondition>(); for (var filter : filters) conditions.add(parseCondition(filter, definition)); return FilterExpression.of(FilterGroup.and(conditions));
    }
    private static FilterCondition parseCondition(String filter, RestFilterDefinition definition) {
        if (filter == null || filter.isBlank()) throw violation("filter", "common.rest.filter.required", "Filter is required.");
        var segments = filter.split(":", -1); if (segments.length < 2 || segments.length > 3 || segments[0].isBlank() || segments[1].isBlank()) throw violation("filter", "common.rest.filter.format.invalid", "Filter format is invalid.");
        var field = definition.findField(segments[0]).orElseThrow(() -> violation("filter", "common.rest.filter.field.unsupported", "Unsupported filter field."));
        var operator = RestFilterOperator.fromAlias(segments[1]).orElseThrow(() -> violation("filter", "common.rest.filter.operator.unsupported", "Unsupported filter operator."));
        if (!field.supportedOperators().contains(operator)) throw violation("filter", "common.rest.filter.operator.not-allowed", "Filter operator is not allowed for this field.");
        var nullOperator = operator == RestFilterOperator.IS_NULL || operator == RestFilterOperator.NOT_NULL;
        if (nullOperator && segments.length == 3) throw violation("filter", "common.rest.filter.value.not-allowed", "Filter value is not allowed for this operator.");
        if (!nullOperator && segments.length == 2) throw violation("filter", "common.rest.filter.value.required", "Filter value is required.");
        if (nullOperator) return new FilterCondition(field.domainName(), operator.toCoreOperator(), List.of());
        if (operator == RestFilterOperator.IN) { var values = new ArrayList<String>(); for (var value : segments[2].split(",", -1)) { var trimmed = value.trim(); if (trimmed.isEmpty()) throw violation("filter", "common.rest.filter.values.blank", "Filter values must not contain blank elements."); values.add(trimmed); } return FilterCondition.of(field.domainName(), operator.toCoreOperator(), values); }
        var value = segments[2].trim(); if (value.isEmpty()) throw violation("filter", "common.rest.filter.value.blank", "Filter value must not be blank."); return FilterCondition.of(field.domainName(), operator.toCoreOperator(), value);
    }
    private static ValidationException violation(String field, String key, String message) { return new ValidationException(List.of(new FieldViolation(field, key, message))); }
}
