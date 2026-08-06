package io.github.jtsato.walletservice.core.domains.wallet.usecase.delete;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.UUID;

public record DeleteWalletCommand(
    UUID id
) {
    public DeleteWalletCommand {
        var fields = new java.util.ArrayList<FieldViolation>();
        if (id == null) {
            fields.add(new FieldViolation(
                "id",
                "common.identifier.required",
                "Identifier is required."
            ));
        }
        if (!fields.isEmpty()) {
            throw new ValidationException(fields);
        }
    }
}
