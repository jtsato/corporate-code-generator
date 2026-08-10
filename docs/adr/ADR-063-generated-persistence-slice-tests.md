# ADR-063 — Generated Persistence Slice Tests

## Status

Accepted — Milestone 6.42. Amends ADR-028's Core dependency scoping (Hibernate
Validator and a Jakarta EL implementation move from `test` to `runtime`).

## Context

ADR-060 measured `infra/database` at 0.303 line coverage — the worst of the
four modules. Its generated tests covered the filter mapper, the value
converter, the paging mappers and the predicate builder, all as pure unit
tests. The gateway provider, which is where JPA, Querydsl, soft delete and the
domain/entity mapping actually meet the database, had no test in its own
module. Everything that exercised it lived in `configuration`.

The reference solves this with `@DataJpaTest` provider tests, each importing
the provider under test and seeding rows through a co-located `.sql` fixture
resolved relative to the test class package.

## Decision

- The `infra-database` module generates one `{Entity}GatewayProviderTests` per
  entity, annotated `@DataJpaTest`, `@Import({Entity}GatewayProvider.class)`
  and `@Sql("{Entity}GatewayProviderTests.sql")`.
- A matching `.sql` fixture is generated under
  `src/test/resources/{packagePath}/infra/database/domains/{domain}/`, seeding
  one active row. The fixture is written from the generator's own knowledge of
  the `@Table` and `@Column` names it emitted, so the test exercises the real
  column mapping rather than assuming it. Seeding through the repository
  instead would have made the mapping tautological.
- Ten scenarios are generated: find the seeded row, fail on an unknown
  identifier, create, reject a duplicate identifier, update, soft delete then
  read the tombstone, restore, active-only `findAll`, a filtered page with its
  metadata, and a deleted page after a soft delete. Seeded, created and updated
  fixtures draw from distinct fixture occurrence offsets so the create case
  cannot collide with the seeded row.
- Unlike the reference, `@AutoConfigureTestDatabase(replace = NONE)` and a
  module-local `application-h2.yaml` are **not** generated. Letting
  `@DataJpaTest` replace the datasource with its own embedded database keeps
  the generated project free of a second datasource definition that could drift
  from the runtime one.
- The module's POM gains `spring-boot-starter-test`,
  `spring-boot-starter-data-jpa-test` and `com.h2database:h2`, all `test`
  scope. As with the web slice, Spring Boot 4 ships the JPA test slice as its
  own starter.
- The module generates a test-scoped `PersistenceTestApplication` for the same
  reason the REST module generates `RestTestApplication`.

## The Core dependency defect this uncovered

Writing the slice test surfaced a real packaging defect that no existing test
could have caught. The generated `core` module declared
`org.hibernate.validator:hibernate-validator` at **`test`** scope, yet
`SelfValidating` — a class `core` ships and every domain constructor calls —
requires a Jakarta Validation provider at runtime. Constructing a domain object
from any module other than `configuration` failed with:

```text
jakarta.validation.NoProviderFoundException: Unable to create a Configuration,
because no Jakarta Validation provider could be found.
```

It worked at runtime only because `configuration` pulls in
`spring-boot-starter-validation`, which happens to supply a provider. `core`
was relying on a dependency it did not declare.

Adding the provider brought a second failure: Hibernate Validator needs a
Jakarta EL implementation for message interpolation, without which Hibernate
ORM cannot build its `ValidatorFactory` at all.

The fix is in `core`, not in the test:

- `hibernate-validator` moves from `test` to **`runtime`** scope;
- `org.glassfish.expressly:expressly` is added at **`runtime`** scope, version
  managed by the parent, matching the reference's choice of EL implementation.

`runtime` rather than `compile` is deliberate and preserves ADR-028's Jakarta-only
Core boundary: `core` still compiles against `jakarta.validation-api` alone and
against no provider, while any consumer of `core` now gets a working one
without having to know it needs one. No Spring artifact enters `core`, so
`spring-boot-starter-validation` was not an option here.

## Alternatives rejected

- **Adding `hibernate-validator` at `test` scope to `infra/database`**:
  rejected. It would have made this milestone's tests pass while leaving the
  defect in place for the next module that constructs a domain object. It is
  the same class of shortcut ADR-060 refused when it declined to calibrate a
  coverage threshold to current output.
- **Promoting the validator to `compile` scope in `core`**: rejected as
  stronger coupling than needed. Nothing in `core` compiles against Hibernate
  Validator types.
- **Seeding fixtures through the repository rather than SQL**: rejected
  because it would not exercise the generated `@Table`/`@Column` mapping, which
  is a large part of what a persistence slice test is for.
- **Copying the reference's `@AutoConfigureTestDatabase(replace = NONE)` plus
  an `application-h2.yaml`**: rejected as an avoidable second datasource
  definition, and as carrying the reference's P6Spy JDBC URL, which is not
  adopted.

## Scope boundary

This decision does not add Testcontainers, migration tooling, a second
database engine, or a coverage threshold. It changes `core`'s dependency
scopes only as described above.

## Consequences

- `infra/database` line coverage rises from 0.303 to 0.872 and branch coverage
  from 0.533 to 0.650.
- Generated projects now declare a validation provider and an EL implementation
  at runtime scope in `core`, so any module can construct domain objects.
- The full-profile artifact count is 155 CREATE operations, up from 150 before
  Milestones 6.41 and 6.42.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean test -pl infra/database -am` against a freshly generated
  `examples/wallet-service` project: 10 tests, 0 failures.
- `mvn -B clean verify` on the full reactor: BUILD SUCCESS.
- Per-module coverage after 6.41 and 6.42: `core` 0.917/0.968,
  `entrypoints/rest` 0.891/0.780, `infra/database` 0.872/0.650,
  `configuration` 0.859/0.429.
