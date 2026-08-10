# Roadmap

This is the canonical roadmap for Corporate Code Generator. It is organized by Release -> Phase -> Milestone and records only known status, outcome, and evidence. Current measured counts and detailed generated file inventories belong in [Current State](docs/project/CURRENT-STATE.md).

Allowed milestone statuses are: Done, In progress, Planned, Deferred, Superseded, and Historical information unavailable.

## Release 1 - Generator foundation and Java Golden Path

### Phase 1 - Architectural foundation

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 1.x | Historical title not recovered | Historical information unavailable | Foundational numbering was not recovered from current materials. | [ADR-001](docs/adr/ADR-001-typescript-as-implementation-language.md) through [ADR-011](docs/adr/ADR-011-java-as-first-golden-path.md) |

### Phase 2 - Core foundation

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 2.x | Historical title not recovered | Historical information unavailable | Core-foundation numbering was not recovered from current materials. | [Solution Specification](docs/SOLUTION-SPECIFICATION.md) |

### Phase 3 - Generation pipeline

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 3.1 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 3.2 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 3.3 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 3.4 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 3.5 | Java Domain Generation Foundation | Done | Established Java domain generation, planning, and golden coverage. | [ADR-011](docs/adr/ADR-011-java-as-first-golden-path.md) |
| 3.6 | Versioned Template Pack Foundation | Done | Moved template and output-path knowledge into versioned template packs. | [ADR-007](docs/adr/ADR-007-versioned-template-packs.md) |
| 3.7 | FileWriter Foundation | Done | Added filesystem writing behind validated file plans. | [ADR-009](docs/adr/ADR-009-file-plan-before-filesystem-mutation.md) |
| 3.8 | CLI Generate Integration | Done | Exposed generation through the CLI with profile, module, output, and dry-run options. | [Solution Specification](docs/SOLUTION-SPECIFICATION.md) |

### Phase 4 - Java single-module Golden Path

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 4.0 | Application Module Foundation | Done | Added the application module and explicit multi-producer composition. | [Current State](docs/project/CURRENT-STATE.md) |
| 4.1 | Maven Build Foundation | Done | Added the build module and deterministic Maven project materialization. | [ADR-012](docs/adr/ADR-012-minimal-spring-boot-materialization.md) |
| 4.2 | Minimal Spring Boot Materialization | Done | Added Spring Boot bootstrap materialization. | [ADR-012](docs/adr/ADR-012-minimal-spring-boot-materialization.md) |
| 4.3 | REST Controller Foundation | Done | Added the REST API structural foundation. | [ADR-013](docs/adr/ADR-013-rest-controller-foundation.md) |

### Phase 5 - Java multi-module Golden Path

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 5.1 | Multi-module Profile and Template Pack Skeleton | Done | Established the multi-module profile and template-pack skeleton. | [ADR-014](docs/adr/ADR-014-separate-java-golden-paths.md) |
| 5.2 | Maven Reactor Foundation | Done | Established Maven reactor structure for generated multi-module projects. | [ADR-014](docs/adr/ADR-014-separate-java-golden-paths.md) |
| 5.3 | Core Module Migration | Done | Moved generated domain/application concerns into the generated Core module. | [ADR-014](docs/adr/ADR-014-separate-java-golden-paths.md) |
| 5.4 | Configuration Module Foundation | Done | Added generated configuration-module foundation. | [ADR-015](docs/adr/ADR-015-explicit-spring-wiring-in-configuration-module.md) |
| 5.5 | REST Entrypoint Module Foundation | Done | Added generated REST entrypoint module foundation. | [ADR-014](docs/adr/ADR-014-separate-java-golden-paths.md) |
| 5.6 | Multi-module Maven Compile Smoke | Done | Added Maven compile validation for the generated multi-module project. | [Quality Gates](docs/project/QUALITY-GATES.md) |
| 5.7 | Core Use Cases and Ports | Done | Added generated Core use cases and ports. | [Generated Java Reference Architecture](docs/target-architecture/REFERENCE-ARCHITECTURE.md) |
| 5.8 | Database Infrastructure Foundation | Done | Added generated database infrastructure foundation. | [ADR-016](docs/adr/ADR-016-spring-data-repository-foundation.md) |
| 5.9 | Spring Wiring Foundation | Done | Added explicit Spring wiring in the generated configuration module. | [ADR-015](docs/adr/ADR-015-explicit-spring-wiring-in-configuration-module.md) |
| 5.10 | REST Delegation and Runtime Validation | Done | Connected generated REST delegation and runtime validation foundations. | [Generated Java Reference Architecture](docs/target-architecture/REFERENCE-ARCHITECTURE.md) |
| 5.11 | Spring Context Smoke Foundation | Done | Added generated Spring context validation. | [Quality Gates](docs/project/QUALITY-GATES.md) |
| 5.12 | Spring Data Repository Foundation | Done | Added Spring Data repository foundation in infrastructure. | [ADR-016](docs/adr/ADR-016-spring-data-repository-foundation.md) |
| 5.13 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 5.14 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 5.15 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 5.16 | Historical title not recovered | Historical information unavailable | Historical milestone name and scope were not recovered. | Not recorded |
| 5.17 | HTTP Persistence Read Validation | Done | Validated persisted data through the generated HTTP read path. | [Quality Gates](docs/project/QUALITY-GATES.md) |

### Phase 6 - Java capability and runtime completion

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 6.0 | Advanced Reference Architecture Analysis | Done | Analyzed the advanced generated-application reference architecture. | [Extended Reference Architecture](docs/target-architecture/EXTENDED-REFERENCE-ARCHITECTURE.md) |
| 6.1 | Capability Taxonomy and Profile Options | Done | Established the capability taxonomy and option vocabulary. | [ADR-017](docs/adr/ADR-017-capability-taxonomy-and-profile-options.md) |
| 6.2 | ArchUnit Architecture Guardrails | Done | Added default generated architecture guardrails. | [ADR-024](docs/adr/ADR-024-archunit-as-default-architecture-guardrail.md) |
| 6.3 | Standard REST Error Contract and i18n | Done | Added generated REST error and message-resolution foundations. | [ADR-025](docs/adr/ADR-025-standard-rest-error-contract-and-i18n-foundation.md) |
| 6.4 | Configuration Profiles and CORS Policy | Done | Added generated environment profiles and property-driven CORS. | [ADR-026](docs/adr/ADR-026-configuration-profiles-and-cors-policy.md) |
| 6.5 | OpenAPI and Swagger UI Policy | Done | Added generated OpenAPI specification policy and environment-gated Swagger UI. | [ADR-027](docs/adr/ADR-027-openapi-specification-and-swagger-ui-policy.md) |
| 6.6 | Core Validation and Self-Validation | Done | Added generated Core self-validation with Jakarta Validation boundaries. | [ADR-028](docs/adr/ADR-028-jakarta-validation-and-self-validating-in-core.md) |
| 6.7 | Core Paging Common | Done | Added generated technology-neutral paging model. | [ADR-029](docs/adr/ADR-029-core-paging-common-model.md) |
| 6.8 | Spring Data Paging Adapter | Done | Added generated Spring Data paging adapter foundation. | [ADR-030](docs/adr/ADR-030-spring-data-paging-adapter-and-deferred-querydsl-foundation.md) |
| 6.9 | Querydsl Foundation in Infra Database | Done | Added generated Querydsl foundation in infrastructure. | [ADR-031](docs/adr/ADR-031-querydsl-foundation-in-infra-database.md) |
| 6.10 | Generated Java CI Pipeline | Done | Added generated Java CI workflow foundation. | [ADR-032](docs/adr/ADR-032-generated-java-ci-pipeline.md) |
| 6.11 | Core Filter Common | Done | Added generated technology-neutral filter model. | [ADR-033](docs/adr/ADR-033-core-filter-common.md) |
| 6.12 | REST Filter Contract Foundation | Done | Added generated REST filter parsing contract. | [ADR-034](docs/adr/ADR-034-rest-filter-contract-foundation.md) |
| 6.13 | Querydsl Filter Mapper Foundation | Done | Added generated entity-aware Querydsl filter mapping. | [ADR-035](docs/adr/ADR-035-querydsl-filter-mapper-foundation.md) |
| 6.14 | Querydsl Filter Runtime Integration | Done | Connected generated filter use cases to Querydsl persistence runtime. | [ADR-036](docs/adr/ADR-036-querydsl-filter-runtime-integration.md) |
| 6.15 | REST Filter Runtime Integration | Done | Exposed filtering through generated REST query parameters. | [ADR-037](docs/adr/ADR-037-rest-filter-runtime-integration.md) |
| 6.16 | Paging Runtime Integration | Done | Connected generated paging use cases to persistence runtime. | [ADR-038](docs/adr/ADR-038-paging-runtime-integration.md) |
| 6.17 | Filtered Paging Runtime Integration | Done | Combined filtering and paging in generated runtime without HTTP exposure. | [ADR-039](docs/adr/ADR-039-filtered-paging-runtime-integration.md) |
| 6.18 | REST Filtered Paging Runtime Integration | Done | Exposed filtered paging through generated REST. | [ADR-040](docs/adr/ADR-040-rest-filtered-paging-runtime-integration.md) |
| 6.19 | REST Sorting Runtime Integration | Done | Added generated REST sorting and domain-to-persistence sort mapping. | [ADR-041](docs/adr/ADR-041-rest-sorting-runtime-integration.md) |
| 6.20 | Find By ID Runtime and REST Integration | Done | Added generated find-by-id runtime and HTTP path. | [ADR-042](docs/adr/ADR-042-find-by-id-runtime-and-rest-integration.md) |
| 6.21 | Create Runtime Integration | Done | Added generated create command, use case, gateway, and persistence flow. | [ADR-043](docs/adr/ADR-043-create-runtime-integration.md) |
| 6.22 | Create Conflict Runtime Integration | Done | Added duplicate-ID conflict behavior before persistence save. | [ADR-044](docs/adr/ADR-044-create-conflict-runtime-integration.md) |
| 6.23 | RestSortParser Generated-Test Stabilization | Done | Stabilized generated REST sort parser tests so full reactor validation could cover them. | [ADR-045](docs/adr/ADR-045-full-maven-reactor-quality-gate.md) |
| 6.24 | Full Maven Reactor Quality Gate | Done | Added an unfiltered generated Maven reactor test gate. | [ADR-045](docs/adr/ADR-045-full-maven-reactor-quality-gate.md) |
| 6.25 | REST Create Integration | Done | Exposed generated create runtime through POST. | [ADR-046](docs/adr/ADR-046-rest-create-integration.md) |
| 6.26 | Update Runtime Integration | Done | Added generated update command, use case, gateway, and persistence behavior. | [ADR-047](docs/adr/ADR-047-update-runtime-integration.md) |
| 6.27 | REST Update Integration | Done | Exposed generated update runtime through PUT. | [ADR-048](docs/adr/ADR-048-rest-update-integration.md) |
| 6.28 | Delete Runtime Integration | Done | Added generated delete command, use case, gateway, and persistence behavior. | [ADR-049](docs/adr/ADR-049-delete-runtime-integration.md) |
| 6.29 | REST Delete Integration | Done | Exposed generated delete runtime through DELETE, returning 204/400/404/500 with non-idempotent repeated-delete semantics. | [ADR-050](docs/adr/ADR-050-rest-delete-integration.md) |
| 6.30 | Golden Path Java 1.0 Release Readiness | Done | Completed the release-readiness audit without adding a new capability. | [Current State](docs/project/CURRENT-STATE.md); [Quality Gates](docs/project/QUALITY-GATES.md) |
| 6.31 | REST PATCH Integration | Done | Added partial update semantics with explicit presence tracking, HTTP exposure, OpenAPI documentation, and generated runtime tests. | [ADR-051](docs/adr/ADR-051-rest-patch-integration.md) |
| 6.32 | Soft Delete with Active Uniqueness | Done | Added persistence tombstones, active-row filtering, reusable attribute-level unique values, and generated H2/HTTP coverage while preserving the single-module profile. | [ADR-052](docs/adr/ADR-052-soft-delete-active-uniqueness.md) |
| 6.33 | Restore and Deleted Queries | Done | Added explicit deleted-only query routes, tombstone representations, restore command semantics, conflict-safe persistence behavior, OpenAPI coverage, and generated runtime tests. | [ADR-053](docs/adr/ADR-053-restore-include-deleted-queries.md) |
| 6.34 | Composite Unique Groups | Done | Added technology-agnostic composite uniqueness declarations with deterministic Core validation and active-row JPA constraints/conflict checks in the Java multi-module Golden Path. | [ADR-054](docs/adr/ADR-054-composite-unique-groups.md) |
| 6.35 | Auditing (createdAt/updatedAt) | Done | Added an opt-in per-entity auditing capability with a Core clock port, infra-preserved creation timestamps, and read-only REST exposure in the Java multi-module Golden Path. | [ADR-055](docs/adr/ADR-055-auditing-created-updated-at.md) |
| 6.36 | Default Runtime Datasource | Done | Made the generated multi-module application runnable without external configuration by shipping a runtime-scoped H2 driver and an in-memory datasource in base configuration, while production requires explicit datasource settings. | [ADR-056](docs/adr/ADR-056-default-runtime-datasource.md) |

## Release 2 - NestJS Golden Path

### Phase 7 - NestJS clean-architecture Golden Path foundation

| ID | Title | Status | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| 7.0 | NestJS Reference Architecture Analysis | Done | Analyzed the NestJS clean-architecture reference project and classified its conventions into Application Model/Profile/Module/Technology Adapter/Rule/Transformer/Template categories. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md); [NestJS Reference Architecture](docs/target-architecture/NESTJS-REFERENCE-ARCHITECTURE.md) |
| 7.1 | CLI Producer Registry Refactor | Done | Replaced GenerateCommand's hardcoded profile-id conditional with a registry keyed by profile id, covering the two Java profiles and the NestJS profile without changing generated Java output. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.2 | NestJS Profile and Template Pack Skeleton | Done | Established the nestjs-clean-architecture profile, its template pack, and the adapter-nestjs package, generating framework-free TypeScript domain models from the technology-agnostic model. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.3 | Core Use-Case Layer Foundation | Done | Added generated Core use cases, commands, queries, gateway ports, dependency-injection tokens, and a domain exception hierarchy, with no framework imports in the generated Core module. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.4 | Infra-Persistence Foundation | Done | Added a generated in-memory repository, domain/entity mapper, and gateway-implementing providers behind the Core ports. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.5 | Web-API REST Entrypoint Foundation | Done | Added generated REST controllers, request/response representations, a presenter mapper, OpenAPI annotations, and a domain-to-HTTP not-found exception filter. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.6 | Bootstrap and Dependency Injection Wiring | Done | Added the generated main.ts/app.module.ts composition root binding providers and controllers to Core tokens, producing a NestJS application that builds and serves create/find-by-id over HTTP with Swagger UI. | [ADR-057](docs/adr/ADR-057-nestjs-as-second-golden-path.md) |
| 7.7 | Generated-Project-Runs Quality Gate | Planned | Automate an npm install/build/run gate against generated NestJS output, analogous to the Maven-required Java smokes. Generated-project execution has so far been verified manually only. | Not recorded |
| 7.8 | Golden Path NestJS 1.0 Readiness | Planned | Release-readiness audit of the minimal NestJS Golden Path without adding a new capability. | [Current State](docs/project/CURRENT-STATE.md); [Quality Gates](docs/project/QUALITY-GATES.md) |

Per [ADR-010](docs/adr/ADR-010-golden-tests.md), every milestone from 7.2 onward that changes generated artifacts carries its own Golden Test additions; Golden coverage is not deferred to a later milestone.

## Future optional work

Future work remains outside the current release unless explicitly approved: optimistic locking, ETag/If-Match, authentication and authorization, additional databases, deployment scaffolding, remote registries, and plugin systems. NestJS as a second stack is no longer future-optional work; it is tracked under Release 2, Phase 7. Capability parity between the NestJS Golden Path and the Java Golden Path (pagination, filtering, sorting, soft delete, restore, composite unique groups, auditing, CORS, OpenAPI completeness, internationalization, an architecture-boundary lint) and a NestJS multi-module variant remain future optional work for that stack until scheduled as their own Phase 7 milestones or a later phase.
