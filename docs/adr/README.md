# ADR index

This index lists all ADR files currently present under `docs/adr` in numeric order. Titles are derived from the first H1. Status is derived only from an explicit `## Status` section; otherwise it is recorded as `Not recorded`. Milestone and supersession fields are `Not recorded` unless explicitly present in the ADR text.

| ADR | Title | Status | Milestone | Supersedes | Superseded by |
| --- | --- | --- | --- | --- | --- |
| [001](ADR-001-typescript-as-implementation-language.md) | TypeScript as Generator Implementation Language | Accepted | Not recorded | Not recorded | Not recorded |
| [002](ADR-002-nunjucks-as-template-engine.md) | Nunjucks as Initial Template Engine | Accepted | Not recorded | Not recorded | Not recorded |
| [003](ADR-003-technology-agnostic-ir.md) | Technology-Agnostic Intermediate Representation | Accepted | Not recorded | Not recorded | Not recorded |
| [004](ADR-004-generation-rules-outside-templates.md) | Generation Rules Outside Templates | Accepted | Not recorded | Not recorded | Not recorded |
| [005](ADR-005-deterministic-generation.md) | Deterministic Generation | Accepted | Not recorded | Not recorded | Not recorded |
| [006](ADR-006-profiles-and-modules.md) | Profile and Module Architecture | Accepted | Not recorded | Not recorded | Not recorded |
| [007](ADR-007-versioned-template-packs.md) | Versioned Template Packs | Accepted | Not recorded | Not recorded | Not recorded |
| [008](ADR-008-ai-outside-runtime.md) | Artificial Intelligence Outside the Generation Runtime | Accepted | Not recorded | Not recorded | Not recorded |
| [009](ADR-009-file-plan-before-filesystem-mutation.md) | File Plan Before Filesystem Mutation | Accepted | Not recorded | Not recorded | Not recorded |
| [010](ADR-010-golden-tests.md) | Golden Tests for Generated Artifacts | Accepted | Not recorded | Not recorded | Not recorded |
| [011](ADR-011-java-as-first-golden-path.md) | Java as the First Golden Path | Accepted | Not recorded | Not recorded | Not recorded |
| [012](ADR-012-minimal-spring-boot-materialization.md) | Minimal Spring Boot Materialization | Accepted | Not recorded | Not recorded | Not recorded |
| [013](ADR-013-rest-controller-foundation.md) | REST Controller Foundation | Accepted | Not recorded | Not recorded | Not recorded |
| [014](ADR-014-separate-java-golden-paths.md) | Separate Java Golden Paths | Accepted | Not recorded | Not recorded | Not recorded |
| [015](ADR-015-explicit-spring-wiring-in-configuration-module.md) | Explicit Spring Wiring in Configuration Module | Accepted | Not recorded | Not recorded | Not recorded |
| [016](ADR-016-spring-data-repository-foundation.md) | Spring Data Repository Foundation in Infra Database | Accepted. Partially superseded by ADR-056 — the H2 scope and the deferred production DataSource decision were revised. | Not recorded | Not recorded | 056 (in part) |
| [017](ADR-017-capability-taxonomy-and-profile-options.md) | Capability Taxonomy and Profile Options | Accepted as a taxonomy baseline. Capability implementations remain deferred to their roadmap milestones. | Not recorded | Not recorded | Not recorded |
| [024](ADR-024-archunit-as-default-architecture-guardrail.md) | ArchUnit as Default Architecture Guardrail | Accepted | Not recorded | Not recorded | Not recorded |
| [025](ADR-025-standard-rest-error-contract-and-i18n-foundation.md) | Standard REST Error Contract and i18n Foundation | Accepted | Not recorded | Not recorded | Not recorded |
| [026](ADR-026-configuration-profiles-and-cors-policy.md) | Configuration Profiles and CORS Policy | Not recorded | Not recorded | Not recorded | Not recorded |
| [027](ADR-027-openapi-specification-and-swagger-ui-policy.md) | OpenAPI Specification and Swagger UI Policy | Not recorded | Not recorded | Not recorded | Not recorded |
| [028](ADR-028-jakarta-validation-and-self-validating-in-core.md) | Jakarta Validation and SelfValidating in Core | Accepted. | Not recorded | Not recorded | Not recorded |
| [029](ADR-029-core-paging-common-model.md) | Core Paging Common Model | Accepted. | Not recorded | Not recorded | Not recorded |
| [030](ADR-030-spring-data-paging-adapter-and-deferred-querydsl-foundation.md) | Spring Data Paging Adapter and Deferred Querydsl Foundation | Not recorded | Not recorded | Not recorded | Not recorded |
| [031](ADR-031-querydsl-foundation-in-infra-database.md) | Querydsl Foundation in Infra Database | Not recorded | Not recorded | Not recorded | Not recorded |
| [032](ADR-032-generated-java-ci-pipeline.md) | Generated Java CI Pipeline | Not recorded | Not recorded | Not recorded | Not recorded |
| [033](ADR-033-core-filter-common.md) | Core Filter Common | Not recorded | Not recorded | Not recorded | Not recorded |
| [034](ADR-034-rest-filter-contract-foundation.md) | REST Filter Contract Foundation | Not recorded | Not recorded | Not recorded | Not recorded |
| [035](ADR-035-querydsl-filter-mapper-foundation.md) | Querydsl Filter Mapper Foundation | Accepted - Milestone 6.13 foundation. | Milestone 6.13 | Not recorded | Not recorded |
| [036](ADR-036-querydsl-filter-runtime-integration.md) | Querydsl Filter Runtime Integration | Accepted - Milestone 6.14. | Milestone 6.14 | Not recorded | Not recorded |
| [037](ADR-037-rest-filter-runtime-integration.md) | REST Filter Runtime Integration | Accepted - Milestone 6.15. | Milestone 6.15 | Not recorded | Not recorded |
| [038](ADR-038-paging-runtime-integration.md) | Paging Runtime Integration | Accepted - Milestone 6.16. | Milestone 6.16 | Not recorded | Not recorded |
| [039](ADR-039-filtered-paging-runtime-integration.md) | Filtered Paging Runtime Integration | Accepted - Milestone 6.17. | Milestone 6.17 | Not recorded | Not recorded |
| [040](ADR-040-rest-filtered-paging-runtime-integration.md) | REST Filtered Paging Runtime Integration | Not recorded | Not recorded | Not recorded | Not recorded |
| [041](ADR-041-rest-sorting-runtime-integration.md) | REST Sorting Runtime Integration | Not recorded | Not recorded | Not recorded | Not recorded |
| [042](ADR-042-find-by-id-runtime-and-rest-integration.md) | Find By ID Runtime and REST Integration | Not recorded | Not recorded | Not recorded | Not recorded |
| [043](ADR-043-create-runtime-integration.md) | Create Runtime Integration | Not recorded | Not recorded | Not recorded | Not recorded |
| [044](ADR-044-create-conflict-runtime-integration.md) | Create Conflict Runtime Integration | Not recorded | Milestone 6.23 | Not recorded | Not recorded |
| [045](ADR-045-full-maven-reactor-quality-gate.md) | Full Maven Reactor Quality Gate | Not recorded | Milestone 6.23 | Not recorded | Not recorded |
| [046](ADR-046-rest-create-integration.md) | REST Create Integration | Accepted. | Not recorded | Not recorded | Not recorded |
| [047](ADR-047-update-runtime-integration.md) | Update Runtime Integration | Accepted. | Not recorded | Not recorded | Not recorded |
| [048](ADR-048-rest-update-integration.md) | REST Update Integration | Accepted. | Milestone 6.26 | Not recorded | Not recorded |
| [049](ADR-049-delete-runtime-integration.md) | Delete Runtime Integration | Accepted - Milestone 6.28. | Milestone 6.28 | Not recorded | Not recorded |
| [050](ADR-050-rest-delete-integration.md) | REST Delete Integration | Accepted — Milestone 6.29. | Milestone 6.29 | Not recorded | Not recorded |
| [051](ADR-051-rest-patch-integration.md) | REST PATCH Integration | Accepted — Milestone 6.31. | Milestone 6.31 | Not recorded | Not recorded |
| [052](ADR-052-soft-delete-active-uniqueness.md) | Soft Delete with Active Uniqueness | Accepted — Milestone 6.32. | Milestone 6.32 | Not recorded | Not recorded |
| [053](ADR-053-restore-include-deleted-queries.md) | Restore and Deleted-Only Queries | Accepted — Milestone 6.33. | Milestone 6.33 | Not recorded | Not recorded |
| [054](ADR-054-composite-unique-groups.md) | Composite Unique Groups | Accepted - Milestone 6.34. | Milestone 6.34 | Not recorded | Not recorded |
| [055](ADR-055-auditing-created-updated-at.md) | Auditing (createdAt/updatedAt) | Accepted — Milestone 6.35. | Milestone 6.35 | Not recorded | Not recorded |
| [056](ADR-056-default-runtime-datasource.md) | Default Runtime Datasource (In-Memory H2) | Accepted — Milestone 6.36. | Milestone 6.36 | 016 (in part) | Not recorded |
| [057](ADR-057-nestjs-as-second-golden-path.md) | NestJS as the Second Golden Path | Accepted — Milestones 7.0 through 7.6 | Milestones 7.0-7.6 | Not recorded | Not recorded |
| [058](ADR-058-generated-repository-hygiene.md) | Generated Repository Hygiene (`.gitignore` and `README.md`) | Accepted — Milestone 6.37. | Milestone 6.37 | Not recorded | Not recorded |
| [059](ADR-059-generated-maven-build-governance.md) | Generated Maven Build Governance | Accepted — Milestone 6.38. | Milestone 6.38 | Not recorded | Not recorded |
| [060](ADR-060-generated-coverage-reporting.md) | Generated Coverage Reporting | Accepted — Milestone 6.39. | Milestone 6.39 | Not recorded | Not recorded |
| [061](ADR-061-generated-package-and-test-layout.md) | Generated Package and Test Layout | Accepted — Milestone 6.40. | Milestone 6.40 | Not recorded | Not recorded |
| [062](ADR-062-generated-rest-contract-tests.md) | Generated REST Contract Tests | Accepted — Milestone 6.41. | Milestone 6.41 | Not recorded | Not recorded |
| [063](ADR-063-generated-persistence-slice-tests.md) | Generated Persistence Slice Tests | Accepted — Milestone 6.42. | Milestone 6.42 | 028 (in part) | Not recorded |
| [064](ADR-064-generated-openapi-contract-interface.md) | Generated OpenAPI Contract Interface | Accepted — Milestone 6.43. | Milestone 6.43 | 027 (in part) | Not recorded |
| [065](ADR-065-generated-ci-hardening.md) | Generated CI Hardening | Accepted — Milestone 6.44. | Milestone 6.44 | Not recorded | Not recorded |
| [066](ADR-066-generated-docker-capability.md) | Generated Docker Capability | Accepted — Milestone 6.45. | Milestone 6.45 | Not recorded | Not recorded |
| [067](ADR-067-generated-i18n-policy-completion.md) | Generated i18n Policy Completion | Accepted — Milestone 6.46. | Milestone 6.46 | 025 (in part) | Not recorded |
| [068](ADR-068-generated-archunit-suite-split.md) | Generated ArchUnit Suite Split | Accepted - Milestone 6.47. | Milestone 6.47 | 024 (in part) | Not recorded |
| [069](ADR-069-generated-mutation-testing-capability.md) | Generated Mutation Testing Capability | Accepted - Milestone 6.48. | Milestone 6.48 | Not recorded | Not recorded |
| [070](ADR-070-generated-testcontainers-verification.md) | Generated Testcontainers Verification | Accepted - Milestone 6.49. | Milestone 6.49 | Not recorded | Not recorded |
| [071](ADR-071-generated-developer-scripts-and-smoke-requests.md) | Generated Developer Scripts and Smoke Requests | Accepted - Milestone 6.50. | Milestone 6.50 | Not recorded | Not recorded |
| [072](ADR-072-generated-coverage-threshold-gate.md) | Generated Coverage Threshold Gate | Accepted - Milestone 6.51. | Milestone 6.51 | 060 (in part) | Not recorded |
| [073](ADR-073-nestjs-generated-project-quality-gate.md) | NestJS Generated-Project Quality Gate | Accepted — Milestone 7.7. | Milestone 7.7 | Not recorded | Not recorded |
| [074](ADR-074-nestjs-core-validation-and-error-contract.md) | NestJS Core Validation and Error Contract | Accepted — Milestone 7.9. | Milestone 7.9 | Not recorded | Not recorded |
| [075](ADR-075-nestjs-generated-core-test-support.md) | NestJS Generated Core Test Support | Accepted — Milestone 7.10. | Milestone 7.10 | Not recorded | Not recorded |
