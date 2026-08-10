# ADR-070 — Generated Testcontainers Verification

## Status

Accepted — Milestone 6.49.

## Context

[ADR-063](ADR-063-generated-persistence-slice-tests.md) gave `infra/database` a
generated `@DataJpaTest` slice test per entity, running against embedded H2.
H2 is not the database these projects deploy against. It accepts identifier
quoting, type mappings, constraint semantics and pagination that a production
engine rejects, so a green slice test does not establish that the generated JPA
mapping and Querydsl paging query work anywhere real.

The Wallet Reference Gap Plan schedules this as Milestone 6.49: "opt-in database
integration profile", depending on 6.42.

## Decision

- Each entity gets a generated `<Entity>GatewayProviderIT` beside its slice
  test, running the **same provider** against PostgreSQL in a container:
  create-and-read, unknown-identifier, paging with metadata, and soft delete
  with tombstone exposure.
- The container is started by Testcontainers' JUnit 5 extension and wired into
  Spring through `@DynamicPropertySource`, with
  `@AutoConfigureTestDatabase(replace = NONE)` so `@DataJpaTest` does not swap
  the container out for an embedded database. Schema comes from the JPA mapping
  via `ddl-auto=create-drop`, which is what makes the test a mapping check.
- **Opt-in is a Maven profile**, exactly as
  [ADR-069](ADR-069-generated-mutation-testing-capability.md) resolved it for
  PIT. The generated class is named `*IT`, which Surefire ignores; Failsafe is
  declared only inside the `integration-test` profile in `infra/database`. A
  default `mvn clean verify` compiles the class and runs nothing.
- Testcontainers and the PostgreSQL driver are declared as ordinary test-scoped
  dependencies **without versions**: `spring-boot-dependencies` already imports
  `testcontainers-bom` and manages `postgresql`, so ADR-059's "do not restate
  Boot-managed versions" rule applies and no new parent property is introduced.
- The container image is pinned to a tag (`postgres:18-alpine`) in an adapter
  constant shared by both producers, so the profile name and the image cannot
  drift between the POM and the test class.

## Why the dependencies are unconditional but the execution is not

The `*IT` class lives in `src/test/java` and is compiled by every build, so its
imports must resolve unconditionally. Moving the Testcontainers dependencies
into the profile would break `mvn clean verify` for anyone who never opts in.

The cost is that a generated project resolves three extra test-scoped artifacts
it may never execute. That is a one-time download, and it buys a capability that
cannot silently rot: the integration test is compiled on every build, so a
change that breaks its API contract fails immediately rather than at the moment
someone finally enables the profile.

## Alternatives rejected

- **`@ServiceConnection` instead of `@DynamicPropertySource`**: rejected. It is
  tidier, but it requires the additional `spring-boot-testcontainers`
  dependency for a wiring concern four lines of `@DynamicPropertySource`
  already solve.
- **Reusing the slice test's `.sql` fixture through `@Sql`**: rejected. The
  fixture is written for H2, and making one file satisfy two dialects would
  constrain both. The integration test creates its data through the provider,
  which also exercises the write path on the real engine.
- **Replacing the H2 slice tests with container tests**: rejected. The slice
  tests run in milliseconds on every push with no daemon; these need Docker and
  cost seconds. They answer different questions and both are worth keeping.
- **`org.testcontainers:postgresql` and `PostgreSQLContainer<?>`**: these are
  the Testcontainers 1.x coordinates and API. Boot 4.1.0 manages Testcontainers
  **2.0.5**, where the artifact is `testcontainers-postgresql`, the class moved
  to `org.testcontainers.postgresql`, and the self-type generic was removed, so
  `PostgreSQLContainer<?>` no longer compiles.

## Scope boundary

This decision does not change the slice tests, add container-backed tests for
any other module, introduce a second database engine, or make the generated CI
run integration tests on every push. It does not add a Testcontainers capability
to the single-module Golden Path.

## Consequences

- `mvn -P integration-test -pl infra/database -am verify` on a generated project
  starts PostgreSQL in a container and verifies the generated persistence
  provider against it; the default build is unchanged.
- Generated projects gain three test-scoped dependencies and one test class per
  entity. The full-profile count rises from 164 to 165 CREATE operations.
- This repository gains a `smoke:testcontainers:java-multimodule` gate that
  skips when no Docker endpoint is reachable and is required in CI through
  `CODEGEN_REQUIRE_DOCKER_SMOKE`.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (48 test files, 212 tests).
- `npm run smoke:java-multimodule` — golden byte comparison at 165 CREATE
  operations.
- `mvn -B clean verify` against a freshly generated `examples/wallet-service`
  project: BUILD SUCCESS, 119 tests, the `*IT` compiled, no
  `failsafe-reports/` produced — confirming Surefire ignores it and the profile
  is inert by default.
- `mvn -B -P integration-test -pl infra/database -am verify`: Failsafe selected
  and executed `WalletGatewayProviderIT`.

### What was not verified here, and why

**The container-backed assertions did not execute on the development machine.**
Failsafe started the test and it failed in `beforeAll` with
`Could not find a valid Docker environment`.

This is an environment limitation, not a defect in the generated code. Docker on
that machine runs inside WSL (`docker.cmd` shells out to `wsl docker`), exposing
neither `npipe:////./pipe/docker_engine` nor a TCP endpoint, so a Windows JVM
cannot reach the daemon; WSL itself has no JDK, so the build cannot be moved
there either. Making it work would require exposing the daemon over TCP or
installing a JDK inside WSL — both are changes to the developer's machine, not
to this repository, and neither was made.

What *is* verified is everything up to the daemon connection: the generated test
compiles against the real Testcontainers 2.0.5 and Spring Boot 4.1.0 APIs,
Surefire ignores it, and Failsafe under the profile discovers and runs it. The
container assertions themselves are covered by the CI step, which runs on Linux
runners with a working daemon and is required there via
`CODEGEN_REQUIRE_DOCKER_SMOKE`. Until that step has run green once, the
container path should be treated as unproven.
