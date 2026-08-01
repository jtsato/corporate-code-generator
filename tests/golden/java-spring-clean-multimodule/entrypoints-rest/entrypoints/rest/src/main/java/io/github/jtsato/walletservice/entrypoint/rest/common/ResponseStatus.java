package io.github.jtsato.walletservice.entrypoint.rest.common;

import java.util.List;

public record ResponseStatus(int code, String message, List<Field> fields) {
    public ResponseStatus { fields = List.copyOf(fields); }
    public ResponseStatus(int code, String message) { this(code, message, List.of()); }
    public record Field(String name, String message) {}
}
