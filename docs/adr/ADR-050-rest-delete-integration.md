# ADR-050 — REST Delete Integration

## Status

Accepted — Milestone 6.29.

## Context

Milestone 6.28 delivered the Core/JPA delete runtime (ADR-049) with no HTTP
exposure: no DELETE controller mapping, REST DTO, OpenAPI operation, or HTTP
test was generated. The Golden Path needs the final REST vertical slice —
physical delete reachable over HTTP — without reopening ADR-049's
delete-runtime semantics.

## Decision

Expose only `DELETE /<entities>/{id}`. The generated controller receives the
typed path identifier, constructs `Delete<Entity>Command(id)` inline, and
delegates to `Delete<Entity>UseCase.execute(...)`, returning HTTP 204 with an
empty body. There is no request DTO, because an empty body has no
representation.

Missing identifiers map to HTTP 404 through the existing global exception
handler and `ResponseStatus`, because `WalletGatewayProvider.deleteById`
(ADR-049) throws `NotFoundException` when the identifier does not exist.
Malformed path identifiers map to HTTP 400. Unexpected failures remain HTTP
500. No new message keys are introduced; the existing `wallet.not-found` and
`common.error.invalid-request` keys are reused.

The configuration module generates a real HTTP integration test using
`@SpringBootTest(RANDOM_PORT)`, the test profile, H2, the repository, and the
JDK `HttpClient`. The OpenAPI smoke test documents the DELETE operation and
its 204/400/404/500 responses.

## Scope boundary

Delete is **not** idempotent: a repeated `DELETE` on an already-deleted or
never-existing identifier returns 404, because ADR-049 maps a missing
identifier to `NotFoundException` rather than treating deletion as a
no-op. This is a deliberate consequence of reusing the accepted delete
runtime, not a defect.

Soft delete, cascade delete, bulk/collection delete, idempotent delete
(204 on missing id), 409-on-delete, PATCH, ETags, conditional requests, and
optimistic locking are explicitly out of scope. `WalletGatewayProvider`,
`Delete*Command/UseCase/Interactor`, `WalletGateway`, the JPA entity,
repository, schema, and POM contracts are unchanged. `GlobalExceptionHandler`,
`ResponseStatus`, message bundles, CORS, Swagger UI policy, and ArchUnit
rules are unchanged. The single-module `java-spring-clean` profile does not
receive REST delete.

## Consequences

- The full multi-module profile grows from 124 to 125 artifacts: one
  configuration HTTP integration test.
- The entrypoints-rest producer remains 19 direct artifacts; the controller
  gains one operation and one constructor dependency without a new artifact.
- Core, Infra, wiring, the error handler, and message bundles are unchanged.
- Existing GET, POST, PUT, filtering, paging, and sorting behavior remains
  unchanged.
