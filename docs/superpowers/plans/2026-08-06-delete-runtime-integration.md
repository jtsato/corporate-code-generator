# Milestone 6.28 — Delete Runtime Integration Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD and preserve the approved scope.

**Goal:** Add deterministic physical delete runtime support to the Java multi-module Core/JPA Golden Path without changing REST, OpenAPI, POMs, or single-module generation.

**Architecture:** Generate four Core artifacts for `Delete<Entity>Command`, `Delete<Entity>UseCase`, its interactor, and its unit tests. Extend the technology-agnostic gateway contract with `deleteById`, implement existence-checked physical deletion in the Infra provider, and add one explicitly wired Configuration persistence test artifact.

**Tech Stack:** TypeScript producers, Nunjucks templates, generated Java 25, Spring Boot, Spring Data JPA, H2, JUnit, AssertJ, Vitest, Maven.

## Global Constraints

- Add exactly five generated artifacts: four Core and one Configuration.
- Use `Delete<Entity>Command`; Wallet resolves its identifier to `UUID`.
- Use `void deleteById(UUID id)` in the Core gateway and `void execute(DeleteWalletCommand command)` in the use case.
- Provider uses `Objects.requireNonNull`, `existsById`, `NotFoundException("wallet.not-found", "Wallet was not found.")`, then `deleteById`.
- Do not add DELETE HTTP, `@DeleteMapping`, HTTP 204, OpenAPI delete, soft delete, cascade policy, audit, locking, POM changes, or single-module changes.
- Preserve all 6.27 REST/OpenAPI artifacts and goldens byte-for-byte.
- Do not commit.

### Task 1: Core producer contract RED

**Files:**
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`
- Modify: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`
- Modify: `tests/integration/MultiModuleProfileFoundation.integration.test.ts`

- [ ] Add expected Core template IDs and paths for the four delete artifacts, expected interface method, and count increases.
- [ ] Run focused producer/integration tests and confirm RED because delete artifacts and gateway method are absent.

### Task 2: Core delete artifacts GREEN

**Files:**
- Create: `packages/adapter-java/src/model/JavaDeleteCommandTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaDeleteUseCaseTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaDeleteUseCaseInteractorTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaDeleteUseCaseInteractorTestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/delete/command.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/delete/usecase.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/delete/interactor.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/delete/interactor-test.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/core/gateway/gateway.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`

- [ ] Implement models using the existing create/update patterns and resolved identifier type.
- [ ] Generate command validation with `FieldViolation("id", "common.identifier.required", "Identifier is required.")`.
- [ ] Generate interactor validation with `FieldViolation("command", "common.command.required", "Command is required.")` and delegate once to `deleteById`.
- [ ] Add `deleteById` to the generated gateway while preserving all existing methods.
- [ ] Run Core producer and integration tests GREEN.

### Task 3: Infra provider RED/GREEN

**Files:**
- Modify: `packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

- [ ] Add a failing producer assertion for delete imports/model/method.
- [ ] Add the minimal provider model and template method using `existsById` then `deleteById`.
- [ ] Verify Infra produces no new artifact and its selection count rises only through Core transitively.

### Task 4: Wiring and persistence artifact

**Files:**
- Modify: `packages/adapter-java/src/model/JavaDomainConfigurationTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/domain-configuration.java.njk`
- Create: `packages/adapter-java/src/model/JavaDeletePersistenceTestTemplateModel.ts`
- Create: `packages/adapter-java/src/transformers/createJavaDeletePersistenceTestModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/configuration/delete-persistence-test.java.njk`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`

- [ ] Add explicit `Delete<Entity>UseCase` bean wiring without looping/generalizing the template.
- [ ] Generate H2 persistence tests for existing, missing, and repeated deletion.
- [ ] Keep the new test non-web with `@SpringBootTest`, `@ActiveProfiles("test")`, repository cleanup, and real `DeleteWalletUseCase`.

### Task 5: Update Core fakes and goldens

**Files:**
- Modify: Core producer/test models as needed for six existing fake templates.
- Modify: `template-packs/java-spring-clean-multimodule/core/usecase/create/interactor-test.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/core/usecase/update/interactor-test.java.njk`
- Modify: relevant find interactor test templates.
- Add/update only approved Core/Infra/Configuration goldens.

- [ ] Add empty `deleteById` stubs to all existing generated fake gateways without adding counters.
- [ ] Confirm REST/OpenAPI goldens remain unchanged.

### Task 6: Smoke, CI, docs, and ADR

**Files:**
- Create: `tests/smoke/java-multimodule-delete-runtime.smoke.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/continuous-integration.yml`
- Create: `docs/adr/ADR-049-delete-runtime-integration.md`
- Modify: `README.md`
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`

- [ ] Add `smoke:delete-runtime:java-multimodule` with Maven filter `*DeletePersistenceTests,*DeleteWalletUseCaseInteractorTests`.
- [ ] Exclude the new smoke from `npm test` and coverage.
- [ ] Insert CI step after HTTP update and before Maven reactor with Maven required.
- [ ] Update counts only after dry-run/integration confirms 124.
- [ ] Document accepted risks and REST non-scope in ADR-049 and architecture docs.

### Task 7: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:coverage`.
- [ ] Run delete, HTTP update, update runtime, and Maven reactor smokes with Maven available.
- [ ] Run the existing Java multi-module smoke matrix.
- [ ] Run `git diff --check` and inspect status/diff for forbidden REST/OpenAPI/POM/single-module changes.
