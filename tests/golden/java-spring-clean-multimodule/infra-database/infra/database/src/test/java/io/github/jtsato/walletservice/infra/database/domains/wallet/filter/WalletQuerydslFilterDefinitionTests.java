package io.github.jtsato.walletservice.infra.database.domains.wallet.filter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import java.util.UUID;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class WalletQuerydslFilterDefinitionTests {
    @Test void shouldCreateDefinition() {
        var definition = WalletQuerydslFilterDefinition.create();
        assertEquals(UUID.class, definition.findField("id").orElseThrow().valueType());
        assertEquals(BigDecimal.class, definition.findField("balance").orElseThrow().valueType());
    }
}
