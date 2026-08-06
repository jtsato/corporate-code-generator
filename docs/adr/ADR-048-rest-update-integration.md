# ADR-048 — REST Update Integration

## Status

Accepted.

## Context

Milestone 6.26 added the deterministic Core/JPA update runtime, but the
generated REST surface still exposed only reads and create. The Golden Path
needs one complete HTTP update vertical slice without reopening the existing
update runtime or introducing partial-update semantics.

## Decision

Expose only `PUT /<entities>/{id}` as a full replacement update operation.
The generated controller receives the UUID path identifier and an
`Update<Entity>Request` body, converts the body with `toCommand(id)`, delegates
to `Update<Entity>UseCase.execute(...)`, and returns the updated
`<Entity>Response` directly with HTTP 200. The request record excludes the
identifier; validation remains in the existing Core command.

Existing identifiers update H2 and are observable through a subsequent GET.
Missing identifiers map to HTTP 404. Invalid JSON, null or invalid request
bodies, missing required update values, and malformed UUID path values map to
HTTP 400. Unexpected failures remain HTTP 500 through the existing global
handler.

The configuration module generates a real HTTP integration test using
`@SpringBootTest(RANDOM_PORT)`, the test profile, H2, the repository, and the
JDK `HttpClient`. The OpenAPI smoke test documents the PUT path, UUID path
parameter, update request schema without `id`, the 200 response reusing the
item response schema, and the 400/404/500 responses.

## Consequences

- The full profile grows from 117 to 119 artifacts: one REST request DTO and
  one configuration HTTP integration test.
- The entrypoints-rest producer grows from 18 to 19 direct artifacts, while
  the configuration selection grows to 119 artifacts transitively.
- Existing GET, POST, filtering, paging, sorting, create `Location`, Core,
  Infra, and update runtime behavior remain unchanged.
- PATCH, DELETE, partial/merge/JSON patch, optimistic locking, ETags,
  conditional requests, and 204/409 update responses are explicitly out of
  scope.
