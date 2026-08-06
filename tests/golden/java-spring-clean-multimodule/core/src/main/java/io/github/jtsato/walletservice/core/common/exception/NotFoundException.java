package io.github.jtsato.walletservice.core.common.exception;

public final class NotFoundException extends ApplicationException {
    public NotFoundException(String messageKey, String defaultMessage) {
        super(messageKey, defaultMessage);
    }
}
