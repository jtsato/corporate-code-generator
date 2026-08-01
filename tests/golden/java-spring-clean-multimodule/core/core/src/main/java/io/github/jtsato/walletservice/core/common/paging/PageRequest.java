package io.github.jtsato.walletservice.core.common.paging;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;

public record PageRequest(int page, int size, List<SortOrder> sort) {
    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;
    public PageRequest {
        sort = sort == null ? List.of() : sort;
        var fields = new java.util.ArrayList<FieldViolation>();
        if (page < 0) fields.add(new FieldViolation("page", "common.paging.page.invalid", "Page index must be greater than or equal to zero."));
        if (size < 1) fields.add(new FieldViolation("size", "common.paging.size.invalid", "Page size must be greater than zero."));
        if (size > MAX_SIZE) fields.add(new FieldViolation("size", "common.paging.size.too-large", "Page size must be less than or equal to 100."));
        if (sort.stream().anyMatch(java.util.Objects::isNull)) fields.add(new FieldViolation("sort", "common.paging.sort.invalid", "Sort orders must not contain null values."));
        fields.sort(java.util.Comparator.comparing(FieldViolation::name));
        if (!fields.isEmpty()) throw new ValidationException(fields);
        sort = List.copyOf(sort);
    }
    public static PageRequest defaultPage() { return new PageRequest(DEFAULT_PAGE, DEFAULT_SIZE, List.of()); }
    public static PageRequest of(int page, int size) { return new PageRequest(page, size, List.of()); }
    public static PageRequest of(int page, int size, List<SortOrder> sort) { return new PageRequest(page, size, sort); }
}
