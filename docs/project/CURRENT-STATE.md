# Current State

Verification date: 2026-08-06
Baseline commit: `07c70dc`

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
| `java-spring-clean-multimodule` full profile | 131 CREATE |
| `java-spring-clean-multimodule --module build` | 6 CREATE |
| `java-spring-clean-multimodule --module core` | 54 CREATE |
| `java-spring-clean-multimodule --module entrypoints-rest` | 74 CREATE |
| `java-spring-clean-multimodule --module infra-database` | 72 CREATE |
| `java-spring-clean-multimodule --module configuration` | 131 CREATE |
| `java-spring-clean-multimodule --module build --module core` | 60 CREATE |
| `java-spring-clean-multimodule --module build --module configuration` | 131 CREATE |

The `entrypoints-rest` and `infra-database` selections include `core` transitively. The `configuration` selection includes all required modules transitively.

### Capabilities and endpoints

Measured and documented implemented capabilities in the current Java multi-module Golden Path include:

- Maven reactor build structure.
- Core domain model, use cases, commands, ports, paging, filters, sorting model, and self-validation.
- REST entrypoints for collection reads, filtered paging, sorting, find-by-id, create, full replacement update, partial update, and delete.
- Database infrastructure with Spring Data JPA, H2 test support, persistence mappers, Querydsl predicates, paging adapters, and filter mapping.
- Runtime create, update, and soft-delete behavior through Core and JPA, with delete exposed over REST as a non-idempotent operation. Attribute-level `unique: true` values are reusable after soft deletion through the generated active-scope constraint.
- Configuration profiles, property-driven CORS, OpenAPI, Swagger UI environment policy, i18n message bundles, global REST error handling, ArchUnit tests, JaCoCo configuration, and generated Java CI.

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
- The generated Java CI uses Java 25 and `mvn -B clean verify`.

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
