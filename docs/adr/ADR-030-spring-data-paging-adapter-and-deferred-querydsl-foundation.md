# ADR-030 — Spring Data Paging Adapter and Deferred Querydsl Foundation

## Context

Core Paging Common is technology-neutral while `infra-database` already uses Spring Data JPA. Querydsl requires Jakarta classifier and annotation-processing decisions, but no filter/search model or executable predicate use exists.

## Decision

Infra generates `SpringDataPageRequestMapper` and `SpringDataPageResultMapper`. They map Core `PageRequest`/`PageResult` to and from Spring Data `Pageable`/`Page`. Domain-to-persistence sort mapping and unsupported-sort validation belong to Infra. Querydsl is deferred to a future milestone. REST pagination and runtime repository behavior remain unchanged.

## Consequences

Core remains Spring-free. Future work may connect the adapters to gateway, use case and REST only with an explicit contract change. Querydsl may be introduced only with a tested executable use case.
