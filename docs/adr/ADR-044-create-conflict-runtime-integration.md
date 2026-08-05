# ADR-044 — Create Conflict Runtime Integration

## Context

The generated create runtime accepts an identifier from
`Create<Entity>Command` and reaches `JpaRepository.save`. Spring Data `save`
may merge an existing identifier, so the 6.21 create path could behave as an
upsert. REST and OpenAPI do not expose create yet.

## Decision

Generate a technology-neutral `ConflictException` in Core. It extends the
existing `ApplicationException` and carries a message key and default message.

The persistence provider checks `repository.existsById(identifier)` before
mapping and saving. An existing identifier raises the entity-scoped key
`<entity>.already-exists`; a new identifier follows the existing mapper/save/
mapper flow. `WalletGateway.create(Wallet)` remains unchanged.

For Wallet, the conflict is `wallet.already-exists` with default message
`Wallet already exists.`. The existing message bundles provide the English and
Portuguese text.

`GlobalExceptionHandler` is not changed in this milestone. HTTP 409 mapping
belongs to the future REST Create milestone, because no endpoint currently
invokes the create runtime.

## Consequences

- Create no longer behaves as an upsert in the normal runtime path.
- The original record is not overwritten when the pre-check finds its ID.
- The Core remains Spring-free, JPA-free and REST-free.
- The database primary key remains the physical duplicate barrier.
- `existsById` followed by `save` is not atomic under concurrency:
  two callers can both observe absence before either saves.
- Locking, advanced transactions, retry and `DataIntegrityViolationException`
  translation remain future work.
- The full profile grows from 109 to 110 artifacts.

## Future evolution

Milestone 6.23 is expected to add REST Create Integration: POST, request DTO,
HTTP 201, `Location`, OpenAPI documentation and `ConflictException` to HTTP
409 translation.
