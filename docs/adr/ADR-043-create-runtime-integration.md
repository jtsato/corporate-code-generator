# ADR-043 — Create Runtime Integration

## Context

The `java-spring-clean-multimodule` Golden Path already supports collection
reads, filtered paging, sorting and individual reads through Core, persistence
and REST. The model already contains a persistable `Wallet` entity. At the time
of this decision there was no write-side runtime.

## Decision

Generate `Create<Entity>Command`, `Create<Entity>UseCase` and its interactor in
Core. The command receives the identifier in this milestone. The interactor
constructs the domain entity and delegates to `<Entity>Gateway.create`.

The persistence provider maps the domain entity to its persistence entity,
calls `JpaRepository.save`, and maps the saved entity back to the domain.
Configuration wires the create use case explicitly.

Required command fields use `ValidationException` and stable field keys. The
domain entity continues to validate its own invariants.

Identifier generation remains a future capability. Duplicate identifiers were
left untreated by this milestone and are addressed by ADR-044 before POST.

No REST endpoint, request DTO, OpenAPI operation, transaction policy, update,
delete, optimistic locking or domain event behavior is introduced.

## Consequences

- The generated runtime can create and persist a Wallet without HTTP.
- REST remains read-only and its contract is unchanged.
- Gateway fakes must implement the new `create` method.
- Server-side identifier generation is deferred.
- Duplicate-ID behavior was intentionally deferred to ADR-044.
- The full profile grew from 104 to 109 operations.
