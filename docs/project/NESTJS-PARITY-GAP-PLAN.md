# NestJS Parity Gap Plan

## Purpose

This document turns the remaining NestJS Golden Path parity gap into a sequenced set of
Phase 7 milestones. It is the NestJS counterpart of the
[Wallet Reference Gap Plan](WALLET-REFERENCE-GAP-PLAN.md), which performed the same job for the
Java Golden Path and is now closed with milestones 6.37 through 6.51 all Done.

It records the gap inventory, the structural decisions each gap forces, and the milestone
sequence. It does not record measured artifact counts — those belong in
[Current State](CURRENT-STATE.md) — and it does not decide anything an ADR must decide; each
milestone still carries its own ADR.

## Baseline and what this plan is not

The baseline is the `nestjs-clean-architecture` profile as it stands after milestone 7.19: the
full-profile example emits 90 CREATE operations for `examples/wallet-service`, with a
framework-free Core, transport-level response envelopes, pagination, filtering, sorting, full
CRUD including PATCH, health checks, package-backed `nestjs-i18n` catalogs, and in-memory
uniqueness.

Two sources define "parity" here, and they disagree:

1. **The Java Golden Path**, which is ahead on persistence, soft delete, restore, auditing, CORS,
   environment profiles, repository hygiene, container packaging, generated CI, locale policy, and
   an architecture guardrail.
2. **The local reference project** at `C:\Dev\99-sandbox\nestjs-clean-architecture-example`, from
   which Phase 7 was seeded by [ADR-057](../adr/ADR-057-nestjs-as-second-golden-path.md).

The disagreement is load-bearing and is the main thing this plan has to be explicit about. Per
[NestJS Reference Architecture](../target-architecture/NESTJS-REFERENCE-ARCHITECTURE.md), the
reference project has **no database and no ORM**, **no CORS configuration**, and **no
architecture-boundary lint tool** — layering there is enforced by convention only. It does have
`@nestjs/config` with a single `.env` file and no per-environment profile split.

So most of the remaining gap cannot be closed by copying the reference the way milestones 7.9
through 7.19 largely could. Closing it means **deliberately going beyond the reference toward the
Java Golden Path's capability set**. Every such departure is called out below as a structural
decision rather than presented as an obvious gap. ADR-084 set the precedent for the opposite
choice — it declined to introduce persistence technology absent from the reference — so the
departure needs to be approved, not assumed.

What this plan is not: a claim that the two Golden Paths should converge on identical artifacts.
They target different ecosystems. Parity means comparable *capabilities* and a comparable *REST
contract*, not mirrored file layouts.

## Gap inventory

Each row records the Java precedent, what the reference project does, and the classification.

| # | Gap | Java precedent | Reference project | Classification |
| --- | --- | --- | --- | --- |
| G1 | Generated `.gitignore` and `README.md` | 6.37 / [ADR-058](../adr/ADR-058-generated-repository-hygiene.md) | present | generator foundation; no departure |
| G2 | Architecture-boundary enforcement | ArchUnit, 6.47 suite split / [ADR-068](../adr/ADR-068-generated-archunit-suite-split.md) | **absent** — convention only | **DEPARTURE** (decision N6) |
| G3 | Environment configuration profiles | 6.4 / [ADR-026](../adr/ADR-026-configuration-profiles-and-cors-policy.md) | `@nestjs/config`, single `.env`, no profile split | partial departure (decision N4) |
| G4 | CORS policy | 6.4 / ADR-026 | **absent** | **DEPARTURE** (decision N5) |
| G5 | Container packaging | 6.45 / [ADR-066](../adr/ADR-066-generated-docker-capability.md) | absent | optional capability, opt-in |
| G6 | Generated continuous integration | 6.44 / [ADR-065](../adr/ADR-065-generated-ci-hardening.md) | present (Stryker + SonarCloud) | adopt the shape, not that project's thresholds |
| G7 | Advanced locale negotiation | 6.46 / [ADR-067](../adr/ADR-067-generated-i18n-policy-completion.md) | catalogs only, no explicit policy | policy completion on top of 7.19 |
| G8 | Real database and ORM | Spring Data / [ADR-016](../adr/ADR-016-spring-data-repository-foundation.md) | **absent** — in-memory only | **DEPARTURE** (decisions N1, N2, N3) |
| G9 | Soft delete and restore | 6.32 / [ADR-052](../adr/ADR-052-soft-delete-active-uniqueness.md), 6.33 / [ADR-053](../adr/ADR-053-restore-include-deleted-queries.md) | absent | depends on G8 (decision N7) |
| G10 | Auditing (`createdAt`/`updatedAt`) | 6.35 / [ADR-055](../adr/ADR-055-auditing-created-updated-at.md) | absent | depends on G8 (decision N8) |
| G11 | Multi-module variant | `java-spring-clean-multimodule` / [ADR-014](../adr/ADR-014-separate-java-golden-paths.md) | single package, folder-layered | structural variant, not a capability (decision N10) |

G8 is the pivot. G9 and G10 are cheap once it lands and expensive to fake before it: implementing
tombstones and audit columns against the in-memory adapter would produce behavior that has to be
rewritten when the ORM arrives, which is exactly the retrofit that ADR-057's mapper-boundary Rule
was written to avoid.

## Structural decisions required

Recommendations are stated so they can be approved or overridden as a set. They follow the
project's conservative-baseline discipline: prefer no new generated dependency, and prefer
mirroring an existing Java contract over inventing a second one.

| ID | Question | Java today | NestJS today | Recommendation |
| --- | --- | --- | --- | --- |
| N1 | ORM technology | JPA/Hibernate, Spring Data, Querydsl | none | **TypeORM** via `@nestjs/typeorm`. It plugs directly into the persistence-model plus mapper seam that ADR-057 already mandates, and its soft-delete and timestamp column semantics map onto the Java contracts, keeping G9 and G10 small. **Prisma rejected**: its schema file is a second source of truth outside the Application Model, and its client means generated code inside generated code. **MikroORM rejected**: closest to JPA semantics but a materially smaller ecosystem for no capability gain. |
| N2 | Database engine and test strategy | PostgreSQL runtime, H2 slices, Testcontainers opt-in at 6.49 | not applicable | PostgreSQL as the configured runtime; generated persistence tests run against **in-memory SQLite** through TypeORM, mirroring the H2 precedent. Testcontainers deferred to its own opt-in milestone exactly as Java deferred it to 6.49. **Risk the ADR must state**: SQLite dialect divergence can hide PostgreSQL-only failures; Java accepted the same class of risk with H2. |
| N3 | Does the in-memory adapter survive? | not applicable | it is the only adapter | **Yes** — it becomes a technology option (`persistence: memory` or `typeorm`) in the taxonomy's sense. The default stays `memory` at 7.26. Flipping the default is a separate later decision, because the generated-project smoke must stay runnable without Docker or a database. |
| N4 | Environment configuration shape | `application-{local,test,prod}.yaml` plus Spring profiles | none generated | `@nestjs/config` with `NODE_ENV`-selected `.env.{local,test,production}` files plus a committed `.env.example`. Validation is a **generated `validateEnvironment()` function that throws listing the missing keys** — no Joi, no zod. This adopts the reference's `@nestjs/config` while adding the profile split Java has. |
| N5 | CORS | property-driven, ADR-026 | none | `enableCors()` driven by the same env configuration (`CORS_ALLOWED_ORIGINS`, methods, headers, credentials, max-age), **disabled when unset**, with names tracking ADR-026 as closely as the environment-variable idiom allows. |
| N6 | Boundary enforcement | ArchUnit, a default baseline capability | none | **Two enforcement points from one source of truth**, the profile `requires` graph: (a) a **repo-side** validation that renders each single-module selection and asserts every relative import resolves within the files that selection actually produces — this is what mechanically catches the [ADR-081](../adr/ADR-081-nestjs-composition-root-wiring.md) defect class; (b) a **generated** ESLint flat config using `no-restricted-imports` zones so the generated project self-enforces. `eslint-plugin-boundaries` rejected as an avoidable generated dependency. |
| N7 | Soft delete and restore contract | ADR-052 and ADR-053 | none | **Mirror the Java REST contract exactly** — same routes, same deleted-only query semantics, same restore command, same conflict behavior — so the two Golden Paths stay contract-comparable. Implement with TypeORM `@DeleteDateColumn` and `withDeleted`. |
| N8 | Auditing timestamp source | Core clock port, ADR-055 | none | **Core clock port**, not TypeORM `@CreateDateColumn`/`@UpdateDateColumn`; the ORM columns stay plain. This keeps generated tests deterministic and preserves parity with the Java design. Opt-in per entity, as in 6.35. |
| N9 | Locale negotiation policy | explicit default, allowlist, fallback disabled, three negotiation tests at 6.46 | catalogs plus `AcceptLanguageResolver`, policy implicit | Mirror 6.46: explicit `en` default, an `en`/`pt-BR` allowlist, `q`-weight honored, unsupported tags falling back rather than erroring, and the same three generated test cases — supported, unsupported, and missing header. |
| N10 | Multi-module variant | separate profile and template pack, ADR-014 | folder-layered single package | **Schedule it last and treat it as a variant, not a capability.** It means npm workspaces and per-package tsconfig project references — a new profile plus template pack, mirroring how `java-spring-clean-multimodule` was split from `java-spring-clean`. N6's repo-side validation is its prerequisite: the boundary check is what makes the split safe to perform. |

## Proposed milestones

Sequenced by value over cost and by dependency. Each follows the existing workflow: ADR,
producer and template change, Golden update, unit tests, and the smoke gate matching the
capability.

| ID | Title | Scope | Depends on |
| --- | --- | --- | --- |
| 7.20 | NestJS Generated Repository Hygiene | Unconditional `.gitignore` and a model-derived `README.md` for the generated project, closing G1 against the Java 6.37 precedent | — |
| 7.21 | NestJS Module Boundary Validation | Executes N6: a repo-side per-module-selection import-resolution check, plus a generated ESLint flat config with `no-restricted-imports` zones derived from the profile `requires` graph | — |
| 7.22 | NestJS Environment Configuration and CORS | Executes N4 and N5: `@nestjs/config`, `NODE_ENV`-selected environment files, `.env.example`, a generated `validateEnvironment()`, and environment-driven CORS | — |
| 7.23 | NestJS Locale Negotiation Policy | Executes N9: explicit default, supported-locale allowlist, `q`-weight handling, fallback policy, and generated negotiation tests | 7.19 |
| 7.24 | NestJS Container Packaging | Multi-stage `Dockerfile` with a build stage, slim runtime, and non-root user; `.dockerignore`; and a Compose file whose healthcheck targets the existing `/health-check/ready` endpoint | 7.22 |
| 7.25 | NestJS Generated Continuous Integration | Generated GitHub Actions workflow: SHA-pinned actions, `workflow_dispatch`, npm cache, and install, lint, build, test, and e2e steps, mirroring 6.44's hardening without adopting the reference project's Stryker or SonarCloud thresholds | 7.20, 7.21 |
| 7.26 | NestJS ORM Persistence Foundation | Executes N1, N2, and N3: TypeORM persistence entities behind the existing mapper boundary, a `persistence` technology option that retains the in-memory adapter, PostgreSQL runtime configuration, and SQLite-backed generated persistence tests | 7.22, 7.24 |
| 7.27 | NestJS Soft Delete and Restore | Executes N7: tombstones, active-row filtering, deleted-only query routes, restore semantics, and the uniqueness interaction, mirroring the Java 6.32 and 6.33 contract | 7.26 |
| 7.28 | NestJS Auditing | Executes N8: Core clock port, opt-in per-entity `createdAt` and `updatedAt`, infra-preserved creation timestamp, and read-only REST exposure, mirroring Java 6.35 | 7.26 |
| 7.29 | NestJS Multi-Module Variant | Executes N10: a `nestjs-clean-architecture-multimodule` profile and template pack over npm workspaces and tsconfig project references | 7.21, 7.26 |

Sequencing rationale: 7.20 through 7.23 are independent, cheap, and carry no new runtime
dependency, so they close four gaps before anything structural is risked. 7.21 lands early
deliberately — it is the only milestone that turns the ADR-081 defect class from a manual check
into an automatic one, and every later milestone adds generated artifacts that could reintroduce
it. 7.24 and 7.25 precede 7.26 so that a database is provisionable by Compose and by CI before the
ORM needs one. 7.29 is last because it re-partitions everything the preceding milestones emit.

## Explicitly not adopted

Carried forward from ADR-057 and the reference-architecture analysis, and reaffirmed here: the
reference project's 100% coverage threshold, its Stryker mutation-testing setup, and its
SonarCloud quality gate are that project's own authoring choices, not requirements for generated
output. A request-timing interceptor remains deferred. `eslint-plugin-boundaries`,
`dependency-cruiser`, Joi, and zod are rejected as avoidable generated dependencies under N4 and
N6. Prisma and MikroORM are rejected under N1.

## Deferred beyond this plan

Testcontainers for the NestJS stack (the Java analogue is 6.49), generated mutation testing (Java
6.48), a generated coverage threshold gate (Java 6.51), authentication and authorization,
optimistic locking, ETag and conditional requests, additional databases, and relationship-driven
generation. Each remains future optional work until scheduled as its own milestone.

## Validation policy

Per the [Quality Gates](QUALITY-GATES.md) change-type matrix, every milestone here that changes
generated TypeScript output validates with typecheck, build, golden tests, `npm test`, and
`npm run smoke:nestjs`; and, whenever generated build or runtime behavior changes,
`CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs` — the only gate that truly
typechecks generated import paths, because it runs `nest build` inside the generated project.
Golden coverage ships with the milestone that changes artifacts; per
[ADR-010](../adr/ADR-010-golden-tests.md) it is never deferred to a later milestone, and goldens
are derived by copying fresh built-CLI output rather than hand-edited.

Milestones 7.26 through 7.28 additionally require a two-run byte-identical determinism check and
an identifier-only-entity regression check, both of which have already caught real defects in this
phase.
