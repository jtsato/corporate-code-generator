# Capability Taxonomy and Profile Options

This document defines the vocabulary used to describe generated-application capabilities and profile options. It does not record current artifact counts or milestone history; use [Current State](../project/CURRENT-STATE.md) for measured facts and [Roadmap](../../ROADMAP.md) for release status.

The normative taxonomy decision is [ADR-017](../adr/ADR-017-capability-taxonomy-and-profile-options.md). The generated Java architecture is described in [Generated Java Reference Architecture](REFERENCE-ARCHITECTURE.md).

## Core mental model

The generator distinguishes five concepts:

| Concept | Meaning | Examples |
| --- | --- | --- |
| Physical module | Maven/source ownership and dependency boundary | `core`, `entrypoints-rest`, `infra-database`, `configuration` |
| Capability | Coherent generated behavior and artifact set | `archunit`, `openapi`, `global-error-handling`, `paging`, `filtering`, `crud` |
| Technology option | Implementation selected inside a capability | `persistence.type: jpa`, `dynamicQueries: querydsl` |
| Environment option | Runtime exposure/configuration by environment | `openapi.ui.enabled`, CORS origins, datasource variables |
| Quality capability | Build/test verification behavior | `jacoco`, `pit`, `archunit`, Maven reactor smoke |

A capability is not an alias for a template, and a physical module is not a capability. A capability may emit artifacts into several physical modules. A technology option may constrain which capabilities are valid.

The term common artifact set is documentary: it groups related artifacts that belong to existing layers. It does not introduce a new schema entity.

## Capability ownership

| Capability area | Primary generated owner | Notes |
| --- | --- | --- |
| Domain model | `core` | Technology-neutral domain state and behavior. |
| Use cases and ports | `core` | Application policy and inward-facing contracts. |
| REST API | `entrypoints-rest` | HTTP representation and parsing. |
| Persistence | `infra-database` | Technology-specific adapters implementing Core ports. |
| Runtime wiring | `configuration` | Spring composition and environment configuration. |
| Build | `build` | Reactor/build metadata. |
| Quality | Usually `configuration` plus build metadata | Architecture tests, coverage configuration, generated CI. |

## Baseline capabilities

The current Java multi-module Golden Path includes a baseline set of architecture, runtime, and quality capabilities. Current support and counts are listed in [Current State](../project/CURRENT-STATE.md).

Conceptually, baseline capabilities include:

- Maven reactor build foundation;
- generated Core domain/application structure;
- REST entrypoint foundation;
- database infrastructure foundation;
- explicit Spring wiring;
- ArchUnit guardrails;
- JaCoCo-oriented quality configuration;
- global REST error handling;
- basic i18n;
- property-driven CORS;
- OpenAPI specification;
- environment configuration profiles;
- Core self-validation;
- Core paging model;
- Spring Data paging adapter;
- Core filter model;
- REST filter contract;
- Querydsl filter mapper and runtime integration;
- filtered paging runtime;
- REST filtered paging;
- REST sorting;
- find-by-id runtime and REST integration;
- create runtime and REST integration;
- update runtime and REST integration;
- partial update (PATCH) runtime and REST integration;
- delete runtime and REST integration with soft-delete persistence.
- attribute-level active uniqueness.

## Explicit opt-in or future capabilities

The following require explicit future profile selection, environment configuration, or independent ADRs before becoming defaults:

- Swagger UI exposure beyond local/test policy;
- PIT mutation testing as a mandatory gate;
- Docker and Docker Compose;
- Testcontainers;
- security foundation;
- resource server integration;
- Keycloak provider integration;
- additional databases;
- Querydsl MongoDB;
- JPA Entity Graph;
- MapStruct;
- P6Spy;
- optimistic locking;
- auditing;
- ETags and conditional requests;
- relationship-driven generation;
- deployment and infrastructure scaffolding.

Security is split into provider-neutral capabilities and provider options. Keycloak is not implied merely because security is enabled.

## Core dependency boundary

The Core may use stable, technology-neutral contracts where explicitly adopted, such as Jakarta Validation API. The Core must not depend on:

- `org.springframework.*`;
- JPA or Hibernate implementation details;
- persistence, web, or security-provider annotations;
- REST representation classes;
- concrete database or framework runtime types.

Provider dependencies such as Hibernate Validator can be supplied by runtime/test composition, but they must not define the Core contract.

## Validation policy

| Validation context | Preferred style | Support |
| --- | --- | --- |
| Simple immutable domain object | Constructor-driven self-validation | Current Java baseline |
| Validation requiring service/configuration dependencies | Factory or service driven | Future design guidance |
| Validation requiring persistence/external infrastructure | Port driven | Future design guidance |

Generated validation must stay deterministic. REST DTO validation is separate from Core self-validation and must be adopted explicitly when expanded.

## Error response contract

The Java Golden Path uses `ResponseStatus` as the canonical REST error body. It belongs to `entrypoints-rest`, not Core. Core exceptions carry stable keys/defaults; REST translates them to HTTP-specific responses.

The baseline response has:

- numeric HTTP status code;
- general message;
- deterministic field-level errors.

Additional fields such as timestamp, path, trace ID, exception details, and stack traces are not default contract fields.

## Locale policy

Baseline locale policy:

- default locale: `en`;
- supported locales documented by the generated message bundles;
- input through standard `Accept-Language`;
- fallback from exact locale to base language where applicable, then default.

Cookie persistence and custom locale mutation headers or query parameters are not defaults.

## Paging, filtering, and sorting boundary

Core paging and filtering are technology-neutral. REST parsing is an entrypoint concern. Querydsl mapping is an infrastructure concern.

Baseline REST paging policy:

- zero-based page numbering;
- default page `0`;
- default size `20`;
- deterministic validation through generated Core/rest paths;
- sort fields restricted by an allowlist generated from entity attributes.

Search and advanced filtering intent are not inferred beyond adopted capability behavior. Future model extensions must declare richer search semantics explicitly.

## Persistence technology options

Current persistence support uses JPA-oriented infrastructure in the generated Java Golden Path. Conceptual future options include:

```text
persistence.type: jpa | mongodb
dynamicQueries: none | querydsl
integrationTests: h2 | testcontainers
```

Entity Graph and relationship-specific fetch plans require relationship semantics in the Application Model before they can be generated safely.

## Quality options

| Quality capability | Default posture |
| --- | --- |
| ArchUnit | Baseline for generated multi-module architecture guardrails. |
| JaCoCo | Baseline quality capability for coverage-oriented reporting. |
| Maven reactor smoke | Baseline release/readiness gate for generated Java runtime. |
| PIT | Opt-in; not a default pull-request gate. |
| Testcontainers | Opt-in and technology-specific. |
| Docker Compose | Local developer convenience, not the primary CI integration-test primitive. |

Validation command policy is maintained in [Quality Gates](../project/QUALITY-GATES.md).

## OpenAPI, UI, and environment options

OpenAPI specification generation is baseline for the Java multi-module Golden Path. Swagger UI is environment-gated and must not be assumed safe for production exposure by default.

Illustrative option vocabulary:

```text
openapi.spec: enabled
openapi.ui: local-only
environment.local: openapi.ui
environment.test: openapi.ui
environment.prod: openapi.ui.disabled
```

## Security and authorization options

Security remains future work. The conceptual split is:

- `security-foundation`;
- `security-resource-server`;
- `security-keycloak`;
- `security-test`.

Authorization intent should be modelled semantically, not hardcoded as framework/provider strings in templates. A technology adapter may translate semantic authorization intent into provider-specific authorities.

## Profile option vocabulary

The following vocabulary is approved conceptually but is not a current schema contract:

```text
capabilities:
  archunit: enabled
  jacoco: enabled
  global-error-handling: enabled
  i18n: basic
  cors: configured
  openapi.spec: enabled
  openapi.ui: local-only
  core-paging: enabled
  core-filter: enabled

options:
  persistence.type: jpa
  dynamicQueries: none | querydsl
  integrationTests: h2 | testcontainers
  security.provider: none | keycloak
  mapping: manual | mapstruct
  sqlDiagnostics: disabled | p6spy

environment:
  local: openapi.ui, developer conveniences
  test: h2, archunit
  prod: environment-supplied datasource/secrets
```

Future schema work must validate incompatible combinations, such as a provider option without its owning capability.

## Support matrix

| Area | Current posture | Notes |
| --- | --- | --- |
| Java Clean Architecture single-module | Supported | Current measured facts are in Current State. |
| Java Clean Architecture multi-module | Supported | Current measured facts are in Current State. |
| REST read/filter/page/sort | Supported in Java multi-module | See Generated Java Reference Architecture. |
| REST create/update/partial update | Supported in Java multi-module | PUT is full replacement; PATCH tracks supplied fields and explicit null. |
| Delete runtime and REST integration | Supported in Java multi-module | Soft delete retains the row, filters tombstones from normal flows, and repeated delete returns not found rather than being idempotent. |
| Attribute-level active uniqueness | Supported in Java multi-module | `unique: true` uses a composite constraint with the technical deletion scope, allowing reuse after soft delete. |
| Composite active uniqueness | Supported in Java multi-module | `uniqueGroups` declares attribute-name tuples; each tuple is constrained with the technical deletion scope and checked against active rows. |
| Deleted-only queries and restore | Supported in Java multi-module | Explicit `/deleted` query routes return tombstone views; `POST /{id}/restore` returns 204, with 404/409 error semantics. |
| NestJS Clean Architecture generated Core validation and tests | Supported in NestJS Golden Path | Create commands and find-by-id queries validate semantic primitive values in framework-free Core; colocated Jest tests cover validation short-circuiting and gateway delegation; the web layer maps violations to HTTP 400. |
| Security | Planned/future | Requires explicit model/profile decisions. |
| Deployment/IaC | Planned/future | Not implied by current Java Golden Path. |
| Additional languages/stacks | NestJS supported; others planned/future | Additional Golden Paths must preserve technology-agnostic Core/model boundaries. |

## Compatibility and non-regression rules

1. Existing Golden Paths must remain compatible unless an approved milestone explicitly changes them.
2. No capability is inferred merely from a library appearing in a reference project.
3. No capability may force undeclared domain intent into templates.
4. Physical module boundaries remain explicit and inward-facing.
5. Technology options remain outside the technology-agnostic Core model.
6. Every implemented capability requires tests and, where output changes, golden updates.
