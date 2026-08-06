# ADR-053: Explicit Restore and Include-Deleted Queries

- Status: Accepted
- Date: 2026-08-06
- Scope: `java-spring-clean-multimodule`

## Context

ADR-052 introduced soft delete with active-only normal flows. Tombstoned rows remain physically stored and release attribute-level unique values, but there was no supported way to inspect or restore them. A boolean `includeDeleted` query parameter would make visibility easy to activate accidentally and would blur the existing active-only contract.

## Decision

Generate explicit routes for tombstones:

- `GET /{entities}/deleted` for deleted-only filter/paging queries;
- `GET /{entities}/deleted/{id}` for a deleted record by identifier;
- `POST /{entities}/{id}/restore` to restore a tombstoned record and return 204 with no body.

The deleted routes use a dedicated generated `EntityTombstone` view and response containing business fields plus `deletedAt`; `deletionScope` remains persistence-only. The generated core gateway adds dedicated deleted-query and restore methods, while the adapter supplies the tombstone predicate and mutation.

Restore is transactional. It rejects already-active records and active unique conflicts with the existing `ConflictException`/HTTP 409 contract, leaving the row unchanged. Unknown identifiers use the existing not-found contract. A successful restore clears `deletedAt`, sets `deletionScope` to `ACTIVE`, and returns 204.

## Alternatives rejected

- Boolean `includeDeleted` query parameter: too easy to activate accidentally and would mix administrative visibility with ordinary filters.
- Exposing `deletedAt` and `deletionScope` on the normal domain/REST model: leaks persistence implementation details into existing contracts. A dedicated tombstone view is used instead; `deletionScope` is still never exposed.
- Hard purge or audit history: separate capabilities with different retention and authorization requirements.
- Database-specific partial indexes or locking: outside the portability and scope boundary established by ADR-052.

## Consequences

The Java multi-module profile gains explicit administrative-style read/restore routes without changing existing active-only consumers. Generated artifacts and tests increase, but the semantic model and single-module profile remain stable. Authorization is intentionally not implemented; callers requiring access control must add it outside this milestone.
