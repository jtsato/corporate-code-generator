# ADR-038 — Paging Runtime Integration

## Status

Accepted — Milestone 6.16.

## Context

Core Paging Common (`PageRequest`, `PageResult<T>`, `SortOrder`, `SortDirection`)
and the Spring Data Paging Adapter (`SpringDataPageRequestMapper`,
`SpringDataPageResultMapper`) already existed as passive foundations. Nothing
generated connected them to the persistence runtime: no gateway method, no
use case, no repository call exercised `findAll(Pageable)`.

## Decision

A new, isolated paginated flow is generated, reusing the two existing
foundations without duplicating their rules and without touching the
filter or HTTP flows already stabilized in 6.14/6.15.

* A separate use case is generated per entity: `Find<EntityPlural>PageUseCase`
  and its interactor. `Find<EntityPlural>UseCase` and
  `Find<EntityPlural>ByFilterUseCase` are untouched and remain byte-identical.
* `<Entity>Gateway` gains `PageResult<Entity> findPage(PageRequest pageRequest)`
  alongside the existing `findAll()` and `findByFilter(FilterExpression)`.
  Core still knows nothing about `Pageable`, `Page`, Spring Data, JPA, or
  Querydsl.
* `<Entity>GatewayProvider` converts with
  `SpringDataPageRequestMapper.toPageable(pageRequest, Map.of())`, calls
  `<entity>Repository.findAll(pageable)` (already available from
  `JpaRepository`, no repository change needed), and converts the result with
  `SpringDataPageResultMapper.toPageResult(page, <Entity>PersistenceMapper::toDomain)`.
* Null rejection is centralised in the interactor, which throws
  `ValidationException` with message key `common.paging.page-request.required`
  — the same key `SpringDataPageRequestMapper` already used for the same
  concept, not a new one. The provider only states the technical precondition
  through `Objects.requireNonNull` and does not duplicate the semantic error,
  mirroring the 6.14 split between interactor-level and provider-level checks.
* Sorting stays out of scope: tests use `PageRequest.of(page, size)`, which
  already produces an empty `sort` list, and the provider passes `Map.of()`
  as the `sortPropertyMapping` — an already-tested, valid call shape
  (`SpringDataPageRequestMapperTests.shouldMapPageAndSize`). No
  `sortPropertyMapping` allowlist is generated per entity in this milestone.
* Wiring stays explicit in the generated `<Entity>Configuration`, which now
  registers a fourth bean. Core and infrastructure remain annotation-free.
* REST stays unchanged: no controller change, no `page`/`size`/`sort` query
  parameters, no `PageResult` HTTP contract, no OpenAPI pagination
  documentation.

### A real compile break found only by running Maven

`WalletGateway` gaining a third abstract method broke a file that Milestone
6.16 did not intend to touch: the 6.14 `FindWalletsByFilterUseCaseInteractorTests`
already had a private `FakeWalletGateway implements WalletGateway` overriding
only `findAll()` and `findByFilter(FilterExpression)`. Adding `findPage` to
the interface made that existing fake gateway no longer compile
(`is not abstract and does not override abstract method findPage(...)`),
which the two affected Maven smokes (`smoke:querydsl-filter`,
`smoke:rest-filter`) caught immediately once run for real — TypeScript and
`vitest` alone could not see it, since the fake gateway lives entirely inside
generated Java text.

The minimal fix keeps the 6.14 test's intent unchanged: the
`interactor-by-filter-test.java.njk` template gained one more `@Override`
returning `null` for `findPage`, since none of that test's scenarios ever
call it. The corresponding golden
(`FindWalletsByFilterUseCaseInteractorTests.java`) was recaptured from real
generator output.

### Generated persistence test

`<Entity>PagingPersistenceTests` is generated per entity in the
`configuration` test source set, in the application root package, next to
the existing HTTP and Querydsl-filter persistence tests. It uses
`@SpringBootTest` without a web environment, injects the paginated use case
and the repository, and persists five deterministic records (every attribute
varies per record, so identifiers are always distinct). Four scenarios
(`page=0,1,2,10`, `size=2`) assert only `items().size()`, `totalItems()`,
`totalPages()`, `page()`, and `size()` — never content by position or order,
since `findAll(Pageable)` without an explicit `Sort` gives no order
guarantee. The expected item counts and total pages are derived from the
record count and page size in the generator, not hand-computed literals.

## Consequences

* Paginated search works end to end in the persistence adapter:
  `PageRequest → Find<Entity>PageUseCase → <Entity>Gateway.findPage → SpringDataPageRequestMapper → JpaRepository.findAll(Pageable) → SpringDataPageResultMapper → PageResult<Entity>`.
* Pagination is still not reachable over HTTP. REST wiring, OpenAPI
  documentation, and combining pagination with filtering remain future work.
* Sorting remains a future runtime capability; `PageRequest` already carries
  a `sort` list, but no generated code populates or maps it yet.
* `Find<Entity>UseCase` and `Find<Entity>ByFilterUseCase` are untouched.
* Because `entrypoints-rest` and `infra-database` require `core` transitively,
  their CLI selection counts rise with the three new core artifacts even
  though their own production is unchanged.

## Artifact counts

Measured with real `--dry-run` output, reading the `Operations:` summary
line.

| Selection | Before (6.15) | After (6.16) |
| --- | ---: | ---: |
| `build` | 6 | 6 |
| `core` | 28 | 31 |
| `entrypoints-rest` | 38 | 41 |
| `infra-database` | 46 | 49 |
| `configuration` | 84 | 88 |
| `build` + `core` | 34 | 37 |
| `build` + `configuration` | 84 | 88 |
| full profile | 84 | 88 |

## Flow

```
PageRequest
  -> FindWalletsPageUseCase
  -> WalletGateway.findPage
  -> SpringDataPageRequestMapper
  -> JpaRepository.findAll(Pageable)
  -> SpringDataPageResultMapper
  -> PageResult<Wallet>
```
