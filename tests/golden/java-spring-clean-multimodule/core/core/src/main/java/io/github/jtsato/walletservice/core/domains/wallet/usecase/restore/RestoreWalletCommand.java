package io.github.jtsato.walletservice.core.domains.wallet.usecase.restore;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.UUID;

public record RestoreWalletCommand(
    UUID id
) {
    public RestoreWalletCommand {
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
