# REST Update Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing deterministic update runtime through `PUT /wallets/{id}`, returning `WalletResponse` with HTTP 200 and covering real H2 persistence, invalid requests, missing identifiers, OpenAPI, smoke, CI, goldens, and documentation.

**Architecture:** Keep update validation and not-found behavior in the existing Core `UpdateWalletCommand`/`UpdateWalletUseCase` path. Add a REST-only `Update<Entity>Request` that receives the path identifier in `toCommand(UUID id)`, extend the existing generated controller model/template with a direct `WalletResponse` PUT method, and generate one real-H2 HTTP update test per entity. Do not change Core, persistence, POMs, the single-module profile, or the existing exception handler.

**Tech Stack:** TypeScript generator, Nunjucks templates, Java 25, Spring MVC, Springdoc OpenAPI, JDK `HttpClient`, JUnit, H2, Vitest, Maven.

## Global Constraints

- Implement exactly `PUT /wallets/{id}` for full replacement of mutable fields.
- Add exactly two generated artifacts: `UpdateWalletRequest.java` and `WalletHttpUpdateTests.java`.
- The request DTO excludes identifier components and exposes `toCommand(UUID id)`; it has no Jakarta Validation annotations and no `@Valid`.
- Success is HTTP 200 with a `WalletResponse` body; do not return 201, 204, or `Location`.
- Invalid body, missing/null `balance`, invalid JSON, and invalid path UUID map to 400 through existing mappings; missing entity maps to 404; unexpected errors map to 500.
- Do not alter `GlobalExceptionHandler`, Core, Infra, gateways, providers, repositories, POMs, or the single-module profile.
- Do not implement PATCH, DELETE, partial/merge/JSON Patch, optimistic locking, ETag, If-Match, versioning, auditing, `updatedAt`, idempotency, retries, advanced transactions, or new Jackson policy.
- Preserve existing GET collection, GET by ID, POST, filter, paging, sorting, and POST `Location` behavior.
- Expected counts after implementation: full/configuration 119, build 6, core 46, entrypoints-rest 65, infra-database 64, build+core 52, build+configuration 119.
- No commit, push, merge, rebase, or pull request without explicit authorization.

---

### Task 1: Establish baseline and implementation contracts

**Files:**
- Inspect: `package.json`, `.github/workflows/continuous-integration.yml`, `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Inspect: existing REST/configuration producers, models, templates, tests, goldens, smoke tests, ADR-047 and current docs
- Test: current Vitest and dry-run commands

- [ ] **Step 1: Record the clean baseline**

Run `git status --short`, `npm test`, `npm run typecheck`, and the real CLI dry-runs for full/configuration, build, core, entrypoints-rest, infra-database, and build+core/build+configuration. Confirm the supplied baseline is 117/6/46/64/64/52/117 and record the actual default test count.

- [ ] **Step 2: Confirm update runtime contracts**

Read the existing generated `UpdateWalletCommand`, `UpdateWalletUseCase`, interactor, gateway, provider, repository, and exception handler. The REST implementation must call `request.toCommand(id)` and must not duplicate their validation or persistence logic.

- [ ] **Step 3: Confirm ownership and scope**

Create a file ownership list before editing. Allowed changes are REST adapter models/producers/templates/tests, generated REST/configuration artifacts and goldens, manifest, package scripts, CI, ADR-048, and the three requested documentation files. Core, Infra, POMs, single-module files, and `GlobalExceptionHandler` remain read-only.

### Task 2: Add the update request DTO generator

**Files:**
- Create: `packages/adapter-java/src/model/JavaUpdateRestRequestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/update-request.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`

**Interface:** `JavaUpdateRestRequestTemplateModel` contains package/imports, `recordName`, non-identifier `components`, `commandType`, command package, and `commandArguments`. For Wallet it renders:

```java
public record UpdateWalletRequest(
    BigDecimal balance
) {
    public UpdateWalletCommand toCommand(UUID id) {
        return new UpdateWalletCommand(id, balance);
    }
}
```

- [ ] **Step 1: Add the failing producer assertions**

Extend the REST producer test to require `entrypoints-rest-domain-update-request`. Assert its package, `UpdateWalletRequest`, `UpdateWalletCommand` import, `UUID` import for `toCommand`, exactly the non-identifier components, and command arguments `id` followed by the mutable attribute values.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`. The test must fail because the update artifact and model properties do not exist yet.

- [ ] **Step 3: Implement the model, template, producer invocation, and manifest entry**

Resolve Java types/imports with `JavaTypeResolver` and `JavaImportCollector`. Filter `attribute.identifier` out of record components, but prepend the path identifier to `UpdateWalletCommand` arguments. Add manifest ID `entrypoints-rest-domain-update-request` with output under `entrypoints/rest/src/main/java/{{ packagePath }}/entrypoint/rest/domains/{{ domainName }}/request/{{ className }}.java`.

- [ ] **Step 4: Run focused adapter/template tests**

Run the producer test and template-engine tests. Confirm no `@Valid`, Jakarta Validation, entity request, or `WalletResponse` request is generated.

### Task 3: Extend the generated controller with PUT update

**Files:**
- Modify: `packages/adapter-java/src/model/JavaDelegatingRestControllerTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/controller.java.njk`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`

**Interface:** Add `updateUseCaseType`, `updateUseCaseFieldName`, `updateUseCaseExecuteMethodName`, `updateRequestType`, `updateMethodName`, `updateOperationSummary`, and `updateOperationDescription`. The generated method is direct-return:

```java
@PutMapping("/{id}")
public WalletResponse update(
    @PathVariable UUID id,
    @RequestBody UpdateWalletRequest request
) {
    Wallet updated = updateWalletUseCase.execute(request.toCommand(id));
    return WalletResponse.from(updated);
}
```

- [ ] **Step 1: Add failing model/template assertions**

Assert the Wallet controller model contains the update fields, `UpdateWalletUseCase`/`UpdateWalletRequest` imports, `PutMapping`, `RequestBody`, and no `ResponseEntity` update return contract. Assert the existing GET and POST model fields remain unchanged.

- [ ] **Step 2: Run the focused producer test and verify failure**

Run the REST producer test and confirm failure on the missing update model/artifact.

- [ ] **Step 3: Implement the controller model and template**

Import `UpdateWalletUseCase`, `UpdateWalletRequest`, `PutMapping`, and the existing domain/response types. Add the fourth constructor dependency and the PUT method. Preserve GET and POST behavior, including POST `ResponseEntity.created(...)`, `Location`, filters, paging, and sorting. Do not add PATCH or DELETE.

- [ ] **Step 4: Run focused tests and inspect generated controller output**

Run the REST producer/template tests and render a Wallet controller. Confirm the PUT method uses the path UUID exclusively, returns `WalletResponse`, and does not use `ResponseEntity` for update.

### Task 4: Add generated HTTP update test and OpenAPI assertions

**Files:**
- Create: `packages/adapter-java/src/model/JavaHttpUpdateTestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/configuration/http-update-test.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Modify: `packages/adapter-java/src/model/JavaOpenApiSmokeTestTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/openapi-smoke-test.java.njk`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`

**Interface:** `JavaHttpUpdateTestTemplateModel` supplies real-H2 repository imports, entity/identifier/value fixtures, endpoint paths, valid/null/missing/invalid JSON payloads, and generated assertion snippets. The test uses `@SpringBootTest(RANDOM_PORT)`, `@ActiveProfiles("test")`, real `WalletRepository`, JDK `HttpClient`, `@AfterEach deleteAll()`, and no mocks.

- [ ] **Step 1: Add failing configuration producer assertions**

Require `configuration-http-update-test` after the existing HTTP/create/update-runtime-related artifacts in deterministic order. Assert `WalletHttpUpdateTests`, `/wallets`, repository/entity types, fixtures, and all payload expressions. Extend the OpenAPI model assertions for update schema/path/response names.

- [ ] **Step 2: Run the focused test and verify failure**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`. It must fail before the new artifact/model/template exists.

- [ ] **Step 3: Implement the update test model and template**

Generate these seven scenarios: existing PUT returns 200/body/persisted new balance; PUT then GET returns updated values; missing ID returns 404 and creates nothing; null balance returns 400 and preserves original; missing balance returns 400; malformed JSON returns 400; invalid UUID path returns 400. Do not make extra body-ID ownership behavior mandatory and do not change global Jackson policy.

- [ ] **Step 4: Add OpenAPI update model fields and assertions**

Add `updateRequestSchemaName` and any exact operation fields needed by the approved design. Add `documentsTheUpdateOperation()` and `updateOperation(document)` to the generated smoke test. Assert `PUT /wallets/{id}`, required UUID path parameter, `UpdateWalletRequest` request body/schema without `id`, 200 `WalletResponse`, 400/404/500 responses, and preservation of GET/POST documentation. Do not snapshot the complete document, document 409, or create a redundant response schema name.

- [ ] **Step 5: Run focused tests and compile generated output**

Run the producer tests, build the generator, generate the full profile into a temporary directory, and compile the generated Java project with Maven before updating goldens.

### Task 5: Update manifest, structural tests, smoke, CI, and goldens

**Files:**
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Modify: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`
- Modify: `tests/smoke/java-multimodule.smoke.test.ts`
- Create: `tests/smoke/java-multimodule-http-update.smoke.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/continuous-integration.yml`
- Create/update: generated `tests/golden/java-spring-clean-multimodule` REST/configuration artifacts

- [ ] **Step 1: Add exact generated paths and count assertions**

Add the two new artifact paths and update changed Wallet controller/OpenAPI goldens. Update expected totals to 119 full/configuration and 65 entrypoints-rest while retaining 6 build, 46 core, 64 infra, and 52 build+core. Assert no new Core/Infra/POM/single-module output.

- [ ] **Step 2: Add the dedicated Maven smoke**

Create `tests/smoke/java-multimodule-http-update.smoke.test.ts` using the existing `MavenSmokeSupport` policy. Generate the full profile and run Maven tests filtered to `*HttpUpdateTests`, with `CODEGEN_REQUIRE_MAVEN_SMOKE=true` enforced by the script/CI.

- [ ] **Step 3: Register npm scripts and CI ordering**

Add `smoke:http-update:java-multimodule` as `npm run build && vitest run tests/smoke/java-multimodule-http-update.smoke.test.ts`. Exclude the new smoke from `npm test` and `npm run test:coverage`. Add the CI step after update runtime and before Maven reactor, using the existing job and Maven-required environment.

- [ ] **Step 4: Generate and review fresh goldens**

Generate real output, copy only `UpdateWalletRequest.java`, `WalletHttpUpdateTests.java`, changed `WalletController.java`, and changed `WalletOpenApiSmokeTests.java` into the golden tree. Keep Core, Infra, handler, POM, and single-module goldens unchanged unless the real approved output proves otherwise; never hand-edit generated Java to hide a mismatch.

### Task 6: ADR and documentation

**Files:**
- Create: `docs/adr/ADR-048-rest-update-integration.md`
- Modify: `README.md`
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`

- [ ] **Step 1: Write ADR-048**

Record the approved PUT contract, path-only identifier, request conversion, 200/404/400 behavior, PATCH as future work, consequences, and risks: full replacement of mutable fields, future merge needs, no optimistic locking, last-write-wins, current unknown-property policy, and no `Location` on PUT.

- [ ] **Step 2: Update current documentation**

Change stale statements that REST update is future/read-only. Record the 119/65/64/46/6/52 counts only after real dry-run confirmation, document the generated flow and validation behavior, and preserve references to ADR-047.

### Task 7: Verification matrix and scope audit

- [ ] **Step 1: Run immediate checks**

Run `npm run typecheck`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run smoke:http-update:java-multimodule`, `npm run smoke:update-runtime:java-multimodule`, `npm run smoke:openapi:java-multimodule`, `npm run smoke:http-create:java-multimodule`, `npm run smoke:maven-reactor:java-multimodule`, and `git diff --check`. Maven must execute rather than skip.

- [ ] **Step 2: Run the complete existing matrix**

Run the repository's declared Java multi-module smoke scripts and include the new HTTP update smoke immediately before Maven reactor. Set `CODEGEN_REQUIRE_MAVEN_SMOKE=true` for Maven-backed commands and record every exit code.

- [ ] **Step 3: Audit requirements and forbidden scope**

Run real dry-runs and verify all expected counts, exact two new artifacts, PUT-only HTTP surface, unchanged GET/POST, no PATCH/DELETE, unchanged Core/Infra/handler/POM/single-module files, and no undeclared dependencies.

- [ ] **Step 4: Review final diff**

Run `git diff --stat`, `git diff --name-only`, `git diff --check`, and targeted searches for `@PatchMapping`, `@DeleteMapping`, `ResponseEntity` in update code, `Location` in PUT code, and changes to forbidden paths. Report actual tests, Maven execution, counts, goldens, docs, risks, and any divergences.
