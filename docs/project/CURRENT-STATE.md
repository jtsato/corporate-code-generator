# Current State

Verification date: 2026-08-10
Baseline commit: `d9f7c37`

This document centralizes current measured facts. Architecture intent and future work are documented separately in the [Solution Specification](../SOLUTION-SPECIFICATION.md), [Generated Java Reference Architecture](../target-architecture/REFERENCE-ARCHITECTURE.md), [Capability Taxonomy](../target-architecture/CAPABILITY-TAXONOMY.md), and [Roadmap](../../ROADMAP.md).

## Commands used for the baseline

Measured dry-run command shape:

```bash
node packages/cli/dist/index.js generate examples/wallet-service/model.yaml --profile <profile> [--module <module>] --dry-run
```

Build command used for the baseline:

```bash
npm run build
```

## Measured facts

### Profiles, versions, and modules

| Profile | Version | Language | Language version | Framework | Modules |
| --- | --- | --- | --- | --- | --- |
| `java-spring-clean` | `0.1.0` | Java | `25` | Spring Boot | `build`, `domain`, `application`, `bootstrap`, `api-rest` |
| `java-spring-clean-multimodule` | `0.1.0` | Java | `25` | Spring Boot | `build`, `core`, `entrypoints-rest`, `infra-database`, `configuration` |
| `nestjs-clean-architecture` | `0.1.0` | TypeScript | `5.9` | NestJS | `build`, `core`, `infra-persistence`, `web-api`, `bootstrap` |

Single-module dependencies:

- `application` requires `domain`.
- `bootstrap` requires `application`.
- `api-rest` requires `application`.

Multi-module dependencies:

- `entrypoints-rest` requires `core`.
- `infra-database` requires `core`.
- `configuration` requires `build`, `core`, `entrypoints-rest`, and `infra-database`.

NestJS dependencies:

- `infra-persistence` requires `core`.
- `web-api` requires `core`.
- `bootstrap` requires `core`, `infra-persistence`, and `web-api`.

### Dry-run counts

| Profile and selection | Dry-run count |
| --- | ---: |
| `java-spring-clean --module domain` | 1 CREATE |
| `java-spring-clean` full profile | 6 CREATE |
| `java-spring-clean-multimodule` full profile | 164 CREATE |
| `java-spring-clean-multimodule --module build` | 11 CREATE |
| `java-spring-clean-multimodule --module core` | 65 CREATE |
| `java-spring-clean-multimodule --module entrypoints-rest` | 90 CREATE |
| `java-spring-clean-multimodule --module infra-database` | 86 CREATE |
| `java-spring-clean-multimodule --module configuration` | 164 CREATE |
| `java-spring-clean-multimodule --module build --module core` | 76 CREATE |
| `java-spring-clean-multimodule --module build --module configuration` | 164 CREATE |
| `nestjs-clean-architecture` full profile | 28 CREATE |
| `nestjs-clean-architecture --module build` | 4 CREATE |
| `nestjs-clean-architecture --module core` | 11 CREATE |
| `nestjs-clean-architecture --module infra-persistence` | 16 CREATE |
| `nestjs-clean-architecture --module web-api` | 17 CREATE |
| `nestjs-clean-architecture --module bootstrap` | 24 CREATE |

The `entrypoints-rest` and `infra-database` selections include `core` transitively. The `configuration` selection includes all required modules transitively.

The NestJS `infra-persistence` and `web-api` selections include `core` transitively. The `bootstrap` selection includes `core`, `infra-persistence`, and `web-api` transitively, but not `build`.

### Capabilities and endpoints

Measured and documented implemented capabilities in the current Java multi-module Golden Path include:

- Maven reactor build structure.
- Core domain model, use cases, commands, ports, paging, filters, sorting model, and self-validation.
- REST entrypoints for collection reads, filtered paging, sorting, find-by-id, create, full replacement update, partial update, and delete.
- Database infrastructure with Spring Data JPA, a runtime-scoped H2 driver with a default in-memory datasource in base configuration (making the generated application runnable with no external configuration), persistence mappers, Querydsl predicates, paging adapters, and filter mapping. Production requires an explicit `SPRING_DATASOURCE_URL` with no H2 fallback and fails fast at startup if it is unset.
- Runtime create, update, and soft-delete behavior through Core and JPA, with delete exposed over REST as a non-idempotent operation. Attribute-level `unique: true` values are reusable after soft deletion through the generated active-scope constraint.
- Configuration profiles, property-driven CORS, OpenAPI, Swagger UI environment policy, i18n message bundles, global REST error handling, ArchUnit tests, JaCoCo configuration, and generated Java CI.
- Container packaging: a multi-stage `Dockerfile` (Maven builder stage, Alpine JRE runtime, non-root UID/GID 10001, `JAVA_TOOL_OPTIONS` container-aware heap sizing, `HEALTHCHECK` against `/actuator/health`), a `.dockerignore`, and a Compose file. Spring Boot Actuator is on the `configuration` classpath with only the `health` endpoint exposed over HTTP and `show-details: never`.
- Explicit i18n policy: generated `LocaleConfiguration` selects English by default, allows only `en` and `pt-BR` through `Accept-Language`, loads UTF-8 message bundles, and disables JVM system-locale fallback; generated locale tests cover Portuguese, unsupported, and missing-header negotiation.

Current documented REST surface:

| Operation | Endpoint | State |
| --- | --- | --- |
| Collection read, filtering, paging, and sorting | `GET /wallets` | Implemented |
| Individual read | `GET /wallets/{id}` | Implemented |
| Create | `POST /wallets` | Implemented |
| Full replacement update | `PUT /wallets/{id}` | Implemented |
| Partial update | `PATCH /wallets/{id}` | Implemented |
| Delete over REST | `DELETE /wallets/{id}` | Implemented |

### Scripts, tests, and smokes

The root `package.json` declares:

- `typecheck`;
- `build`;
- `test`;
- `test:coverage`;
- `test:watch`;
- `mutation`;
- 30 smoke scripts.

The repository contains:

- 31 files under `tests/smoke`;
- 4 files under `tests/integration`;
- 3 GitHub workflow files under `.github/workflows`.

### Maven reactor and CI

Measured/documented CI state:

- `continuous-integration.yml` runs Node.js 22, Java 25, `npm ci`, typecheck, build, coverage, single-module smoke, single-module Maven smoke, multi-module smoke families, Maven reactor smoke, and SonarCloud scan.
- `java-multimodule-maven-smoke.yml` runs the generated Java multi-module Maven smoke with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`.
- `mutation-testing.yml` runs scheduled or manual mutation testing.
- The generated Java CI (`.github/workflows/java-ci.yml`) uses Java 25,
  SHA-pinned `actions/checkout` (`v4.3.1`) and `actions/setup-java`
  (`v4.8.0`) with `fetch-depth: 0` and `cache: maven`, a `workflow_dispatch`
  trigger, `mvn -B clean verify -Dspring.profiles.active=test`, and an
  optional SonarCloud scan step guarded by `SONAR_TOKEN` secret presence
  (see [ADR-065](../adr/ADR-065-generated-ci-hardening.md)).

## Milestone 6.30 Validation

Run context: main workspace, Golden Path Java 1.0 release-readiness audit; date: 2026-08-06; baseline: `07c70dc`.

- `npm run typecheck` - passed, exit 0.
- `npm run build` - passed, exit 0.
- `npm test` - passed, 44 test files and 145 tests.
- `npm run test:coverage` - passed, exit 0; Statements 90.03%, Branches 71.22%, Functions 96.73%, Lines 91.14%.
- Dry-run selections passed with the expected counts shown in the table above before Milestone 6.31: full profile 125, Core 50, entrypoints-rest 69, infra-database 68, configuration 125, build+core 56, and build+configuration 125.
- `npm run smoke:java-multimodule` - passed.

Maven-required smokes passed with `CODEGEN_REQUIRE_MAVEN_SMOKE=true` when applicable:

- `smoke:http-delete`, `smoke:delete-runtime`, `smoke:openapi`, and `smoke:maven-reactor` - passed.

## Milestone 6.31 Validation

Run context: main workspace, REST PATCH integration; date: 2026-08-06.

- `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:coverage` - passed; current Node suite: 44 test files and 146 tests; coverage Statements 90.51%, Branches 73.13%, Functions 96.81%, Lines 91.56%.
- Full-profile dry-run passed with 131 CREATE operations; Core 54, entrypoints-rest 74, infra-database 72, configuration 131, and build+core 60.
- `npm run smoke:maven-reactor:java-multimodule` - passed with Maven required; generated HTTP PATCH and OpenAPI tests were included in the full reactor.

## Milestone 6.32 Validation

Run context: main workspace, soft delete with active uniqueness; date: 2026-08-06.

- `npm run typecheck` - passed, exit 0.
- `npm run build` - passed, exit 0.
- `npm test` - passed, 44 test files and 150 tests.
- `npm run test:coverage` - passed; Statements 90.82%, Branches 74.96%, Functions 97.38%, Lines 91.81%.
- Full-profile dry-run passed with 131 CREATE operations; the artifact count remains unchanged because soft delete modifies existing persistence and generated-test artifacts.
- `npm run smoke:java-multimodule` - passed.
- `npm run smoke:maven-reactor:java-multimodule` - passed with Maven required; generated H2 tests covered physical tombstone retention, hidden reads, repeated-delete not-found, and unique-value reuse after soft delete.
- The single-module profile was not changed by this milestone.

## Milestone 6.33 Validation

Run context: main workspace, restore and deleted-only queries; date: 2026-08-06.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, 44 test files and 153 tests.
- `npm run test:coverage` - passed; Statements 91.49%, Branches 75.11%, Functions 97.49%, Lines 92.46%.
- Focused Core, REST, persistence, and configuration producer tests - passed, 15 tests.
- Full generated wallet-service Maven reactor (`mvn -q test`) - passed, including generated OpenAPI, deleted-query, restore, and unique-conflict tests.
- Full-profile generation produced 148 CREATE operations; the single-module profile was not changed.

## Milestone 6.34 Validation

Run context: main workspace, composite unique groups (ADR-054) QA closure; date: 2026-08-06.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, 44 test files and 163 tests.
- `npm run test:coverage` - passed; Statements 91.64%, Branches 76.13%, Functions 97.57%, Lines 92.6%.
- Full-profile wallet-service dry-run produced 148 CREATE operations, unchanged from the 6.33 baseline because `examples/wallet-service` declares no `uniqueGroups`. `npm run smoke:java-multimodule` (golden byte-comparison) passed, confirming non-regression.
- Real Maven build of a freshly generated `examples/composite-unique-service/model.yaml` project (`uniqueGroups: [[balance, externalId]]`), generated to a scratch output directory and validated with `mvn -B test`: Reactor `BUILD SUCCESS`, 117 tests run, 0 failures, 0 errors, 0 skipped. This is new-capability evidence, not golden-covered, demonstrating the generated `@UniqueConstraint(name = "uk_product_g2_balance_external_id_active_scope", columnNames = { "balance", "external_id", "deletion_scope" })` and the `ProductGatewayProvider.hasActiveUniqueConflict` active-row conflict predicate work end-to-end. `ProductHttpCreateTests.shouldReuseUniqueValueAfterSoftDelete` proves the group predicate is scoped to active rows, and `ProductRestorePersistenceTests.shouldKeepTheTombstoneWhenRestoreConflictsWithAnActiveUniqueValue` proves the group conflict predicate fires against a live database.
- Fixed a constraint-name collision defect found during independent QA review: `toJavaDatabaseUniqueConstraintName` previously joined column names with `_` regardless of arity, so a single-column attribute-level name (for example `tenant_code` from a `unique: true` attribute named `tenantCode`) could collide byte-for-byte with a composite group name (for example `uniqueGroups: [["tenant", "code"]]`), silently merging two distinct JPA `@UniqueConstraint`s into one weaker constraint. Multi-column group names now carry a `gN_` arity-disambiguating segment (for example `uk_product_g2_tenant_code_active_scope`) while single-column names remain byte-identical to prior output. Verified against real Hibernate-emitted DDL: before the fix the two constraints merged into `unique (tenant_code, deletion_scope, tenant, code)`; after the fix they render as two separate constraints, `unique (tenant_code, deletion_scope)` and `unique (tenant, code, deletion_scope)`.
- Removed 152 unreferenced golden files under `tests/golden/java-spring-clean-multimodule/` that were accidentally committed alongside the real 148 (verified by diffing the full set of expected golden paths, derived from the actual generation plan, against every tracked file in that directory: 148 matched exactly with zero missing, and 152 were dead files under an unreachable path shape that no test ever reads).

## Milestone 6.35 Validation

Run context: main workspace, auditing (createdAt/updatedAt) capability; date: 2026-08-07.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, 45 test files and 194 tests.
- `npm run test:coverage` - passed; Statements 92%, Branches 80.09%, Functions 97.5%, Lines 92.95%.
- Full-profile wallet-service dry-run produced 148 CREATE operations, unchanged from the 6.34 baseline because `examples/wallet-service` declares no `audited` entity. `npm run smoke:java-multimodule` (golden byte-comparison) passed, confirming non-regression.
- Real Maven build of a freshly generated `examples/audited-wallet-service/model.yaml` project (`Wallet` entity, `audited: true`), generated to a scratch output directory and validated with `mvn -B test`: Reactor `BUILD SUCCESS`, 199 tests run (54 core + 14 entrypoints-rest + 17 infra-database + 114 configuration), 0 failures, 0 errors, 0 skipped across all four test-bearing modules. This matches Task 12's own compiler-driven-loop total for the same entity shape, confirming no regression was introduced by the Task 13 documentation-only changes. This is new-capability evidence, not golden-covered, demonstrating the generated `GetLocalDateTime`/`GetLocalDateTimeImpl` clock port, `CreateWalletUseCaseInteractor` setting both timestamps, `UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor` setting only `updatedAt`, and `WalletGatewayProvider.update()` preserving `createdAt` via `entity.setCreatedAt(existing.getCreatedAt())` work end-to-end.

## Milestone 6.36 Validation

Run context: main workspace, default runtime datasource (in-memory H2) defect fix; date: 2026-08-07.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, 45 test files and 197 tests.
- `npm run test:coverage` - passed; Statements 92.05%, Branches 80.14%, Functions 97.73%, Lines 93%.
- `npm run smoke:java-multimodule` (golden byte comparison) - passed, covering the regenerated `pom.xml` (H2 `runtime` scope), `application.yaml`, and `application-prod.yaml` goldens.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:spring-context:java-multimodule` - passed.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:maven-reactor:java-multimodule` - passed. A manual, unfiltered `mvn -B test` run against a freshly generated `examples/wallet-service/model.yaml` project confirmed Reactor `BUILD SUCCESS`, 201 tests run (54 core + 14 entrypoints-rest + 17 infra-database + 116 configuration), 0 failures, 0 errors, 0 skipped, with the two `@SpringBootTest` contexts (`MOCK` and `RANDOM_PORT`) sharing the same base in-memory H2 datasource with no cross-context interference.
- Full-profile wallet-service dry-run produced 148 CREATE operations, unchanged.
- Manual boot evidence against a freshly packaged `configuration` fat jar (`mvn -B -DskipTests package`): `jar tf` confirmed `BOOT-INF/lib/h2-2.4.240.jar` present; running the jar with no active Spring profile started successfully (`Started WalletServiceApplication in 3.591 seconds`) against `jdbc:h2:mem:wallet-service`; `GET /wallets` returned 200 with an empty page, `POST /wallets` returned 201, and `GET /wallets/{id}` returned 200 for the created record; running the same jar with `SPRING_PROFILES_ACTIVE=prod` and no `SPRING_DATASOURCE_URL` failed context startup with `IllegalArgumentException: 'url' must start with "jdbc"` (the unresolved `${SPRING_DATASOURCE_URL}` placeholder), confirming production has no H2 fallback.

## Milestone 6.45 Validation

Run context: main workspace, Docker capability; date: 2026-08-10.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, 48 test files and 212 tests.
- `npm run smoke:java-multimodule` (golden byte comparison) - passed over all 160 artifacts, including the new `Dockerfile`, `.dockerignore` and `docker-compose.yml` and the regenerated `README.md`, `configuration/pom.xml` and `application.yaml`.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:maven-reactor:java-multimodule` - passed.
- `mvn -B test` against a freshly generated `examples/wallet-service` project - Reactor `BUILD SUCCESS` across all five modules; `configuration` ran 117 tests with 0 failures, 0 errors, 0 skipped, including the new `ActuatorHealthSmokeTests.healthEndpointReportsUp`, which proves `/actuator/health` returns 200 with `status: UP` and no `components` field. That endpoint is the target of the generated container `HEALTHCHECK`.
- Full-profile dry-run produced 160 CREATE operations, up from 156; the `build` module rose from 8 to 11.
- Both generated base image tags (`maven:3.9-eclipse-temurin-25-alpine`, `eclipse-temurin:25-jre-alpine`) were confirmed published for `linux/amd64` and `linux/arm64`.
- No `docker build` or `docker compose up` was executed: no Docker daemon is available in this environment, so container behavior itself is unverified. See [ADR-066](../adr/ADR-066-generated-docker-capability.md).
- The single-module `java-spring-clean` and `nestjs-clean-architecture` profiles were not changed by this milestone.

## Milestone 6.46 Validation

Run context: main workspace, generated i18n policy; date: 2026-08-10.

- `npm run typecheck` and `npm run build` - passed.
- Built CLI dry-run and generation produced 164 CREATE operations, including `LocaleConfiguration.java`, `LocaleNegotiationTests.java`, and the three split architecture test classes.
- `mvn -B test '-Dspring.profiles.active=test'` against the freshly generated wallet project - Reactor `BUILD SUCCESS`; configuration ran 119 tests with 0 failures, 0 errors, 0 skipped, including both locale-negotiation tests.
- The two new golden files were copied from that fresh CLI output and their SHA-256 hashes matched the generated files.
- Focused Vitest producer/integration/smoke run - 4 test files and 27 tests passed; `npm test` - 48 test files and 212 tests passed; `npm run smoke:java-multimodule` - 1 test passed with golden byte comparisons.

## Milestone 6.47 Validation

Run context: main workspace, split generated ArchUnit suite; date: 2026-08-10.

- `npm run typecheck`, `npm run build`, and `npm test` passed.
- Fresh built-CLI dry-run and generation produced 164 CREATE operations and emitted `LayerDependencyArchitectureTests.java`, `FrameworkIsolationArchitectureTests.java`, and `PackageStructureArchitectureTests.java`.
- The three replacement goldens were copied from that fresh CLI output and their SHA-256 hashes matched the generated files.
- `npm run smoke:java-multimodule` passed its golden byte comparison.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:archunit:java-multimodule` passed and confirmed all three architecture Surefire reports.
- `mvn -B clean verify` against the freshly generated wallet project passed with Reactor `BUILD SUCCESS`.

## Milestone 6.48 Validation

Run context: main workspace, generated mutation testing capability; date: 2026-08-10.

- `npm run typecheck`, `npm run build`, and `npm test` passed.
- The full-profile count stayed at 164 CREATE operations: the PIT configuration is a Maven profile inside the existing `core/pom.xml`, not a new artifact.
- `mvn -B clean verify` against a freshly generated wallet project passed with Reactor `BUILD SUCCESS` and did not run PIT, confirming the `mutation` profile is inert by default.
- `mvn -B -P mutation -pl core verify` against the same project passed: 26 mutations generated, 24 killed (92%), 1 survived, 1 with no coverage, test strength 96%, line coverage of mutated classes 82/86 (95%), in roughly 19 seconds.
- `core/target/pit-reports/` contained `index.html`, `mutations.xml` and per-package output, with no timestamped subdirectory.
- PIT 1.19.1 - the version Maven Central's search API reports as latest - fails against this Golden Path with `Unsupported class file major version 69` because the generated project targets Java 25. The pinned 1.25.9 comes from `maven-metadata.xml`.
- The four changed goldens (`pom.xml`, `core/pom.xml`, `README.md`, `.github/workflows/java-ci.yml`) were copied from that fresh CLI output.

## Milestone 6.49 Validation

Run context: main workspace, generated Testcontainers verification; date: 2026-08-10.

- `npm run typecheck`, `npm run build`, and `npm test` passed (48 files, 212 tests).
- Fresh built-CLI dry-run produced 165 CREATE operations, up from 164, adding `WalletGatewayProviderIT.java`.
- `mvn -B clean verify` against a freshly generated wallet project passed with Reactor `BUILD SUCCESS` and 119 tests; the `*IT` compiled but did not run and no `failsafe-reports/` directory was produced, confirming Surefire ignores it.
- `mvn -B -P integration-test -pl infra/database -am verify` selected and executed `WalletGatewayProviderIT` through Failsafe.
- The container assertions did **not** execute on this machine: Testcontainers reported `Could not find a valid Docker environment`. Docker here runs inside WSL (`D:\Bin\docker.cmd` is `wsl docker`), exposing no Windows named pipe and no TCP endpoint, and WSL has no JDK. Neither the daemon nor WSL was reconfigured. The container path is covered by the new CI step and should be treated as unproven until that step runs green.
- Boot 4.1.0 manages Testcontainers 2.0.5 and PostgreSQL 42.7.11, so no version is restated in the generated POMs. Testcontainers 2.x renames the artifacts to `testcontainers-postgresql` / `testcontainers-junit-jupiter`, moves `PostgreSQLContainer` to `org.testcontainers.postgresql`, and drops its self-type generic.

## Milestone 6.50 Validation

Run context: main workspace, generated developer scripts and smoke requests; date: 2026-08-10.

- `npm run typecheck`, `npm run build`, and `npm test` passed (48 files, 212 tests).
- Fresh built-CLI dry-run produced 168 CREATE operations, up from 165, adding `run.sh`, `run.cmd` and `Smoke.http`.
- The generated `run.sh` was executed under `sh`: `help` printed all five tasks and an unknown task printed usage to stderr and exited 1.
- The generated `run.cmd` was executed under `cmd.exe` with the same two cases and identical behavior.
- `Smoke.http` renders `{{baseUrl}}` correctly through the Nunjucks `raw` escaping and emits well-formed JSON bodies.

## Milestone 6.51 Validation

Run context: main workspace, generated coverage threshold gate; date: 2026-08-10.

- `npm run typecheck`, `npm run build`, and `npm test` passed (48 files, 212 tests).
- Per-module coverage measured from the generated `jacoco.csv` after 6.41, 6.42, 6.49 and 6.50: `core` 0.917 line / 0.968 branch, `entrypoints/rest` 0.891 / 0.780, `infra/database` 0.872 / 0.650, `configuration` 0.880 / 0.429. The two modules ADR-060 flagged moved from 0.442 and 0.303 line coverage to 0.891 and 0.872.
- `mvn -B clean verify` against a freshly generated wallet project reported "All coverage checks have been met." for all four modules with Reactor `BUILD SUCCESS`.
- Negative test: raising the generated minimum to 0.95 and re-running `mvn -B verify` failed with `Rule violated for bundle wallet-service-core: lines covered ratio is 0.91, but expected minimum is 0.95`, confirming the rule is enforced and not merely declared.
- No branch rule was set. `configuration` has 14 branches in total and all 8 misses are in `CorsProperties` (5/12) and the anonymous `WebMvcConfigurer` in `CorsWebConfiguration` (1/2), so any uniform branch minimum above 0.42 fails every generated project and any minimum at or below it is vacuous.

## Documented facts

The following facts are documented in ADRs and target-architecture docs and are treated as current unless superseded by measured facts:

- The generated Java application follows Clean Architecture boundaries with inward dependencies.
- The generated Core remains Spring-free and JPA-free.
- REST representation belongs to `entrypoints-rest`.
- Persistence implementation belongs to `infra-database`.
- Spring wiring and cross-module composition belong to `configuration`.
- Production Swagger UI is disabled by default; local/test may enable it.
- CORS uses properties rather than hardcoded permissive origins.
- The REST error response body is `ResponseStatus`.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true` turns missing Maven from a skipped smoke into a failure.

## Limitations

- Profiles, template packs, and modules are resolved from local repository paths.
- The output root must exist before physical generation.
- There is no overwrite, skip, merge, rollback, remote registry, or plugin marketplace.
- The model does not yet express relationships, security, deployment, runtime health, advanced persistence options, or authorization intent.
- Partial module selections can be structural and are not guaranteed to be independently runnable unless a smoke explicitly validates that selection.
- Maven validation requires compatible Java and Maven installations and may download dependencies on first use.
