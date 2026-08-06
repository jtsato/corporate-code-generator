package io.github.jtsato.walletservice.core.common.paging;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;

public record SortOrder(String property, SortDirection direction) {
    public SortOrder {
        var fields = new java.util.ArrayList<FieldViolation>();
        if (property == null || property.isBlank()) fields.add(new FieldViolation("property", "common.paging.sort.property.required", "Sort property is required."));
        if (direction == null) fields.add(new FieldViolation("direction", "common.paging.sort.direction.required", "Sort direction is required."));
        fields.sort(java.util.Comparator.comparing(FieldViolation::name));
        if (!fields.isEmpty()) throw new ValidationException(fields);
    }
    public static SortOrder asc(String property) { return new SortOrder(property, SortDirection.ASC); }
    public static SortOrder desc(String property) { return new SortOrder(property, SortDirection.DESC); }
    public static SortOrder of(String property, SortDirection direction) { return new SortOrder(property, direction); }
}
