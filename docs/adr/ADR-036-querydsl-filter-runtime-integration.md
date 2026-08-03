# ADR-036 — Querydsl Filter Runtime Integration

## Status

Accepted — Milestone 6.14.

## Context

Core Filter Common ([ADR-033](ADR-033-core-filter-common.md)) supplies
technology-free `FilterOperator`, `FilterCondition`, `FilterGroup` and
`FilterExpression`. The REST Filter Contract Foundation
([ADR-034](ADR-034-rest-filter-contract-foundation.md)) parses the future HTTP
contract into a `FilterExpression`. The Querydsl Filter Mapper Foundation
([ADR-035](ADR-035-querydsl-filter-mapper-foundation.md)) converts a
`FilterExpression` into `Optional<BooleanExpression>` using entity-aware
definitions.

All three were passive. No generated code consumed the resulting predicate, so
nothing proved that a `FilterExpression` could reach a database and return
filtered domain models.

## Decision

The generated multi-module Golden Path now connects the predicate to the
persistence runtime, without exposing filters over HTTP.

* A separate filtered use case is generated per entity:
  `Find<EntityPlural>ByFilterUseCase` and its interactor. The existing
  `Find<EntityPlural>UseCase` and interactor are untouched and remain
  byte-identical.
* The core gateway gains `List<Entity> findByFilter(FilterExpression)`
  alongside the existing `findAll()`.
* Repositories extend `ListQuerydslPredicateExecutor<<Entity>Entity>` in
  addition to `JpaRepository`. See the proof below.
* The gateway provider converts the expression with `QuerydslFilterMapper` and
  the generated `<Entity>QuerydslFilterDefinition`, then applies the result to
  the repository.
* `FilterExpression.empty()` produces `Optional.empty()` and the provider calls
  `repository.findAll()`. No artificial predicate, empty `BooleanBuilder`, or
  `Expressions.TRUE` is used.
* Null rejection is centralised in the interactor, which throws
  `ValidationException` with message key `common.filter.expression.required`.
  The provider only states the technical precondition through
  `Objects.requireNonNull` and does not duplicate the semantic error. Unknown
  fields, disallowed operators and invalid values continue to be reported by
  `QuerydslFilterMapper`.
* Wiring stays explicit in the generated `<Entity>Configuration`, which now
  registers a third bean. Core and infrastructure remain annotation-free, per
  [ADR-015](ADR-015-explicit-spring-wiring-in-configuration-module.md).
* `ArchitectureTests` gains a rule forbidding `com.querydsl..` inside `core..`.
* REST stays unchanged: no controller change, no query parameters, no
  `RestFilterParser` wiring, and no OpenAPI filter documentation.

### Executor choice — proven, not assumed

`ListQuerydslPredicateExecutor` (option A1) returns `List` from
`findAll(Predicate)`. `QuerydslPredicateExecutor` (option A2) returns
`Iterable` and would require explicit `StreamSupport` conversion in the
provider. A1 was implemented first and validated by three gates against a
generated full-profile project on Spring Boot 4.1.0 and Java 25:

| Gate | Command | Result |
| --- | --- | --- |
| G1 | `mvn -B clean compile` | BUILD SUCCESS — all five reactor modules compile, Q-types generated |
| G2 | `mvn -B test -Dtest=*ApplicationTests -Dsurefire.failIfNoSpecifiedTests=false` | Tests run: 1, Failures: 0, Errors: 0 — Spring Data materialised the repository proxy |
| G3 | `mvn -B test -Dtest=*QuerydslFilterPersistenceTests -Dsurefire.failIfNoSpecifiedTests=false` | Tests run: 8, Failures: 0, Errors: 0 — `findAll(Predicate)` executed against H2 |

**Decision: A1.** `ListQuerydslPredicateExecutor` materialises correctly, so
option A2 was not needed and no `StreamSupport` conversion is generated. No POM
change was required; both executors ship with `spring-boot-starter-data-jpa`,
already a dependency of the infrastructure module.

The choice remains a single constant in the infrastructure producer
(`querydslPredicateExecutorType` plus `requiresIterableConversion`), so
switching to A2 stays a two-field change if a future Spring Data release
regresses.

### Generated persistence test

`<Entity>QuerydslFilterPersistenceTests` is generated per entity in the
`configuration` test source set, in the application root package, next to the
existing HTTP smokes. It uses `@SpringBootTest` without a web environment,
injects the filtered use case and the repository, and builds `FilterExpression`
values directly — the REST parser is not involved.

Because the test is generated from the model, it cannot assume a decimal
`balance`. A driver attribute is selected deterministically: the first
non-identifier attribute with a comparable type (`decimal`, `int32`, `int64`,
`date`, `datetime`), then the first non-identifier attribute whose fixtures are
distinct, and finally the identifier. `boolean` is excluded as a driver because
its deterministic fixtures repeat across the three arranged records, which would
make expected result sets ambiguous.

Scenarios come in two tiers. Tier 1 is always generated and uses only equality
operators valid for every primitive type: empty expression, `EQUALS`, `IN`, an
`OR` group, an `AND` group, and a nested group. Tier 2 is generated only when
the driver supports ordering and adds `GREATER_THAN` plus a bounded range.
Bounds reuse the arranged fixture values, so no synthetic thresholds are
invented. Results are compared as identifier sets, never by order.

## Consequences

* Filters work end to end in the persistence adapter: `FilterExpression` →
  `QuerydslFilterMapper` → `BooleanExpression` → `ListQuerydslPredicateExecutor`
  → repository → gateway → filtered use case.
* Filters are still not reachable over HTTP. REST wiring, OpenAPI documentation,
  paging and sorting remain future work.
* Core still has no Querydsl, Spring, or JPA dependency, now enforced by an
  ArchUnit rule rather than only by convention.
* Repositories depend on a Spring Data Querydsl interface. Both executor
  variants also inherit `Page<T> findAll(Predicate, Pageable)`; nothing
  references it, so this does not constitute paging integration.
* Because `entrypoints-rest` and `infra-database` require `core` transitively,
  their CLI selection counts rise with the three new core artifacts even though
  their own production is unchanged.

## Artifact counts

Measured with real `--dry-run` output, reading the `Operations:` summary line.

| Selection | Before | After |
| --- | ---: | ---: |
| `build` | 6 | 6 |
| `core` | 25 | 28 |
| `entrypoints-rest` | 35 | 38 |
| `infra-database` | 43 | 46 |
| `configuration` | 78 | 82 |
| `build` + `core` | 31 | 34 |
| `build` + `configuration` | 78 | 82 |
| full profile | 78 | 82 |
