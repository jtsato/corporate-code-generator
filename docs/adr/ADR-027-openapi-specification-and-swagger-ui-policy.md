# ADR-027 — OpenAPI Specification and Swagger UI Policy

## Context

OpenAPI is a default Golden Path capability. Swagger UI needs environment gating, Security does not yet exist, and `ResponseStatus` is the standard REST error contract.

## Decision

Use Springdoc `3.0.3` through `springdoc-openapi-starter-webmvc-ui` in `entrypoints-rest`; the version is centralized in the parent POM. `OpenApiConfiguration` lives in `configuration`. `/v3/api-docs` is enabled by default. Swagger UI is disabled in base and production by default and enabled in local/test. REST annotations document the existing `200` and `500` responses and `ResponseStatus`. No Security schemes are created.

## Consequences

Generated APIs expose an initial OpenAPI contract while production does not expose Swagger UI by default. The dedicated Maven smoke validates Springdoc compatibility with Spring Boot 4.1.0. Security integration remains a future milestone.
