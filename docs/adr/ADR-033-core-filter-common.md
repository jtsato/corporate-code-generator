# ADR-033 — Core Filter Common

## Context

Core Paging Common and the passive Querydsl foundation already exist, but the
Golden Path has no technology-neutral contract to represent filters. REST
parsing and a Querydsl mapper are future adapter concerns. The Core must not
depend on Spring, REST, JPA, or Querydsl.

## Decision

Generate a Core Filter Common model in `core/common/filter`:
`FilterExpression`, `FilterGroup`, `FilterCondition`, `FilterOperator`, and
`FilterGroupOperator`. Conditions use declarative operators and `List<String>`
values. Groups support `AND` and `OR`, conditions, and nested groups.

`FilterExpression.empty()` represents the absence of a filter. The records and
final expression class validate their invariants defensively through the
existing `ValidationException` and `FieldViolation` contracts. This milestone
does not convert filter values to domain types and does not add a technical
adapter.

## Consequences

Future use cases can accept filters in a neutral representation. A future REST
parser can build a `FilterExpression`, and a future Querydsl mapper can
translate it. No runtime behavior changes now.

The multi-module Golden Path adds eight Core artifacts (five production types
and three tests), increasing the complete profile from 55 to 63 artifacts.
REST, Infra, and Configuration inherit them through their transitive Core
dependency.

This decision does not add REST query parameters; typed values; an allowlist;
field mapping; a parser; Querydsl or Specification mappers;
`QuerydslPredicateExecutor`; `findAll(predicate)`; or repository, provider,
gateway, use-case, POM, generated CI workflow, or single-module changes.
