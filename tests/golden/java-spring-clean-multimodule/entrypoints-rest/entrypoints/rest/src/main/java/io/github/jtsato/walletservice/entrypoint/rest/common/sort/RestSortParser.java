package io.github.jtsato.walletservice.entrypoint.rest.common.sort;

import io.github.jtsato.walletservice.core.common.paging.SortDirection;
import io.github.jtsato.walletservice.core.common.paging.SortOrder;
import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.List;

public final class RestSortParser {
    private RestSortParser() { }

    public static List<SortOrder> parse(List<String> sort, RestSortDefinition definition) {
        if (definition == null) throw violation("definition", "common.rest.sort.definition.required", "Sort definition is required.");
        if (sort == null || sort.isEmpty()) return List.of();
        var orders = new ArrayList<SortOrder>();
        for (var value : sort) {
            if (value == null || value.isBlank()) throw violation("sort", "common.rest.sort.required", "Sort is required.");
            var segments = value.split(":", -1);
            if (segments.length != 2 || segments[0].isBlank() || segments[1].isBlank()) throw violation("sort", "common.rest.sort.format.invalid", "Sort format is invalid.");
            var field = definition.findField(segments[0]).orElseThrow(() -> violation("sort", "common.rest.sort.field.unsupported", "Unsupported sort field."));
            var direction = switch (segments[1]) {
                case "asc" -> SortDirection.ASC;
                case "desc" -> SortDirection.DESC;
                default -> throw violation("sort", "common.rest.sort.direction.unsupported", "Unsupported sort direction.");
            };
            orders.add(SortOrder.of(field.domainName(), direction));
        }
        return List.copyOf(orders);
    }

    private static ValidationException violation(String field, String key, String message) { return new ValidationException(List.of(new FieldViolation(field, key, message))); }
}
