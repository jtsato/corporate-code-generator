# ADR-056 — Default Runtime Datasource (In-Memory H2)

## Status

Accepted — Milestone 6.36. Supersedes ADR-016 in part (H2 scope and deferred production DataSource decision).

## Context

A freshly generated `java-spring-clean-multimodule` project failed to start
outside of tests. Running the packaged `configuration` fat jar with no active
Spring profile produced:

```text
Failed to configure a DataSource: 'url' attribute is not specified and no
embedded datasource could be configured.
```

The root cause was ADR-016's original decision: `com.h2database:h2` was added
to the `configuration` module's dependency list with `test` scope only, so it
never reached the runtime classpath of the packaged application. No profile
(`application.yaml`, `application-local.yaml`, `application-prod.yaml`) ever
configured `spring.datasource.url`, so Spring Boot's auto-configuration had
neither an embedded driver on the runtime classpath nor an explicit JDBC URL
to fall back on. ADR-016 explicitly deferred the production DataSource
decision; this milestone resolves the "runnable out of the box" half of that
deferral without resolving production database selection.

## Decision

- `com.h2database:h2` moves from `test` scope to `runtime` scope in the
  `configuration` module's Maven dependency list only. It is not added to
  `infra-database`, and it is not promoted to `compile` scope. H2 is
  packaged into the generated application's fat jar, but no generated Java
  source compiles against it directly.
- The base `application.yaml` gains a default in-memory H2 datasource, with
  every value overridable through an environment variable:

  ```yaml
  spring:
    datasource:
      url: "${SPRING_DATASOURCE_URL:jdbc:h2:mem:{{ applicationName }};DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE}"
      username: ${SPRING_DATASOURCE_USERNAME:sa}
      password: ${SPRING_DATASOURCE_PASSWORD:}
    jpa:
      hibernate:
        ddl-auto: ${SPRING_JPA_HIBERNATE_DDL_AUTO:create-drop}
  ```

  `ddl-auto` defaults to `create-drop` in the base configuration, matching an
  ephemeral, in-memory, restart-clears-data database.
- `application-prod.yaml` requires `SPRING_DATASOURCE_URL` with **no
  default**, so a production boot with the variable unset fails fast with an
  unresolved-placeholder/invalid-URL error instead of silently falling back
  to an in-memory database. `ddl-auto` defaults to `validate` in production,
  so the production profile expects a real, externally migrated schema
  rather than letting Hibernate mutate it.
- No `driver-class-name` is pinned anywhere. Spring Boot derives the driver
  from the JDBC URL scheme (`jdbc:h2:...` in the base profile; whatever the
  operator supplies in production), keeping the base configuration
  database-shape-agnostic beyond "some JDBC URL will be supplied."
- `application-test.yaml` is intentionally left unchanged. The test profile
  inherits the base datasource block by not overriding it, which means the
  generated Maven reactor's own `@SpringBootTest` contexts (`MOCK` and
  `RANDOM_PORT`) exercise the exact same base datasource configuration that
  ships to production users, rather than a parallel test-only datasource
  definition that could drift from what actually runs.

## Alternatives rejected

- **A dedicated Maven build profile that swaps datasource configuration or
  H2 scope at build time**: rejected because it reintroduces the
  determinism and "no undeclared environment state" concerns the generator
  already avoids elsewhere (ADR-005); the generated project must behave the
  same way regardless of which Maven profile a downstream consumer happens
  to activate.
- **`compile` scope for H2**: rejected because nothing in the generated Java
  source references H2 types directly; `runtime` scope is the precise fit
  and keeps H2 off every module's compile classpath.
- **Keeping H2 at `test` scope and fixing this some other way (for example,
  Spring Boot's embedded-database auto-detection)**: rejected because
  auto-detection only works when an embedded driver is present on the
  *runtime* classpath, which a `test`-scoped dependency never is outside of
  test execution. There is no way to make the packaged jar self-contained
  without changing the dependency's scope.
- **Adding H2 to `infra-database` instead of `configuration`**: rejected
  because `infra-database` only implements persistence abstractions; it
  does not own the runtime application composition, and adding a runtime
  database dependency there would blur the module boundary this profile
  otherwise maintains between "how persistence is implemented" and "how the
  running application is wired."
- **Pinning `driver-class-name` explicitly**: rejected as unnecessary
  indirection — Spring Boot already derives the correct driver from the
  JDBC URL, and pinning it would only reintroduce a second, harder-to-change
  source of truth for a value the URL already encodes.
- **Giving the `prod` profile the same H2 default as the base profile**:
  rejected because it would let a misconfigured production deployment boot
  silently against a throwaway in-memory database instead of failing fast,
  which is the entire point of separating base and production datasource
  behavior.
- **Relying on Spring Boot's implicit embedded-database auto-detection
  instead of an explicit `spring.datasource.url`**: rejected because
  implicit auto-detection does not let the base configuration name the
  database (`jdbc:h2:mem:{{ applicationName }}`) or expose it through the
  same environment-variable override pattern already used throughout the
  generated configuration files.
- **Adding Flyway or Testcontainers in this milestone**: rejected as scope
  expansion. This milestone fixes a startup defect; schema migration
  tooling and containerized test databases are unrelated capabilities that
  were not part of the approved design.

## Scope boundary

This decision does not add database migration tooling, a second database
engine, the H2 web console, connection pool tuning, or model-level database
selection. It does not change the single-module profile, which is
unaffected by this milestone.

## Consequences

- A freshly generated `java-spring-clean-multimodule` application starts
  successfully with no external configuration and no active Spring profile.
- Data does not survive an application restart by design — the default
  datasource is in-memory H2 with `DB_CLOSE_ON_EXIT=FALSE` only to keep the
  pool alive for the lifetime of a single JVM process.
- H2 ships inside the production fat jar (`BOOT-INF/lib`) as an accepted
  consequence of making the application runnable out of the box; it remains
  the default engine of this baseline until a future milestone introduces
  model-level database selection.
- `runtime` scope keeps H2 off every module's compile classpath, so no
  generated Java source can accidentally depend on H2-specific types.
- The two generated `@SpringBootTest` contexts (`MOCK` and `RANDOM_PORT`)
  now share one in-memory database name derived from the application name,
  since the test profile inherits the base datasource unchanged; this was
  validated by the full, unfiltered Maven reactor test run showing no
  cross-context interference.

## Validation

- `npm run typecheck`, `npm run build`, `npm test`, `npm run test:coverage`.
- `npm run smoke:java-multimodule` (golden byte comparison).
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:spring-context:java-multimodule`.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:maven-reactor:java-multimodule`,
  and a manual `mvn -B test` run against a freshly generated
  `examples/wallet-service` project confirming `BUILD SUCCESS` across all
  four test-bearing modules (`core`, `entrypoints-rest`, `infra-database`,
  `configuration`) with no cross-context interference between the two
  `@SpringBootTest` contexts sharing the in-memory database.
- Confirmed the full-profile dry-run count is unchanged at 148 CREATE
  operations.
- Manual boot evidence against a freshly generated, packaged
  `configuration` fat jar: H2 confirmed present under `BOOT-INF/lib`;
  running with no active profile starts successfully and serves
  `GET /wallets`, `POST /wallets`, and `GET /wallets/{id}`; running with
  `SPRING_PROFILES_ACTIVE=prod` and no `SPRING_DATASOURCE_URL` fails fast
  during context startup with an invalid/unresolved datasource URL error.
