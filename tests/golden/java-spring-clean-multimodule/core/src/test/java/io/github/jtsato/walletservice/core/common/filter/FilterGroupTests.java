package io.github.jtsato.walletservice.core.common.filter;
import static org.junit.jupiter.api.Assertions.*;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.*;
import org.junit.jupiter.api.Test;
class FilterGroupTests {
 @Test void shouldCreateNestedGroups() { var condition = FilterCondition.isNull("x"); var child = FilterGroup.or(List.of(condition)); var group = FilterGroup.of(FilterGroupOperator.AND, List.of(condition), List.of(child)); assertEquals(FilterGroupOperator.AND, group.operator()); assertEquals(List.of(child), group.groups()); }
 @Test void shouldValidateGroups() { assertKey("common.filter.group.operator.required", () -> FilterGroup.of(null, List.of(FilterCondition.isNull("x")), List.of())); assertKey("common.filter.group.conditions.required", () -> FilterGroup.of(FilterGroupOperator.AND, null, List.of())); assertKey("common.filter.group.groups.required", () -> FilterGroup.of(FilterGroupOperator.AND, List.of(), null)); assertKey("common.filter.group.conditions.null-element", () -> FilterGroup.of(FilterGroupOperator.AND, Arrays.asList((FilterCondition) null), List.of())); assertKey("common.filter.group.groups.null-element", () -> FilterGroup.of(FilterGroupOperator.AND, List.of(), Arrays.asList((FilterGroup) null))); assertKey("common.filter.group.empty", () -> FilterGroup.of(FilterGroupOperator.AND, List.of(), List.of())); }
 @Test void shouldCopyLists() { var conditions = new ArrayList<>(List.of(FilterCondition.isNull("x"))); var group = FilterGroup.and(conditions); conditions.clear(); assertEquals(1, group.conditions().size()); assertThrows(UnsupportedOperationException.class, () -> group.conditions().clear()); }
 private static void assertKey(String key, org.junit.jupiter.api.function.Executable executable) { assertEquals(key, assertThrows(ValidationException.class, executable).getFields().getFirst().messageKey()); }
}
