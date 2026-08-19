# Corporate Code Generator

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)

Corporate Code Generator is a deterministic, model-driven application scaffolding platform. It transforms an application model, a Golden Path profile, versioned rules, and templates into a planned set of generated artifacts.

AI can assist development of the generator, models, tests, templates, and documentation, but AI is not part of the generation runtime.

## Principles

- The model and IR express semantic intent, not framework concepts.
- Rules and transformers make generation decisions.
- Technology adapters map semantic concepts to technology-specific representations.
- Templates render prepared template models; they do not decide what to generate.
- Rendering produces content, and filesystem mutation happens only through a validated File Plan.
- Identical declared inputs and versions must produce identical output.

## Golden Paths

- `java-spring-clean`: single-module Java/Spring Clean Architecture scaffold.
- `java-spring-clean-multimodule`: multi-module Java/Spring Clean Architecture scaffold with build, core, REST entrypoint, database infrastructure, and configuration modules.
- `nestjs-clean-architecture`: TypeScript/NestJS Clean Architecture scaffold with build, core, persistence infrastructure, web-api, and bootstrap modules.

For measured profile versions, module selections, artifact counts, implemented runtime capabilities, scripts, smoke files, and CI state, see [Current State](docs/project/CURRENT-STATE.md).

## What the generator does today

The product is a generator of application scaffolds, not a single Wallet application. It reads a declarative YAML application model, validates it, resolves a local Golden Path and template pack, builds a validated File Plan, and either previews or writes the generated artifacts.

The current model schema supports applications, entities, primitive attributes (`string`, `boolean`, `int32`, `int64`, `decimal`, `uuid`, `date`, and `datetime`), identifiers, required values, attribute uniqueness, composite unique groups, and optional auditing fields. The schema is currently version `1.0`.

The CLI currently provides:

- `validate` for structural and semantic model validation;
- `generate` for complete or module-scoped generation;
- `--dry-run` for printing the File Plan without filesystem writes;
- deterministic generation from identical declared inputs and versions.

### Generated application capabilities

The Java multi-module Golden Path is the most complete path. It generates a Clean Architecture Spring Boot application with Maven modules for build, Core, REST, persistence, and configuration. Its generated runtime includes:

- REST collection reads with filtering, paging, and sorting;
- find-by-id, create, full update, partial update, and delete;
- soft delete, deleted-record queries, and restore;
- Spring Data JPA, Querydsl, and an in-memory H2 runtime datasource;
- validation, standard REST errors, English/Portuguese i18n, CORS, OpenAPI, and environment profiles;
- optional attribute/composite uniqueness and auditing (`createdAt`/`updatedAt`);
- Actuator health checks, Docker/Compose packaging, generated tests, architecture and coverage gates, developer scripts, and CI configuration.

The NestJS Golden Path is a functional but intentionally smaller second path. It generates a Clean Architecture TypeScript/NestJS application with framework-free Core, in-memory persistence, CRUD REST endpoints, pagination, `eq`/`ne` filtering, validation, response envelopes, health checks, Swagger UI, basic English/Portuguese messages, and generated Jest/Supertest tests.

The detailed measured inventory and profile-specific endpoint tables are maintained in [Current State](docs/project/CURRENT-STATE.md).

## What is still missing

The largest current gap is NestJS capability parity. The NestJS path still needs sorting, real database/ORM persistence, soft delete and restore, uniqueness, auditing, CORS and environment profiles, generated repository hygiene, container packaging, CI, advanced i18n, and an architecture-boundary lint.

The generator platform itself still does not model or generate:

- relationships between entities;
- authentication, authorization, or security-provider integration;
- optimistic locking, ETags, or conditional requests;
- additional databases, migrations, Entity Graphs, MapStruct, or P6Spy;
- deployment, Kubernetes/Helm, Terraform, or broader infrastructure-as-code;
- additional languages and architectural styles beyond the current Golden Paths;
- remote profile/template registries, plugin systems, or a public marketplace.

Generation currently targets new local scaffolds. Overwrite, merge, incremental update, rollback, and safe execution of untrusted template packs are not implemented. Output roots must already exist, and partial module selections are not guaranteed to be independently runnable unless explicitly covered by a quality gate.

These gaps are tracked in the [Roadmap](ROADMAP.md); the reference architecture documents describe intended future capabilities and must not be read as claims that those capabilities already exist.

## Prerequisites

- Node.js 22 or later.
- npm.
- Java and Maven only when running generated Java or Maven smoke validations.

Install dependencies from the repository root:

```bash
npm install
```

## Validate the generator

```bash
npm run typecheck
npm run build
npm test
```

Additional smoke and Maven validation commands are documented in [Quality Gates](docs/project/QUALITY-GATES.md).

## Validate a model

After building the CLI:

```bash
node packages/cli/dist/index.js validate examples/wallet-service/model.yaml
```

## Preview generation with dry-run

Dry-run prints the File Plan without writing files:

```bash
node packages/cli/dist/index.js generate examples/wallet-service/model.yaml \
  --profile java-spring-clean-multimodule \
  --module core \
  --dry-run
```

## Generate files

The output directory must already exist:

```bash
mkdir generated
node packages/cli/dist/index.js generate examples/wallet-service/model.yaml \
  --profile java-spring-clean-multimodule \
  --output generated
```

## Repository structure

```text
packages/                 TypeScript workspaces for core, adapters, CLI, template engine, and file writer
profiles/                 Golden Path profile manifests
template-packs/           Versioned artifact templates and manifests
examples/                 Input application models
tests/                    Integration, golden, and smoke tests
docs/                     Product, architecture, target architecture, ADR, and project documentation
```

## Documentation

- [Documentation index](docs/README.md)
- [Roadmap](ROADMAP.md)
- [Current State](docs/project/CURRENT-STATE.md)
- [Quality Gates](docs/project/QUALITY-GATES.md)
- [Solution Specification](docs/SOLUTION-SPECIFICATION.md)
- [Generated Java Reference Architecture](docs/target-architecture/REFERENCE-ARCHITECTURE.md)
- [NestJS Reference Architecture](docs/target-architecture/NESTJS-REFERENCE-ARCHITECTURE.md)
- [Capability Taxonomy](docs/target-architecture/CAPABILITY-TAXONOMY.md)
- [ADR index](docs/adr/README.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)

## Current limitations

- Profiles, template packs, and module selections are resolved locally.
- Output roots must exist before physical generation.
- The Application Model remains intentionally small and does not yet express relationships, security, deployment, or advanced operational intent.
- Partial module selections can be structural and are not guaranteed to be independently runnable.
- Current capability status is tracked in [Current State](docs/project/CURRENT-STATE.md); future work is tracked in the [Roadmap](ROADMAP.md).
