package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter;

import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterFieldDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterOperator;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class WalletRestFilterDefinitionTests {
    @Test void shouldCreateDefinitionWithExpectedFieldsAndOperators() { var definition = WalletRestFilterDefinition.create(); assertEquals(List.of("id", "balance"), definition.fields().stream().map(RestFilterFieldDefinition::publicName).toList()); assertEquals("id", definition.findField("id").orElseThrow().domainName()); assertEquals(List.of(RestFilterOperator.EQ, RestFilterOperator.NE, RestFilterOperator.IN, RestFilterOperator.IS_NULL, RestFilterOperator.NOT_NULL), definition.findField("id").orElseThrow().supportedOperators()); assertEquals(List.of(RestFilterOperator.EQ, RestFilterOperator.NE, RestFilterOperator.GT, RestFilterOperator.GTE, RestFilterOperator.LT, RestFilterOperator.LTE, RestFilterOperator.IN, RestFilterOperator.IS_NULL, RestFilterOperator.NOT_NULL), definition.findField("balance").orElseThrow().supportedOperators()); }
    @Test void shouldRejectDuplicateFieldsInDefinition() { var field = RestFilterFieldDefinition.of("id", "id", List.of(RestFilterOperator.EQ)); var exception = assertThrows(ValidationException.class, () -> RestFilterDefinition.of(List.of(field, field))); assertEquals("common.rest.filter.definition.fields.duplicate", exception.getFields().getFirst().messageKey()); }
}
