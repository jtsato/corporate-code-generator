package io.github.jtsato.walletservice.core.common.paging;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import org.junit.jupiter.api.Test;
class SortOrderTests {
    @Test void shouldCreateSortOrdersUsingFactories() { assertEquals(SortDirection.ASC, SortOrder.asc("name").direction()); assertEquals(SortDirection.DESC, SortOrder.desc("name").direction()); assertEquals("name", SortOrder.of("name", SortDirection.ASC).property()); }
    @Test void shouldRejectBlankProperty() { assertEquals("common.paging.sort.property.required", assertThrows(ValidationException.class, () -> SortOrder.asc(" ")).getFields().getFirst().messageKey()); }
    @Test void shouldRejectNullDirection() { assertEquals("common.paging.sort.direction.required", assertThrows(ValidationException.class, () -> SortOrder.of("name", null)).getFields().getFirst().messageKey()); }
}
