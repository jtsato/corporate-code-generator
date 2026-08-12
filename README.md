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
- Overwrite, merge, rollback, remote registries, and untrusted template-pack execution are not implemented.
- The Application Model remains intentionally small and does not yet express relationships, security, deployment, or advanced operational intent.
- Future capabilities are tracked in the [Roadmap](ROADMAP.md), not implied by reference material.
