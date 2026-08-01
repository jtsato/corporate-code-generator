package io.github.jtsato.walletservice.core.domains.wallet.model;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import org.junit.jupiter.api.Test;
class WalletValidationTests {
    @Test void rejectsMissingRequiredFields() {
        ValidationException exception = assertThrows(ValidationException.class, () -> new Wallet(null, null));
        assertEquals(List.of("balance", "id"), exception.getFields().stream().map(field -> field.name()).toList());
        exception.getFields().forEach(field -> { assertFalse(field.name().isBlank()); assertFalse(field.messageKey().isBlank()); assertFalse(field.defaultMessage().isBlank()); });
    }
}
