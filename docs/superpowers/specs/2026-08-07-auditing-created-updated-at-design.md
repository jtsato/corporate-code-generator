# Auditing (createdAt/updatedAt) Design

## Goal

Add an opt-in auditing capability to the `java-spring-clean-multimodule` profile: per-entity `createdAt` and `updatedAt` timestamps, automatically managed by generated runtime code and exposed read-only over REST. Entities that do not opt in are unaffected.

## Scope

- New per-entity model flag `audited: boolean` (default `false`), already added to the schema, `Entity`, `ApplicationModelDocument`, and `ModelParser` ahead of this design.
- When `audited: true`, the generator produces `createdAt` and `updatedAt` (`java.time.LocalDateTime`) for that entity's Core model, tombstone view, persistence entity, and REST responses.
- Applies only to the `java-spring-clean-multimodule` profile. The single-module profile is unchanged, consistent with milestones 6.32–6.34.
- Out of scope: `createdBy`/`updatedBy` (no identity/authentication source exists yet), filtering or sorting by audit fields, database indexes on the new columns, and any change to the single-module profile.

## Reference precedent

Two prior Java Clean Architecture projects by the same author establish the pattern this design follows, most directly `wallet-service-java` (`C:\Dev\77-challenge\wallet-service-java`):

- `createdAt`/`updatedAt` as `LocalDateTime` fields on the Core domain model itself (not infra-only), exposed directly in the REST response.
- A small Core-owned time port, `GetLocalDateTime` (`now(): LocalDateTime`), backed by an implementation using `java.time.Clock`. Because it depends only on the JDK, the implementation lives in Core without violating the Core's Spring/JPA-free boundary, and interactors become deterministically testable via an injected clock instead of calling `LocalDateTime.now()` inline.
- On create, both timestamps are set to `now()`.
- On update, the Core passes `createdAt = null` and only sets `updatedAt = now()`; the infra persistence provider is the one that preserves `createdAt` — it loads the existing row by id and mutates only the fields that actually change (never touching `createdAt`), rather than constructing and saving a brand-new entity from scratch.

## Architecture

### Core

- `Wallet` (and the equivalent generated model for any audited entity) gains two additional final fields, `createdAt` and `updatedAt`, following the existing plain-class-with-constructor-and-getters style (no records, no Lombok, matching the current generated Core style). Unlike `balance`, these are **not** annotated `@NotNull`: `Wallet` extends `SelfValidating<Wallet>` and validates on every construction, including the internal command-construction inside `UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor`, which must be able to pass `createdAt = null` before persistence (see below). `@NotNull` on these fields would make every update/patch throw a validation exception before the infra layer gets a chance to preserve the real value. This mirrors `WalletTombstone`, which already carries system-managed fields (`deletedAt`) with no self-validation at all.
- New port `GetLocalDateTime` under `core/common/time/`, with `GetLocalDateTimeImpl` implementing it via `LocalDateTime.now(Clock.systemDefaultZone())`, generated in the same package. This groups with the existing `core/common/{exception,filter,paging,validation}` subpackage convention.
- `CreateWalletUseCaseInteractor` gains a `GetLocalDateTime` constructor dependency and sets `createdAt = updatedAt = getLocalDateTime.now()` when constructing the new `Wallet`.
- `UpdateWalletUseCaseInteractor` and `PatchWalletUseCaseInteractor` gain the same dependency; both construct their `Wallet` with `createdAt = null` and `updatedAt = getLocalDateTime.now()`. Preservation of the real `createdAt` value is entirely the infra provider's responsibility (see below) — Core never re-fetches or threads the old value through.
- `RestoreWalletUseCaseInteractor` is unaffected; restore only flips deletion state and does not touch audit timestamps.
- `WalletTombstone` (the Core read view for soft-deleted records) gains `createdAt`/`updatedAt` alongside the existing `deletedAt`, populated straight from the persisted row on read.

### Infra

- `WalletEntity` gains `createdAt` and `updatedAt` columns (`@Column(nullable = false)`), as plain mutable fields with getters/setters, matching the existing style of `deletedAt`. No new database indexes.
- `WalletPersistenceMapper` maps both fields in both directions (`toEntity`, `toDomain`, `toTombstone`).
- `WalletGatewayProvider.create()` maps a new entity carrying the Core-supplied `createdAt`/`updatedAt` and saves it; no preservation concern for a new row.
- `WalletGatewayProvider.update()` changes from constructing-and-saving a brand-new mapped entity to: load the existing entity by id (it already does this today to check not-found/active, but currently discards the result), mutate only the fields that legitimately change (`balance`, `updatedAt`) on that loaded instance, and save the same instance. `createdAt` is never reassigned, so it survives untouched. `PatchWalletUseCaseInteractor` delegates to the same `update()` gateway method and benefits automatically.

### REST

- `WalletResponse` and `WalletTombstoneResponse` gain read-only `createdAt`/`updatedAt` fields. No create/update/patch request DTO accepts them; if a client sends them, they are ignored (not bound into any command).
- OpenAPI/Swagger schema descriptions are added for the two new response fields, matching the existing `@Schema(description = "...")` style.

### Configuration

- `WalletConfiguration` (generated per ADR-015 explicit wiring) gains a `@Bean GetLocalDateTime` provider and threads it into the `createWalletUseCase`, `updateWalletUseCase`, and `patchWalletUseCase` bean methods. This wiring, and all of the above, is generated only when the entity declares `audited: true`.

## Testing

- `ModelParser`/`SchemaValidator` tests already cover parsing the `audited` flag (from the change that preceded this design); no new semantic validation rules are needed since the flag has no cross-field constraints.
- New Core unit tests: `GetLocalDateTimeImpl` (mirrors the reference project's clock test), `CreateWalletUseCaseInteractor` (verifies both timestamps come from the injected clock), `UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor` (verify `updatedAt` comes from the clock and `createdAt` is not asserted/threaded by Core).
- New generated persistence tests verify that an update preserves the original `createdAt` while advancing `updatedAt`.
- New generated HTTP tests verify create/update/patch responses include non-null `createdAt`/`updatedAt`, and that the deleted-query/tombstone response includes them alongside `deletedAt`.
- OpenAPI smoke test coverage is extended for the new response schema properties.
- Following the discipline established in milestone 6.34, `examples/wallet-service` and its golden files are not modified — `audited` remains unset (defaults to `false`), so the existing golden byte-comparison keeps proving non-regression. A separate example (new or reusing `examples/composite-unique-service`) declares `audited: true` and is validated with a real Maven build, generated to a scratch output directory, as new-capability evidence rather than golden-covered evidence.
- Full TypeScript, generation, Java smoke, Maven reactor, coverage, and single-module regression gates remain required.
