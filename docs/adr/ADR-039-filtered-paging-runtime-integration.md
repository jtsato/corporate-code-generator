# ADR-039 — Filtered Paging Runtime Integration

## Status

Accepted — Milestone 6.17.

## Context

Milestones 6.15 and 6.16 independently connected `FilterExpression` and
`PageRequest` to persistence. Filtered paging must combine those capabilities
while keeping the core technology-agnostic and leaving HTTP/OpenAPI unchanged.

## Decision

Generate a separate use case per entity:
`Find<Entity>ByFilterPageUseCase` and its interactor. The existing unfiltered
and filter-only use cases remain available.

The gateway gains:

```java
PageResult<Entity> findByFilterPage(FilterExpression filterExpression,
                                    PageRequest pageRequest);
```

The provider maps the filter with `QuerydslFilterMapper`, maps the page with
`SpringDataPageRequestMapper.toPageable(pageRequest, Map.of())`, calls the
existing repository contract `findAll(predicate, pageable)`, and maps the
Spring Data result with `SpringDataPageResultMapper`. For an empty filter it
calls `findAll(pageable)`. The repository is not changed because
`ListQuerydslPredicateExecutor` already inherits both overloads.

Null semantic validation remains in the interactor, using the existing stable
keys `common.filter.expression.required` and
`common.paging.page-request.required`. The provider only states technical
preconditions with `Objects.requireNonNull`.

Configuration registers the combined use case explicitly. No controller,
request parameter, OpenAPI contract, sorting policy, or HTTP response changes
are introduced in this milestone.

## Generated verification

The generated `QuerydslFilterPagingPersistenceTests` persists deterministic records
and asserts filtering, page size, total items, total pages, and returned
content. The existing `Find<Entity>ByFilterUseCaseInteractorTests` and
`Find<Entity>PageUseCaseInteractorTests` fakes implement the new gateway method
with inert stubs so their original behavior remains unchanged.

The end-to-end path is:

```text
FilterExpression + PageRequest
  -> FindWalletsByFilterPageUseCase
  -> WalletGateway.findByFilterPage
  -> QuerydslFilterMapper + SpringDataPageRequestMapper
  -> repository.findAll(predicate, pageable)
  -> SpringDataPageResultMapper
  -> PageResult<Wallet>
```

## Consequences

Filtered paging is available to generated application code and persistence
tests, but not through REST. Sorting and HTTP pagination remain future work.
