# Soft Delete with Active Uniqueness Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD and preserve the repository's existing uncommitted work. Do not create commits unless explicitly requested.

**Goal:** Generate portable soft delete for the Java multi-module Golden Path while allowing active records to reuse attribute values declared with `unique: true`.

**Architecture:** Keep `unique` in the semantic Application Model, but keep `deletedAt`, `deletionScope`, JPA constraints, and active-row filtering inside the Java persistence adapter. Active rows use the constant `ACTIVE` scope; tombstones use their stable identifier string, so composite constraints on `(uniqueField, deletionScope)` release values without mutating business data. The Core and REST contracts remain unchanged except for existing conflict/not-found behavior.

**Tech Stack:** TypeScript generator, JSON Schema, Nunjucks template pack, Java 25, Spring Data JPA, Querydsl, H2, JUnit/AssertJ, Maven reactor.

## Global Constraints

- Apply changes only to `java-spring-clean-multimodule`; preserve `java-spring-clean`.
- Do not add Flyway, Liquibase, PostgreSQL-only SQL, or new database support.
- Do not expose `deletedAt` or `deletionScope` in Core or REST.
- Templates receive prepared models and must not make semantic decisions.
- Every production behavior change gets a failing test before implementation.
- Regenerate goldens from the CLI; do not hand-edit goldens as the source of truth.
- Do not commit, push, merge, or modify unrelated existing user changes.

---

### Task 1: Extend the semantic model with attribute uniqueness

**Files:**
- Modify: `packages/core/src/model/Attribute.ts`
- Modify: `packages/core/src/model/document/ApplicationModelDocument.ts`
- Modify: `packages/core/src/parser/ModelParser.ts`
- Modify: `packages/core/schemas/1.0/model.schema.json`
- Test: `packages/core/tests/ModelParser.test.ts`
- Test: `packages/core/tests/SchemaValidator.test.ts`

**Interfaces:**
- `Attribute.unique: boolean` defaults to `false` when omitted.
- Parsed document attributes accept optional `unique: true` and reject non-boolean values through the existing schema validation path.

- [ ] Write failing parser/schema tests for omitted `unique`, accepted `unique: true`, and rejected invalid `unique` values.
- [ ] Run the focused Core tests and confirm failure because `unique` is not yet modeled.
- [ ] Add the optional property to the document contract, parser, semantic model, and version `1.0` JSON Schema.
- [ ] Run the focused Core tests and confirm they pass without changing existing model expectations.

### Task 2: Prepare persistence template models for soft-delete metadata

**Files:**
- Modify: `packages/adapter-java/src/model/JavaPersistenceEntityTemplateModel.ts`
- Modify: `packages/adapter-java/src/model/JavaPersistenceMapperTemplateModel.ts`
- Modify: `packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

**Interfaces:**
- Persistence entity model describes `deletedAt`, `deletionScope`, the active-scope constant, and unique constraint column groups.
- Gateway provider model describes active-row checks, tombstone mutation, and the repository operations needed to preserve the existing gateway interface.
- Mapper model continues to map only domain fields while constructing active persistence entities with `deletionScope = ACTIVE`.

- [ ] Add producer tests that assert unique attributes create composite constraints and that non-unique attributes do not.
- [ ] Add producer tests that assert the generated persistence model contains deletion metadata without exposing it in mapper arguments.
- [ ] Run the focused adapter test and verify the new assertions fail.
- [ ] Populate the prepared models in the producer, deriving `deletionScope` from the identifier type without adding technology decisions to templates.
- [ ] Run the focused adapter test and confirm the model assertions pass.

### Task 3: Implement persistence entity, mapper, repository, and active filtering templates

**Files:**
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/persistence-entity.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/persistence-mapper.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/repository.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/querydsl-predicate-builder.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/querydsl-domain-filter-definition.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

**Interfaces:**
- Generated entity keeps business fields, adds nullable `Instant deletedAt`, non-null `String deletionScope`, `ACTIVE` constant, and a method to mark deletion.
- Generated entity table constraints combine each unique business column with `deletionScope`.
- Generated provider treats only `deletionScope = ACTIVE` rows as visible and changes the scope to the identifier string during delete.
- Querydsl predicates add the active-scope predicate before user filter expressions and paging.

- [ ] Add or extend template expectations for entity annotations, active scope initialization, and provider behavior; run them to confirm failure.
- [ ] Implement the minimal Nunjucks templates and manifest invocations using prepared model fields.
- [ ] Generate a focused output and inspect entity, mapper, provider, and Querydsl source for valid Java and correct boundaries.
- [ ] Run adapter tests and typecheck; fix only implementation defects revealed by those tests.

### Task 4: Add generated persistence and HTTP behavior tests

**Files:**
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Create/modify: `packages/adapter-java/src/model/JavaSoftDeletePersistenceTestTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaHttpSoftDeleteTestTemplateModel.ts`
- Create/modify: `template-packs/java-spring-clean-multimodule/configuration/soft-delete-persistence-test.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/configuration/http-soft-delete-test.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/openapi-smoke-test.java.njk`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`

**Interfaces:**
- H2 persistence tests prove physical row retention, hidden tombstones, repeated-delete not-found, and reuse of a unique value by a new active row.
- HTTP tests prove DELETE 204, subsequent GET 404, repeated DELETE 404, and POST conflict for an active duplicate while allowing POST reuse after soft delete.
- OpenAPI continues documenting DELETE's existing 204/400/404/500 contract without exposing persistence metadata.

- [ ] Add failing generated-test model assertions and producer artifact expectations.
- [ ] Implement template models, producers, and generated test templates with deterministic fixtures.
- [ ] Run the focused TypeScript tests and confirm they pass.
- [ ] Add an explicit unique attribute to the wallet example only if needed for generated runtime coverage, preserving existing default behavior expectations.

### Task 5: Integrate conflict semantics across create and update paths

**Files:**
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`
- Modify: `packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/global-exception-handler.java.njk` only if the existing conflict boundary cannot represent persistence uniqueness failures
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`
- Test: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`

**Interfaces:**
- Active duplicate unique values map to the existing `ConflictException` contract.
- Updates and PATCHes against tombstones resolve as not found before mutation.
- Existing identifier conflict behavior remains unchanged.

- [ ] Add a failing generated integration assertion for active duplicate conflict and tombstone update rejection.
- [ ] Implement provider-level conflict translation or active lookup required by the generated adapter.
- [ ] Run focused integration tests and confirm the existing error payload and status remain stable.

### Task 6: Regenerate goldens and validate generated source

**Files:**
- Modify: `examples/wallet-service/model.yaml` only if the approved fixture needs a unique field.
- Modify: `tests/golden/java-spring-clean-multimodule/**` through the actual CLI generation flow.
- Modify: `packages/cli/tests/GenerateCommand.test.ts`
- Modify: `tests/integration/MultiModuleProfileFoundation.integration.test.ts`
- Modify: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`

- [ ] Add failing CLI/integration assertions for new artifact paths and expected dry-run counts.
- [ ] Run `npm run build` and generate the golden output with the CLI into the test golden location or the repository's established update workflow.
- [ ] Review generated Java source and ensure no single-module output changed.
- [ ] Run focused CLI and integration tests, then update only assertions caused by the approved artifacts.

### Task 7: Document the milestone and update current measured state

**Files:**
- Create: `docs/adr/ADR-052-soft-delete-active-uniqueness.md`
- Modify: `docs/adr/README.md`
- Modify: `ROADMAP.md`
- Modify: `docs/project/CURRENT-STATE.md`
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`

- [ ] Write the ADR with the active-scope composite-constraint decision, rejected alternatives, compatibility boundary, and exact runtime contract.
- [ ] Mark the milestone done only after validation evidence exists; record measured artifact counts and test totals in Current State.
- [ ] Move soft delete and attribute uniqueness from future limitations to supported Java multi-module behavior while preserving out-of-scope migration/database notes.
- [ ] Review documentation for contradictions with the approved design and existing PATCH/delete ADRs.

### Task 8: Run the complete quality gates and close the milestone

**Files:**
- No source files expected unless validation exposes an implementation defect.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:coverage`.
- [ ] Run the relevant Java multi-module smokes, including generation, HTTP, filtering/paging, error handling, OpenAPI, and Maven reactor.
- [ ] Run `git diff --check` and inspect the complete diff for scope and architecture.
- [ ] If Maven is unavailable in the sandbox, rerun the required Maven command with the approved escalation path and record the actual result.
- [ ] Update the roadmap only after all mandatory gates pass.

