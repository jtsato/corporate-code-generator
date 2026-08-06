package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortFieldDefinition;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import org.junit.jupiter.api.Test;

class WalletRestSortDefinitionTests {
    @Test void shouldCreateDefinitionWithExpectedFields() {
        var definition = WalletRestSortDefinition.create();
        assertEquals(List.of("id", "balance", "currency"), definition.fields().stream().map(RestSortFieldDefinition::publicName).toList());
        assertEquals("id", definition.findField("id").orElseThrow().domainName());
        assertEquals("balance", definition.findField("balance").orElseThrow().domainName());
        assertEquals("currency", definition.findField("currency").orElseThrow().domainName());
    }

    @Test void shouldRejectDuplicateFieldsInDefinition() {
        var field = RestSortFieldDefinition.of("duplicate", "duplicate");
        var exception = assertThrows(ValidationException.class, () -> RestSortDefinition.of(List.of(field, field)));
        assertEquals("common.rest.sort.definition.fields.duplicate", exception.getFields().getFirst().messageKey());
    }
}
