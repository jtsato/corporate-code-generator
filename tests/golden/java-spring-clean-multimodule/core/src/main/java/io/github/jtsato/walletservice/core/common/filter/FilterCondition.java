package io.github.jtsato.walletservice.core.common.filter;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record FilterCondition(String field, FilterOperator operator, List<String> values) {
    public FilterCondition { var fields = new ArrayList<FieldViolation>(); if (field == null || field.isBlank()) fields.add(new FieldViolation("field", "common.filter.field.required", "Filter field is required.")); if (operator == null) fields.add(new FieldViolation("operator", "common.filter.operator.required", "Filter operator is required.")); if (values == null) fields.add(new FieldViolation("values", "common.filter.values.required", "Filter values are required.")); else { if (values.stream().anyMatch(java.util.Objects::isNull)) fields.add(new FieldViolation("values", "common.filter.values.null-element", "Filter values must not contain null elements.")); else if (values.stream().anyMatch(String::isBlank)) fields.add(new FieldViolation("values", "common.filter.values.blank", "Filter values must not contain blank elements.")); if (operator != null) { if ((operator == FilterOperator.IS_NULL || operator == FilterOperator.IS_NOT_NULL) && !values.isEmpty()) fields.add(new FieldViolation("values", "common.filter.values.not-allowed", "Filter values are not allowed for this operator.")); else if (operator == FilterOperator.IN && values.isEmpty()) fields.add(new FieldViolation("values", "common.filter.values.at-least-one-required", "Filter operator requires at least one value.")); else if (operator != FilterOperator.IN && operator != FilterOperator.IS_NULL && operator != FilterOperator.IS_NOT_NULL && values.size() != 1) fields.add(new FieldViolation("values", "common.filter.values.single-required", "Filter operator requires exactly one value.")); } } if (!fields.isEmpty()) throw new ValidationException(fields); values = List.copyOf(values); }
    public static FilterCondition of(String field, FilterOperator operator, String value) { return of(field, operator, Collections.singletonList(value)); }
    public static FilterCondition of(String field, FilterOperator operator, List<String> values) { return new FilterCondition(field, operator, values); }
    public static FilterCondition isNull(String field) { return new FilterCondition(field, FilterOperator.IS_NULL, List.of()); }
    public static FilterCondition isNotNull(String field) { return new FilterCondition(field, FilterOperator.IS_NOT_NULL, List.of()); }
}
