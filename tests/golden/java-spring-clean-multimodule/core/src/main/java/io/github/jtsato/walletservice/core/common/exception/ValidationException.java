package io.github.jtsato.walletservice.core.common.exception;

import java.util.List;

public final class ValidationException extends ApplicationException {
    private final List<FieldViolation> fields;

    public ValidationException(String messageKey, String defaultMessage, List<FieldViolation> fields) {
        super(messageKey, defaultMessage);
        this.fields = List.copyOf(fields);
    }

    public ValidationException(List<FieldViolation> fields) { this("common.error.invalid-request", "Invalid request.", fields); }

    public List<FieldViolation> getFields() { return fields; }
}
