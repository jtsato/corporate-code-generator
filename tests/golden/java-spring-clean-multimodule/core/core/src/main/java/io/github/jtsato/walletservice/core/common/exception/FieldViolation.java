package io.github.jtsato.walletservice.core.common.exception;

public record FieldViolation(String name, String messageKey, String defaultMessage) {
}
