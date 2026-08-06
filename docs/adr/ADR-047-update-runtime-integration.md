# ADR-047 — Update Runtime Integration

## Status

Accepted.

## Context

The `java-spring-clean-multimodule` Golden Path already provides collection
reads, filtered paging, sorting, `GET /<entities>/{id}`, a Core/JPA create
runtime with duplicate-ID conflict detection, and `POST /<entities>` over
REST. It did not provide any way to update an existing resource.

## Decision

Add `Update<Entity>Command`, `Update<Entity>UseCase`, and
`Update<Entity>UseCaseInteractor` to Core, mirroring the create runtime's
structure and validation style. `<Entity>Gateway` gains
`update(<Entity> entity)`. `<Entity>GatewayProvider` checks
`repository.existsById(entity.getId())` before `repository.save(...)`: when
the identifier is absent it throws `NotFoundException` with the existing
`<domain>.not-found` message key — the same key already used by
`findById` — instead of a new update-specific key, since the underlying
semantic (resource does not exist) is identical. When the identifier is
present, the record is saved and the updated domain entity is returned.

Update never creates a new row for a missing ID and never changes the
identifier. Because `Wallet` is immutable, the interactor builds a new
`Wallet` from the command rather than mutating one in place.

`PUT /<entities>/{id}` and `PATCH /<entities>/{id}` remain future
capabilities; this milestone only wires the runtime and persistence path.

## Consequences

- A Core/JPA update runtime now exists and is exercised by
  `WalletUpdatePersistenceTests` and `UpdateWalletUseCaseInteractorTests`.
- REST still does not expose update; no HTTP request/response DTOs or
  OpenAPI documentation were added.
- The five inline fake gateways used by existing Core interactor tests
  (create, find-by-id, find-page, find-by-filter, find-by-filter-page) were
  updated to implement `update(...)` as a `return null;` stub so they keep
  compiling against the wider `<Entity>Gateway` interface.
- The `existsById` plus `save` sequence remains non-atomic under
  concurrency, matching the same known limitation already accepted for
  create.
- `existsById` plus `save` is sufficient for `Wallet`, which has no fields
  that must be preserved across an update besides the identifier. Future
  domains with server-managed, non-command fields (for example
  `createdAt`) will likely need `findById` plus a partial merge instead of
  a blind `save`, since a full overwrite would clobber those fields.
- The full Wallet profile grows from 112 to 117 generated artifacts (Core
  from 42 to 46, Configuration from 112 to 117).
