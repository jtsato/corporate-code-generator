package io.github.jtsato.walletservice.core.domains.wallet.usecase.update;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateWalletCommand(
    UUID id,
    BigDecimal balance
) {
    public UpdateWalletCommand {
        var fields = new java.util.ArrayList<FieldViolation>();
        if (id == null) {
            fields.add(new FieldViolation(
                "id",
                "common.identifier.required",
                "Identifier is required."
            ));
        }
        if (balance == null) {
            fields.add(new FieldViolation(
                "balance",
                "wallet.balance.required",
                "Balance is required."
            ));
        }
        if (!fields.isEmpty()) {
            throw new ValidationException(fields);
        }
    }
}
