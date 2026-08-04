# ADR-041 — REST Sorting Runtime Integration

## Context

The Core already provides Spring-free `SortDirection`, `SortOrder`, and
`PageRequest` support. The infrastructure already maps `PageRequest` to a
Spring `Pageable` and accepts a `sortPropertyMapping`. REST filtered paging
was available through `GET /wallets`, but HTTP clients could not request a
deterministic sort.

## Decision

`GET /wallets` accepts a repeatable `sort` query parameter with the strict
syntax `sort=<field>:<direction>`. Directions are exactly `asc` and `desc`;
spaces are not normalized. `RestSortParser` converts the public REST names to
Core `SortOrder` values using a per-domain `RestSortDefinition` allowlist.

The controller includes the resulting orders in `PageRequest`. The generated
provider passes an entity-derived `sortPropertyMapping` to
`SpringDataPageRequestMapper` for both paged gateway methods. Filter, page and
size behavior remains unchanged.

The current Wallet allowlist is generated from its attributes: `id` and
`balance`. Sorting does not support nested properties, joins, computed fields,
null ordering, or case-insensitive behavior.

## Consequences

- REST sorting works with filtering and pagination.
- Unknown fields and invalid syntax return HTTP 400 through the existing
  validation handler.
- Domain-to-persistence property translation remains outside Core.
- Multiple sort parameters preserve their request order.
- Future milestones may add richer sorting syntax or metadata-driven
  sortable-field policies.
