# NestJS Reference Architecture

This document analyzes the NestJS clean-architecture reference project used to seed the
`nestjs-clean-architecture` Golden Path, the same way [Extended Reference Architecture](EXTENDED-REFERENCE-ARCHITECTURE.md)
analyzed the Java Wallet Service reference for the Java Golden Paths. It is a source-project
analysis, not the architecture of the generator or of generated output. Decisions and rationale
derived from it are recorded in [ADR-057](../adr/ADR-057-nestjs-as-second-golden-path.md).

## Scope

The reference project is a small hand-written NestJS application implementing two use cases
(register a user, get a user by name) over a single domain entity, plus a health-check endpoint.
It is not itself production software; like the Java Wallet Service, its value is as an
architectural example, not as a feature-complete application to copy wholesale.

## Source project

`nestjs-clean-architecture-example`, held in a local workspace outside this repository and not
vendored into it. Author: same author as the Java Wallet Service reference used by ADR-011. Stack:
NestJS, TypeScript, in-memory persistence (no database, no ORM). The project's own README states its
design is modeled on Robert C. Martin's Clean Architecture and Screaming Architecture, the "NODB"
principle (architecture should not be database-centric), and Alistair Cockburn's Hexagonal
Architecture (Ports and Adapters).

## Analysis methodology

Every convention below is classified, per ADR-011/ADR-057's discipline, as belonging to
Application Model, Profile, Module, Technology Adapter, Rule, Transformer, or Template — not
copied automatically into generator output. Sections are grouped by architectural layer, mirroring
the reference project's own top-level split.

## Architectural inventory

Three top-level source directories, dependencies pointing inward:

```text
web-api  -> core
infra    -> core
core     -> (nothing)
```

* `core/` — domain models and use cases. No NestJS or framework imports anywhere in this layer.
* `infra/` — persistence-side models, mappers, repositories, and gateway-implementing providers.
* `web-api/` — NestJS-specific delivery: controllers, DTOs, filters, interceptors, modules.

Within `core/usecases` and `web-api/entrypoints`, structure is further sliced by use case (one
folder per business action), so the layering is layer-first, feature-second — the same shape as
the Java multi-module Golden Path's Maven-module-first, use-case-second organization.

## Core and domain patterns

* Domain entities are plain classes with no ORM or validation decorators — classified as
  **Application Model** (already covered by the existing technology-agnostic IR; no new IR fields
  are needed for the initial slice).
* Each use case owns: a self-validating input object (command for writes, query for reads), a
  validator, a use-case interface plus dependency-injection token, an implementation, and — where
  the use case depends on other use cases' data — a gateway port interface. Classified as
  **Module** (`core`) and **Rule** (which files a use case requires) rather than a single
  **Template** — one use case is not one artifact.
* An injectable clock port abstracts the current time for testability. Classified as **Technology
  Adapter** pattern worth reusing conceptually (the Java Golden Path has an equivalent `GetLocalDateTime`
  port for its auditing capability), but not implemented in the initial slice, since auditing is
  explicitly deferred.
* A domain exception hierarchy (base exception plus not-found, unique-constraint, and validation
  subtypes) is classified as **Rule**: the initial slice needs no exception hierarchy since it
  generates no use cases yet; this becomes relevant starting at the use-case-layer milestone.

## Infra and persistence patterns

* A mapper class converts between the domain entity and a separate persistence-side entity class,
  even though today both are structurally identical and there is no real database. This mapper
  pattern is classified as **Rule**: keep the separation from the first persistence milestone
  onward, so introducing a real ORM later does not require retrofitting a mapper boundary.
  Rationale from the reference project's own README: entity/table mapping objects can diverge
  significantly from domain entities once a real ORM is introduced, and using core entities
  directly for that mapping is explicitly discouraged.
* The repository itself is a bare in-memory array. Classified as the initial **Technology Adapter**
  for the `infra-persistence` module — no database or ORM decision is made by ADR-057.
* Providers implement the use-case gateway interfaces and delegate to the repository through the
  mapper. Classified as **Module** (`infra-persistence`) content, one provider per gateway.

## Web-API and REST patterns

* Each entrypoint splits into an undecorated controller class (holding the actual delegation logic,
  framework-decorator-free) and a separate NestJS `@Controller`-decorated wrapper that delegates to
  it. Classified as a **Rule** worth evaluating, not automatically adopting: it exists in the
  reference to ease unit testing independent of NestJS decorators, but doubles the file count per
  endpoint. Deferred to the web-api-layer milestone for a deliberate decision rather than decided
  here.
* Global exception filters translate each domain exception type to an HTTP status. Classified as
  **Module** content, explicitly deferred (depends on the exception hierarchy above).
* A generic response envelope and a response-transforming interceptor wrap all responses in a
  consistent shape. Classified as **Rule** and adopted by milestone 7.11 with transport-level
  status/header handling while preserving existing JSON body shapes.
* Dependency injection uses a `Symbol()` token co-located with every port interface, wired in each
  feature's NestJS `@Module` via `{ provide: TokenSymbol, useClass: Implementation }`. Classified
  as **Technology Adapter** convention to reuse directly once the `bootstrap` module is
  implemented — it is the NestJS-idiomatic equivalent of the Java Golden Path's explicit Spring
  wiring in its `configuration` module (ADR-015).

## Cross-cutting capabilities observed

Present in the reference, all explicitly deferred by ADR-057 pending their own milestones:
OpenAPI/Swagger documentation, a
request-timing interceptor, environment configuration through `@nestjs/config` and a single `.env`
file (no per-environment profile split).

Not present in the reference, and therefore not inherited as defaults: sorting, soft delete, real
authentication/authorization enforcement (only a Swagger security-scheme
annotation, not an enforced guard), CORS configuration, and any architecture-boundary lint tool
(no dependency-cruiser or ESLint boundary rules were found; layering is enforced by convention
only). This absence is itself useful precedent: the reference project does not assume an
ArchUnit-equivalent guardrail is mandatory from day one, consistent with ADR-017's conservative
baseline discipline for the Java Golden Path.

## Testing strategy

Unit tests are colocated with source (`*.spec.ts`), targeting 100% coverage in the reference
project's own Jest configuration. A separate top-level `test/` directory holds whole-application
end-to-end tests using NestJS and `supertest`. The generated path now follows this layout with a
native Jest e2e command. The reference project also runs
Stryker mutation testing and a SonarCloud quality gate in CI.

Classified as **Rule** for the generator's own quality gates (not generated-output requirements):
the generated-project-runs quality gate mirrors the Java Golden Path's Maven-required-smoke
precedent rather than adopting the reference project's 100%-coverage threshold or its
mutation-testing/SonarCloud setup, which are that project's own authoring choices, not
requirements this generator must reproduce in what it generates. That gate now exists
([ADR-073](../adr/ADR-073-nestjs-generated-project-quality-gate.md)): it installs dependencies,
builds, runs the generated Jest suite, and exercises a freshly generated NestJS project over HTTP.
The generator does not adopt the reference project's 100% coverage threshold or mutation-testing
and SonarCloud setup.

## Comparison with the Java Golden Path

| Concept | Java Golden Path | NestJS reference |
| --- | --- | --- |
| Layering | Maven multi-module (`core`, `entrypoints-rest`, `infra-database`, `configuration`) | Single package, folder-layered (`core`, `web-api`, `infra`) |
| Domain purity | Core module is Spring-free, JPA-free, REST-free | `core/` has zero NestJS imports |
| DI wiring | Explicit Spring `@Configuration` beans (ADR-015) | Explicit NestJS `@Module` provider bindings keyed by DI symbols |
| Persistence mapping | JPA entity distinct from domain model, mapped explicitly | Persistence model distinct from domain model, mapped explicitly |
| Initial persistence | Deferred past the first several milestones | In-memory only in the reference; deferred by ADR-057 in the same way |
| Architecture guardrail | ArchUnit (ADR-024), a default baseline capability | Not present in the reference; not adopted as a default in the initial NestJS scope |

The layering and dependency-direction principles transfer directly. The physical module boundaries
do not: Java's Maven-module boundaries are physical (build-enforced), while the NestJS reference's
`core`/`infra`/`web-api` boundaries are folder-level within one package. ADR-057's initial module
set (`build`, `core`, `infra-persistence`, `web-api`, `bootstrap`) follows the reference project's
folder-level boundaries rather than inventing a multi-package layout, consistent with ADR-014's
sequencing (single-module before multi-module, if a multi-module variant is ever scheduled).

## Milestone 7.0 conclusion

The reference project's layering, DI convention, and mapper-pattern discipline are directly
reusable. Its capability set (no sorting, soft delete, real persistence, enforced authentication,
or architecture-boundary lint) supports a conservative initial scope for
the `nestjs-clean-architecture` Golden Path, consistent with how the Java Golden Path started
narrow and grew one milestone at a time. No IR/Application Model changes are required to begin
implementation. Milestone 7.1 refactors CLI producer dispatch into a registry before any NestJS
producer exists; Milestone 7.2 then implements only the `core` domain-model slice described in
ADR-057's Initial Scope.
