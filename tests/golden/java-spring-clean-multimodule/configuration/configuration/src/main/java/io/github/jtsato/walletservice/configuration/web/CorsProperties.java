package io.github.jtsato.walletservice.configuration.web;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "application.cors")
public record CorsProperties(
    List<String> allowedOrigins,
    List<String> allowedMethods,
    List<String> allowedHeaders,
    List<String> exposedHeaders,
    boolean allowCredentials,
    long maxAge
) {
    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        allowedMethods = allowedMethods == null ? List.of() : List.copyOf(allowedMethods);
        allowedHeaders = allowedHeaders == null ? List.of() : List.copyOf(allowedHeaders);
        exposedHeaders = exposedHeaders == null ? List.of() : List.copyOf(exposedHeaders);
        if (allowCredentials && allowedOrigins.contains("*")) {
            throw new IllegalArgumentException(
                "CORS allowCredentials cannot be true when allowedOrigins contains '*'."
            );
        }
    }
}
