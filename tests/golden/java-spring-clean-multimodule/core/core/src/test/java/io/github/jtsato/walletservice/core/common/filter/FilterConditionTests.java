package io.github.jtsato.walletservice.core.common.filter;
import static org.junit.jupiter.api.Assertions.*;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.*;
import org.junit.jupiter.api.Test;
class FilterConditionTests {
 @Test void shouldCreateConditions() { assertEquals(List.of("a"), FilterCondition.of("balance", FilterOperator.EQUALS, "a").values()); assertEquals(List.of("a", "b"), FilterCondition.of("id", FilterOperator.IN, List.of("a", "b")).values()); assertTrue(FilterCondition.isNull("x").values().isEmpty()); assertTrue(FilterCondition.isNotNull("x").values().isEmpty()); }
 @Test void shouldValidateConditions() { assertKey("common.filter.field.required", () -> FilterCondition.of(" ", FilterOperator.EQUALS, "x")); assertKey("common.filter.operator.required", () -> FilterCondition.of("x", null, List.of("x"))); assertKey("common.filter.values.required", () -> FilterCondition.of("x", FilterOperator.EQUALS, (List<String>) null)); assertKey("common.filter.values.null-element", () -> FilterCondition.of("x", FilterOperator.IN, Arrays.asList("x", null))); assertKey("common.filter.values.blank", () -> FilterCondition.of("x", FilterOperator.IN, List.of(" "))); assertKey("common.filter.values.not-allowed", () -> FilterCondition.of("x", FilterOperator.IS_NULL, List.of("x"))); assertKey("common.filter.values.single-required", () -> FilterCondition.of("x", FilterOperator.EQUALS, List.of())); assertKey("common.filter.values.at-least-one-required", () -> FilterCondition.of("x", FilterOperator.IN, List.of())); }
 @Test void shouldCopyAndPreserveValues() { var values = new ArrayList<>(List.of("b", "a")); var condition = FilterCondition.of("x", FilterOperator.IN, values); values.clear(); assertEquals(List.of("b", "a"), condition.values()); assertThrows(UnsupportedOperationException.class, () -> condition.values().add("x")); }
 private static void assertKey(String key, org.junit.jupiter.api.function.Executable executable) { assertEquals(key, assertThrows(ValidationException.class, executable).getFields().getFirst().messageKey()); }
}
