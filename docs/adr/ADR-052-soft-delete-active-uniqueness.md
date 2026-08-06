# ADR-052 — Soft Delete with Active Uniqueness

## Status

Accepted — Milestone 6.32.

## Context

The Java multi-module Golden Path previously removed rows physically. Soft delete is needed to retain identifiers and business fields while hiding deleted records from normal application flows. Reusing a unique business value after deletion must not require mutating the original value or introducing a database-specific partial index into the current JPA/H2 baseline.

The Application Model did not previously express attribute uniqueness. The capability therefore also accepts optional `unique: true` while preserving existing model documents and the single-module profile.

## Decision

The model parser and schema accept optional `unique: true` on attributes. The Java multi-module persistence adapter generates two technical fields on every JPA entity: nullable `Instant deletedAt` and non-null `String deletionScope`.

Active rows use the constant scope `ACTIVE`. Soft deletion loads an active entity, sets `deletedAt` to the runtime timestamp, changes `deletionScope` to the identifier's stable string representation, and saves the row. Business fields are never changed.

For each attribute marked `unique: true`, the entity table receives a composite unique constraint over that business column and `deletion_scope`. Active rows therefore remain unique because they share `ACTIVE`; deleted rows use identifier-specific scopes and release the original business value for a new active row.

The provider applies the active predicate `deleted_at IS NULL AND deletion_scope = ACTIVE` to collection, filter, and paging queries. Find-by-id, update, PATCH, and DELETE treat a tombstone as not found. Create and update check active unique conflicts and reuse the existing conflict contract. Repeated DELETE remains 404.

Deletion metadata stays in `infra-database`; it is not added to the Core model, REST DTOs, OpenAPI schemas, or generated responses.

## Alternatives rejected

- PostgreSQL-style partial unique indexes: technically appropriate but require migrations, database dialect selection, and a broader production database contract not present in the current profile.
- Mutating a deleted business value: corrupts the historical representation and is unsafe for arbitrary data types, lengths, validation, and collation.
- Reserving unique values forever: portable but does not satisfy the approved requirement to reuse a value after soft deletion.
- `@SQLDelete`/`@SQLRestriction` alone: hides rows but does not solve active-scope uniqueness.

## Scope boundary

This decision applies only to the Java Spring Clean multi-module profile. It does not add restore, include-deleted queries, bulk/cascade delete, composite unique groups, migrations, additional databases, auditing beyond `deletedAt`, or changes to the single-module profile.

## Consequences

- Existing model documents remain valid; omitted `unique` is treated as false by the parser.
- Generated H2 tests prove physical retention, hidden tombstones, repeated-delete not-found, and reuse of a unique value after soft deletion.
- The generated schema contains a technical deletion scope column and composite constraints for declared unique attributes.
- The current generated fixture marks `balance` as unique to exercise active uniqueness without adding a new business field to the reference model.
- Concurrent uniqueness remains protected by the database constraint; the provider precheck supplies the standard conflict contract for normal sequential requests.

## Validation

The milestone requires Node typecheck/build/tests/coverage, generated dry-run verification, relevant Java multi-module smokes, and an actual unfiltered Maven reactor test run with H2.

