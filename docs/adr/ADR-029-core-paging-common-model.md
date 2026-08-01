# ADR-029: Core Paging Common Model

## Status

Accepted.

## Decision

The multi-module Core provides technology-neutral paging contracts: zero-based `PageRequest`, `SortOrder`, `SortDirection`, and `PageResult<T>` with `items`. Invalid values produce `ValidationException` and stable `FieldViolation` keys.

The model has no Spring Data, JPA, HTTP, REST, or Querydsl dependency. REST and infrastructure adapters, including sort allowlists, remain future milestones.
