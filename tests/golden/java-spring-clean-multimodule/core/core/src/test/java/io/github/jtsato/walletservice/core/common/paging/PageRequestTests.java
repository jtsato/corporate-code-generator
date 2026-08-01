package io.github.jtsato.walletservice.core.common.paging;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
class PageRequestTests {
    @Test void shouldCreateDefaultAndSortedRequests() { assertEquals(20, PageRequest.defaultPage().size()); assertEquals(List.of(), PageRequest.of(1, 50).sort()); assertEquals(List.of(SortOrder.asc("name")), PageRequest.of(0, 20, List.of(SortOrder.asc("name"))).sort()); assertEquals(List.of(), PageRequest.of(0, 20, null).sort()); }
    @Test void shouldRejectInvalidRequestMetadata() { assertKey("common.paging.page.invalid", () -> PageRequest.of(-1, 20)); assertKey("common.paging.size.invalid", () -> PageRequest.of(0, 0)); assertKey("common.paging.size.too-large", () -> PageRequest.of(0, 101)); assertKey("common.paging.sort.invalid", () -> PageRequest.of(0, 20, java.util.Arrays.asList(SortOrder.asc("name"), null))); }
    @Test void shouldCopySortOrdersDefensively() { var sort = new ArrayList<>(List.of(SortOrder.asc("name"))); var request = PageRequest.of(0, 20, sort); sort.clear(); assertEquals(1, request.sort().size()); assertThrows(UnsupportedOperationException.class, () -> request.sort().add(SortOrder.desc("name"))); }
    private static void assertKey(String key, org.junit.jupiter.api.function.Executable executable) { assertEquals(key, assertThrows(ValidationException.class, executable).getFields().getFirst().messageKey()); }
}
