# ADR-026 — Configuration Profiles and CORS Policy

## Context

The Java multi-module Golden Path needs explicit environment configuration. The reference application had hardcoded CORS origins and unsafe production defaults; Spring Security is not yet part of the path.

## Decision

Generate `application.yaml`, `application-local.yaml`, `application-test.yaml`, and `application-prod.yaml` in `configuration`. No global active profile is configured. Spring tests use `@ActiveProfiles("test")`.

CORS is a default configuration capability. `CorsProperties` binds `application.cors`, and `CorsWebConfiguration` applies it to MVC without hardcoded origins. Production requires `APPLICATION_CORS_ALLOWED_ORIGINS`. The generated configuration uses `allowedOrigins`, rejects credentials with `"*"`, and does not integrate with Security yet.

## Consequences

Environment policy is explicit, tests are deterministic, production has no permissive origin default, and CORS has an isolated Maven smoke. A future `SecurityFilterChain` must reuse this policy. No POM dependency is added.
