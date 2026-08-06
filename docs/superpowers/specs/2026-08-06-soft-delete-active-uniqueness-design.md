# Soft Delete with Active Uniqueness

## Status

Approved design for the next Java multi-module Golden Path milestone.

## Goal

Add soft delete to the generated Java multi-module application while allowing a new active entity to reuse a value marked `unique: true` by a soft-deleted entity, without changing business-field values or introducing database-specific migrations.

## Scope

- Apply the capability only to `java-spring-clean-multimodule`.
- Add optional `unique: true` metadata to model attributes and preserve schema validation for existing models.
- Generate persistence-only `deletedAt` and `deletionScope` metadata.
- Generate composite uniqueness constraints using each unique business field and `deletionScope`.
- Use the constant `ACTIVE` scope for live rows and the entity identifier string as the tombstone scope after deletion.
- Make normal find-by-id, collection, filter, paging, update, patch, and delete flows ignore tombstones.
- Return the existing conflict contract when an active unique value or identifier conflicts.
- Validate the generated behavior with unit, golden, HTTP, H2 persistence, OpenAPI, and Maven reactor coverage as applicable.

## Out of scope

- The `java-spring-clean` single-module profile.
- Restore or undelete operations.
- Queries that include deleted records.
- Bulk or cascade delete.
- Flyway, Liquibase, database migrations, PostgreSQL-only partial indexes, or new production database support.
- Auditing beyond the generated `deletedAt` timestamp.
- Composite unique groups; this milestone supports attribute-level `unique: true` only.

## Runtime contract

An active row has `deletedAt = null` and `deletionScope = ACTIVE`. A soft-deleted row retains its identifier and all business fields, receives a deletion timestamp, and changes `deletionScope` to the identifier's stable string representation.

For every attribute marked `unique: true`, the persistence table receives a composite unique constraint over that column and `deletionScope`. This prevents duplicate active values because active rows share `ACTIVE`, while deleted rows use distinct identifier scopes and therefore release the value for reuse without mutating the original field.

Normal reads and writes expose only active rows. A missing or soft-deleted identifier is treated as not found. Repeated delete returns 404. A create that reuses an active unique value or an existing identifier returns the existing 409 conflict contract.

## Architecture

The Application Model and Core remain semantic and technology-agnostic: `unique` is model metadata, while `deletedAt`, `deletionScope`, JPA annotations, and the active-scope predicate belong to the persistence adapter. REST representations do not expose deletion metadata. Templates receive prepared models and do not decide uniqueness or deletion behavior.

The generated gateway provider owns active-row checks and soft-delete mutation. Querydsl collection and paging predicates include the active scope. The persistence mapper preserves the existing domain shape and does not map deletion metadata into Core.

## Error handling

- Missing, deleted, or repeatedly deleted identifiers use the generated `<domain>.not-found` contract.
- Active unique conflicts use the existing `ConflictException` / `<domain>.already-exists` contract.
- No new public REST error shape is introduced.

## Acceptance criteria

1. Existing model documents without `unique` still parse and generate unchanged outside the new soft-delete artifacts.
2. A model attribute with `unique: true` produces the expected composite JPA constraint and generated conflict behavior.
3. DELETE leaves the row physically present, sets `deletedAt`, and changes its scope from `ACTIVE` to the identifier token.
4. GET by ID, list, filter, paging, PUT, PATCH, and repeated DELETE do not operate on tombstones.
5. Creating a new active entity with the same unique value as a tombstone succeeds.
6. Creating a second active entity with the same unique value fails with HTTP 409.
7. The generated project passes its full Maven reactor test suite with H2.
8. The single-module profile and existing models remain unchanged.

