package io.github.jtsato.walletservice.entrypoint.rest.common.sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.core.common.paging.SortDirection;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import org.junit.jupiter.api.Test;

class RestSortParserTests {
    private static final RestSortDefinition DEFINITION = RestSortDefinition.of(List.of(
        RestSortFieldDefinition.of("amount", "balance"),
        RestSortFieldDefinition.of("identifier", "id")
    ));

    @Test void shouldReturnEmptyListWhenSortIsNullOrEmpty() {
        assertEquals(List.of(), RestSortParser.parse(null, DEFINITION));
        assertEquals(List.of(), RestSortParser.parse(List.of(), DEFINITION));
    }

    @Test void shouldParseAscendingAndDescendingSorts() {
        assertEquals(List.of("balance"), RestSortParser.parse(List.of("amount:asc"), DEFINITION).stream().map(order -> order.property()).toList());
        assertEquals(SortDirection.ASC, RestSortParser.parse(List.of("amount:asc"), DEFINITION).getFirst().direction());
        assertEquals(SortDirection.DESC, RestSortParser.parse(List.of("identifier:desc"), DEFINITION).getFirst().direction());
    }

    @Test void shouldPreserveRepeatedSortOrder() {
        var orders = RestSortParser.parse(List.of("amount:desc", "identifier:asc"), DEFINITION);
        assertEquals(List.of("balance", "id"), orders.stream().map(order -> order.property()).toList());
        assertEquals(List.of(SortDirection.DESC, SortDirection.ASC), orders.stream().map(order -> order.direction()).toList());
    }

    @Test void shouldRejectInvalidSorts() {
        assertKey(() -> RestSortParser.parse(List.of(), null), "common.rest.sort.definition.required", "definition");
        assertKey(() -> RestSortParser.parse(java.util.Arrays.asList((String) null), DEFINITION), "common.rest.sort.required", "sort");
        assertKey(() -> RestSortParser.parse(List.of(" "), DEFINITION), "common.rest.sort.required", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount"), DEFINITION), "common.rest.sort.format.invalid", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount:desc:extra"), DEFINITION), "common.rest.sort.format.invalid", "sort");
        assertKey(() -> RestSortParser.parse(List.of(":asc"), DEFINITION), "common.rest.sort.format.invalid", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount:"), DEFINITION), "common.rest.sort.format.invalid", "sort");
        assertKey(() -> RestSortParser.parse(List.of("unknown:asc"), DEFINITION), "common.rest.sort.field.unsupported", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount:invalid"), DEFINITION), "common.rest.sort.direction.unsupported", "sort");
        assertKey(() -> RestSortParser.parse(List.of(" amount:asc"), DEFINITION), "common.rest.sort.field.unsupported", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount :asc"), DEFINITION), "common.rest.sort.field.unsupported", "sort");
        assertKey(() -> RestSortParser.parse(List.of("amount: asc"), DEFINITION), "common.rest.sort.direction.unsupported", "sort");
    }

    private static void assertKey(org.junit.jupiter.api.function.Executable executable, String key, String field) {
        var violation = assertThrows(ValidationException.class, executable).getFields().getFirst();
        assertEquals(key, violation.messageKey());
        assertEquals(field, violation.name());
    }
}
