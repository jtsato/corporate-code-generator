package io.github.jtsato.walletservice.core.common.exception;

public abstract class ApplicationException extends RuntimeException {
    private final String messageKey;
    private final String defaultMessage;

    protected ApplicationException(String messageKey, String defaultMessage) {
        super(defaultMessage);
        this.messageKey = messageKey;
        this.defaultMessage = defaultMessage;
    }

    public String getMessageKey() { return messageKey; }
    public String getDefaultMessage() { return defaultMessage; }
}
