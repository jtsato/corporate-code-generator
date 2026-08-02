package io.github.jtsato.walletservice.entrypoint.rest.common.filter;

import io.github.jtsato.walletservice.core.common.filter.FilterOperator;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class RestFilterParserTests {
    private static final RestFilterDefinition DEFINITION = RestFilterDefinition.of(List.of(RestFilterFieldDefinition.of("amount", "balance", List.of(RestFilterOperator.EQ, RestFilterOperator.GTE, RestFilterOperator.IN, RestFilterOperator.IS_NULL, RestFilterOperator.NOT_NULL))));
    @Test void shouldReturnEmptyExpressionWhenFiltersAreNull() { assertFalse(RestFilterParser.parse(null, DEFINITION).hasFilters()); }
    @Test void shouldReturnEmptyExpressionWhenFiltersAreEmpty() { assertFalse(RestFilterParser.parse(List.of(), DEFINITION).hasFilters()); }
    @Test void shouldRejectNullDefinition() { assertKey(() -> RestFilterParser.parse(List.of(), null), "common.rest.filter.definition.required", "definition"); }
    @Test void shouldParseFilters() { var root = RestFilterParser.parse(List.of("amount:eq: 10 ", "amount:gte:2"), DEFINITION).root().orElseThrow(); assertEquals("AND", root.operator().name()); assertEquals("balance", root.conditions().getFirst().field()); assertEquals(FilterOperator.EQUALS, root.conditions().getFirst().operator()); assertEquals(List.of("10"), root.conditions().getFirst().values()); assertEquals(List.of("10", "2"), root.conditions().stream().map(c -> c.values().getFirst()).toList()); }
    @Test void shouldParseInAndNullFilters() { assertEquals(List.of("a", "a", "b"), root("amount:in: a,a,b ").conditions().getFirst().values()); assertEquals(FilterOperator.IS_NULL, root("amount:isnull").conditions().getFirst().operator()); assertEquals(FilterOperator.IS_NOT_NULL, root("amount:notnull").conditions().getFirst().operator()); }
    @Test void shouldRejectInvalidFilters() { assertKey(() -> root(" "), "common.rest.filter.required", "filter"); assertKey(() -> root("amount"), "common.rest.filter.format.invalid", "filter"); assertKey(() -> root("amount:eq:1:x"), "common.rest.filter.format.invalid", "filter"); assertKey(() -> root("other:eq:1"), "common.rest.filter.field.unsupported", "filter"); assertKey(() -> root("amount:EQ:1"), "common.rest.filter.operator.unsupported", "filter"); assertKey(() -> root("amount:gte"), "common.rest.filter.value.required", "filter"); assertKey(() -> root("amount:isnull:x"), "common.rest.filter.value.not-allowed", "filter"); assertKey(() -> root("amount:eq: "), "common.rest.filter.value.blank", "filter"); assertKey(() -> root("amount:in:a,,b"), "common.rest.filter.values.blank", "filter"); }
    private static io.github.jtsato.walletservice.core.common.filter.FilterGroup root(String filter) { return RestFilterParser.parse(List.of(filter), DEFINITION).root().orElseThrow(); }
    private static void assertKey(org.junit.jupiter.api.function.Executable executable, String key, String field) { var exception = assertThrows(ValidationException.class, executable); assertEquals(key, exception.getFields().getFirst().messageKey()); assertEquals(field, exception.getFields().getFirst().name()); }
}
