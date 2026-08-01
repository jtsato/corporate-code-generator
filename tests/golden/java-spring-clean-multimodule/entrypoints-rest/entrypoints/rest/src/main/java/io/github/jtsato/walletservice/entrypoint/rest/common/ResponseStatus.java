package io.github.jtsato.walletservice.entrypoint.rest.common;

import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Standard response status body")
public record ResponseStatus(@Schema(description = "HTTP response status code") int code, @Schema(description = "Response error message") String message, @Schema(description = "Detailed errors by field") List<Field> fields) {
    public ResponseStatus { fields = List.copyOf(fields); }
    public ResponseStatus(int code, String message) { this(code, message, List.of()); }
    @Schema(description = "Field-level error")
    public record Field(@Schema(description = "Field name") String name, @Schema(description = "Field error message") String message) {}
}
