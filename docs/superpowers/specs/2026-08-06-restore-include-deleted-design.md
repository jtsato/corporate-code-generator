# Restore and Include-Deleted Queries Design

## Goal

Extend the soft-delete capability of `java-spring-clean-multimodule` with explicit queries for tombstoned records and an explicit restore operation. The default application behavior remains active-only.

## Approved runtime contract

For every generated entity in the Java multi-module profile:

- `GET /{entities}/deleted` returns a paginated, filterable page containing only tombstoned records.
- `GET /{entities}/deleted/{id}` returns a tombstoned record by identifier.
- `POST /{entities}/{id}/restore` restores a tombstoned record and returns HTTP 204 with no body.
- Normal collection, filter, paging, find-by-id, update, PATCH, and delete operations remain active-only and keep their existing routes and statuses.
- The deleted routes use a separate generated `EntityTombstone` view and `EntityTombstoneResponse`, containing the normal business fields plus `deletedAt`. `deletionScope` remains persistence-only and is never exposed.

Errors:

- Unknown identifiers return the existing 404 `NotFoundException` contract.
- Restore of an already-active record returns the existing 409 `ConflictException` contract and does not mutate the row.
- Restore whose attribute-level unique value is owned by another active record returns 409 and leaves the tombstone unchanged.
- Successful restore clears `deletedAt` and changes `deletionScope` back to `ACTIVE` atomically.

## Architecture

The semantic Application Model is unchanged. The generated Java core adds an `EntityTombstone` view and extends the domain gateway with `findDeletedById`, `findDeletedByFilterPage`, and `restoreById`. The persistence provider builds a deleted predicate from the existing tombstone columns, maps deleted rows to the tombstone view, checks active uniqueness before restore, and invokes a new persistence-entity restore method.

The REST controller receives separate deleted-query and restore use cases. A static `/deleted` path is used instead of a boolean query parameter so ordinary filters cannot accidentally broaden visibility. Restore is a command returning 204. The single-module profile remains unchanged.

## Transaction and consistency

Restore is annotated transactional at the generated persistence-provider method. It loads the row, verifies that it is tombstoned, checks active unique conflicts while excluding the same identifier, clears the tombstone, saves the row, and maps the saved entity. The database composite constraints from ADR-052 remain the final race protection; this milestone does not add a new database or locking strategy.

## Testing

- Core producer and generated use-case tests cover delegation and validation.
- Adapter producer tests cover deleted-query and restore models.
- Generated persistence tests cover hidden-by-default, deleted retrieval, successful restore, repeated restore conflict, and unique-conflict rollback.
- Generated HTTP tests cover deleted collection/by-id routes, normal 404 while tombstoned, successful restore, and 409 conflict.
- OpenAPI smoke tests assert the three explicit operations.
- Full TypeScript, generation, Java smoke, Maven reactor, coverage, and single-module regression gates remain required.
