package io.github.jtsato.walletservice.core.domains.wallet.usecase.patch;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.math.BigDecimal;
import java.util.UUID;

public record PatchWalletCommand(
    UUID id,
    BigDecimal balance,
    boolean balanceProvided
) {
    public PatchWalletCommand {
        var fields = new java.util.ArrayList<FieldViolation>();
        if (balanceProvided && balance == null) {
            fields.add(new FieldViolation(
                "balance",
                "wallet.balance.required",
                "Balance is required."
            ));
        }
        if (!balanceProvided) {
            fields.add(new FieldViolation(
                "command",
                "common.patch.field.required",
                "At least one field must be provided."
            ));
        }
        if (id == null) {
            fields.add(new FieldViolation("id", "common.identifier.required", "Identifier is required."));
        }
        if (!fields.isEmpty()) {
            throw new ValidationException(fields);
        }
    }
}
