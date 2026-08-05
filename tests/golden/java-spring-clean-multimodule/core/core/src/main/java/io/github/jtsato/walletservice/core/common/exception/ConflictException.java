package io.github.jtsato.walletservice.core.common.exception;

public final class ConflictException extends ApplicationException {
    public ConflictException(String messageKey, String defaultMessage) {
        super(messageKey, defaultMessage);
    }
}
