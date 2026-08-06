# Current State

Verification date: 2026-08-06
Baseline commit: `f9ce5490690511b3bacb89a20e22e4ca0074813e` (Milestone 6.29 changes measured against this commit are uncommitted at verification time; update this hash after the Milestone 6.29 commit lands)

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

Single-module dependencies:

- `application` requires `domain`.
- `bootstrap` requires `application`.
- `api-rest` requires `application`.

Multi-module dependencies:

- `entrypoints-rest` requires `core`.
- `infra-database` requires `core`.
- `configuration` requires `build`, `core`, `entrypoints-rest`, and `infra-database`.

### Dry-run counts

| Profile and selection | Dry-run count |
| --- | ---: |
| `java-spring-clean --module domain` | 1 CREATE |
| `java-spring-clean` full profile | 6 CREATE |
| `java-spring-clean-multimodule` full profile | 125 CREATE |
| `java-spring-clean-multimodule --module build` | 6 CREATE |
| `java-spring-clean-multimodule --module core` | 50 CREATE |
| `java-spring-clean-multimodule --module entrypoints-rest` | 69 CREATE |
| `java-spring-clean-multimodule --module infra-database` | 68 CREATE |
| `java-spring-clean-multimodule --module configuration` | 125 CREATE |
| `java-spring-clean-multimodule --module build --module core` | 56 CREATE |
| `java-spring-clean-multimodule --module build --module configuration` | 125 CREATE |

The `entrypoints-rest` and `infra-database` selections include `core` transitively. The `configuration` selection includes all required modules transitively.

### Capabilities and endpoints

Measured and documented implemented capabilities in the current Java multi-module Golden Path include:

- Maven reactor build structure.
- Core domain model, use cases, commands, ports, paging, filters, sorting model, and self-validation.
- REST entrypoints for collection reads, filtered paging, sorting, find-by-id, create, full replacement update, and delete.
- Database infrastructure with Spring Data JPA, H2 test support, persistence mappers, Querydsl predicates, paging adapters, and filter mapping.
- Runtime create, update, and physical delete behavior through Core and JPA, with delete exposed over REST as a non-idempotent operation.
- Configuration profiles, property-driven CORS, OpenAPI, Swagger UI environment policy, i18n message bundles, global REST error handling, ArchUnit tests, JaCoCo configuration, and generated Java CI.

Current documented REST surface:

| Operation | Endpoint | State |
| --- | --- | --- |
| Collection read, filtering, paging, and sorting | `GET /wallets` | Implemented |
| Individual read | `GET /wallets/{id}` | Implemented |
| Create | `POST /wallets` | Implemented |
| Full replacement update | `PUT /wallets/{id}` | Implemented |
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
- The generated Java CI uses Java 25 and `mvn -B clean verify`.

## Milestone 6.29 Validation

Run context: main workspace, generated Java runtime behavior change (REST Delete Integration); date: 2026-08-06.

- `npm run typecheck` - passed, exit 0.
- `npm run build` - passed, exit 0.
- `npm test` - passed, 44 test files and 145 tests.
- `npm run test:coverage` - passed, exit 0; Statements 90.03%, Branches 71.22%, Functions 96.73%, Lines 91.14%.
- `git diff HEAD --check` - passed, exit 0.
- All 10 dry-run selections re-measured and matched expected counts (see table above).
- `npm run smoke` and `npm run smoke:java-multimodule` - passed.

Maven smokes were run with `CODEGEN_REQUIRE_MAVEN_SMOKE=true` (Maven 3.9.9, OpenJDK 25):

- `smoke:http-delete:java-multimodule`, `smoke:delete-runtime:java-multimodule`, `smoke:http-update:java-multimodule`, `smoke:http-create:java-multimodule`, `smoke:find-by-id:java-multimodule`, `smoke:openapi:java-multimodule`, `smoke:archunit:java-multimodule`, `smoke:spring-context:java-multimodule`, `smoke:maven-reactor:java-multimodule` - all passed.
- Full generated Maven reactor (`mvn -B test`) - BUILD SUCCESS across all five modules; `WalletHttpDeleteTests` 5/5 and `WalletOpenApiSmokeTests` 8/8 confirmed via surefire XML.

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
