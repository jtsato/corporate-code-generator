package io.github.jtsato.walletservice.core.common.filter;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import java.util.Optional;

public final class FilterExpression {
    private final FilterGroup root;
    private FilterExpression(FilterGroup root) { this.root = root; }
    public static FilterExpression empty() { return new FilterExpression(null); }
    public static FilterExpression of(FilterGroup root) { if (root == null) throw new ValidationException(List.of(new FieldViolation("root", "common.filter.expression.root.required", "Filter expression root is required."))); return new FilterExpression(root); }
    public boolean hasFilters() { return root != null; }
    public Optional<FilterGroup> root() { return Optional.ofNullable(root); }
}
