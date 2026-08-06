# Restore and Include-Deleted Queries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Preserve existing commits and uncommitted work; do not create commits unless explicitly requested.

**Goal:** Add explicit deleted-only query routes and a restore operation to the Java multi-module Golden Path while preserving active-only defaults.

**Architecture:** Keep the semantic Application Model unchanged. Add a generated Java `EntityTombstone` view and dedicated core use cases/gateway methods for `findDeletedById`, `findDeletedByFilterPage`, and `restoreById`; keep tombstone predicates and mutations in the Java persistence adapter. Expose `/deleted` and `/{id}/restore` routes with a dedicated tombstone response (`deletedAt`, but never `deletionScope`) and a 204 restore command.

**Tech Stack:** TypeScript generator, Nunjucks templates, Java 25, Spring Data JPA, Querydsl, H2, JUnit/AssertJ, Maven reactor.

## Global Constraints

- Apply changes only to `java-spring-clean-multimodule`; do not alter `java-spring-clean` output.
- Keep normal GET, filter, paging, find-by-id, PUT, PATCH, and DELETE active-only with unchanged routes and statuses.
- Use explicit `/deleted` routes; do not add an `includeDeleted` boolean query parameter.
- Do not expose `deletedAt` or `deletionScope` in the ordinary domain model or REST response; expose `deletedAt` only through the dedicated tombstone view/response.
- Restore must check active attribute-level uniqueness, preserve the tombstone on conflict, and use the existing 404/409 exception contracts; success returns 204.
- Restore must be transactional at the generated persistence-provider method.
- Add tests before production implementation for each new behavior and regenerate goldens through the actual CLI.
- Do not add authorization, hard purge, audit history, locking, new databases, composite unique groups, or dependencies.

---

### Task 1: Add RED tests and core contracts for deleted queries and restore

**Files:**
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`
- Create/modify: `packages/adapter-java/src/model/JavaRestoreCommandTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaRestoreUseCaseTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaRestoreUseCaseInteractorTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaRestoreUseCaseInteractorTestTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaFindDeletedUseCaseTemplateModel.ts`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/restore/command.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/restore/usecase.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/restore/interactor.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/restore/interactor-test.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/find/interactor-deleted-by-id.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/core/usecase/find/interactor-deleted-by-filter-page.java.njk`

**Interfaces:**
- `EntityGateway.findDeletedById(identifier)` returns `EntityTombstone` and uses the existing not-found contract.
- `EntityGateway.findDeletedByFilterPage(filterExpression, pageRequest)` returns `PageResult<EntityTombstone>`.
- `EntityGateway.restoreById(identifier)` returns `void` and emits no response body.
- `RestoreEntityCommand(identifier)` validates the identifier through the existing command pattern.

- [ ] Add producer assertions for the three gateway methods and ten new core artifact invocations.
- [ ] Run the focused core producer test and confirm it fails because the new artifacts/contracts do not exist.
- [ ] Add the minimal templates, model objects, manifest entries, and producer invocations.
- [ ] Run the focused producer test and confirm the generated core contract assertions pass.

### Task 2: Add RED tests and persistence-provider contracts

**Files:**
- Modify: `packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts`
- Modify: `packages/adapter-java/src/model/JavaPersistenceEntityTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/persistence-entity.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`

**Interfaces:**
- Persistence entity exposes `restore()` that sets `deletedAt = null` and `deletionScope = ACTIVE`.
- Persistence mapper exposes `toTombstone(entity)` and maps only `deletedAt` from persistence metadata.
- Provider implements `findDeletedById`, `findDeletedByFilterPage`, and `restoreById`.
- Deleted predicate is `deletedAt IS NOT NULL AND deletionScope != ACTIVE`.
- Restore uses `@Transactional`, loads the row regardless of active state, rejects active rows, checks active unique conflicts excluding the current identifier, restores, saves, and maps.

- [ ] Add failing producer assertions for restore metadata, deleted predicate metadata, and transaction import.
- [ ] Run the focused infra producer test and confirm the expected model fields are missing.
- [ ] Implement model preparation and templates using existing Querydsl/page/mapper conventions.
- [ ] Run the focused infra producer test and inspect generated Java for valid imports and method signatures.

### Task 3: Add REST endpoints and generated behavior tests

**Files:**
- Modify: `packages/adapter-java/src/model/JavaRestControllerTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/controller.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Create/modify: `packages/adapter-java/src/model/JavaRestorePersistenceTestTemplateModel.ts`
- Create/modify: `packages/adapter-java/src/model/JavaHttpRestoreTestTemplateModel.ts`
- Create/modify: `template-packs/java-spring-clean-multimodule/configuration/restore-persistence-test.java.njk`
- Create/modify: `template-packs/java-spring-clean-multimodule/configuration/http-restore-test.java.njk`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`

**Interfaces:**
- `GET /{entities}/deleted` delegates to the deleted filter/page use case.
- `GET /{entities}/deleted/{id}` delegates to the deleted-by-id use case.
- `POST /{entities}/{id}/restore` delegates to the restore use case and returns 204 with no body.

- [ ] Add producer assertions for deleted and restore injections, routes, OpenAPI responses, and generated test models; run them to confirm failure.
- [ ] Add the controller fields/constructor/methods and configuration test producers/templates.
- [ ] Generated persistence tests must cover deleted-only visibility, successful restore, already-active restore conflict, unique conflict rollback, and unknown identifier.
- [ ] Generated HTTP tests must cover normal 404 while deleted, deleted collection/by-id 200, restore 200, and restore conflict 409.
- [ ] Run focused adapter tests and confirm they pass.

### Task 4: Regenerate goldens and preserve profile boundaries

**Files:**
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Modify: `tests/golden/java-spring-clean-multimodule/**` through CLI generation.
- Test: `packages/cli/tests/GenerateCommand.test.ts`
- Test: `tests/integration/MultiModuleProfileFoundation.integration.test.ts`
- Test: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`

- [ ] Run `npm run build` and generate the wallet golden using the actual CLI.
- [ ] Verify the new deleted/restore core and configuration artifacts are present and the artifact count changes only by the approved additions.
- [ ] Compare generated single-module output with its existing goldens and confirm no files change.
- [ ] Run focused CLI/integration tests and update only expected counts/paths caused by this milestone.

### Task 5: Document the contract and measured state

**Files:**
- Create: `docs/adr/ADR-053-restore-include-deleted-queries.md`
- Modify: `docs/adr/README.md`
- Modify: `ROADMAP.md`
- Modify: `docs/project/CURRENT-STATE.md`
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`

- [ ] Keep ADR-053 aligned with the explicit routes, active-only defaults, conflict behavior, transaction boundary, and rejected alternatives.
- [ ] Mark restore/include-deleted supported only after all validation gates pass.
- [ ] Record fresh artifact counts, test totals, coverage, and Maven results in Current State.
- [ ] Remove the capability from future-only lists while keeping authorization, purge, auditing, locking, and new databases future work.

### Task 6: Run complete quality gates and close the milestone

**Files:**
- No source files expected unless a validation command exposes an implementation defect.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:coverage`.
- [ ] Run generation, HTTP, filter/paging, error handling, OpenAPI, and Maven reactor Java multi-module smokes.
- [ ] Run `git diff --check` and inspect the complete diff, including single-module and profile boundaries.
- [ ] Run independent QA and address all rejected findings before closing the milestone.
- [ ] Plan the next milestone only after every mandatory gate passes.
