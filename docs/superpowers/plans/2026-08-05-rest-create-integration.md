# REST Create Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing deterministic Wallet create runtime through `POST /wallets` with HTTP 201, relative `Location`, HTTP 400 request parsing errors, HTTP 409 duplicate-ID errors, generated HTTP coverage, and updated documentation.

**Architecture:** Keep validation in `CreateWalletCommand`; add a REST-only `Create<Entity>Request` with `toCommand()`. Extend the existing generated controller model/template for POST, map `ConflictException` and `HttpMessageNotReadableException` in the existing configuration handler, and add one generated real-H2 HTTP test per entity. No Core, persistence, POM, or single-module changes.

**Tech Stack:** TypeScript generator, Nunjucks templates, Java 25, Spring Boot MVC, Springdoc OpenAPI, JDK `HttpClient`, JUnit, H2, Vitest, Maven.

## Global Constraints

- Add exactly two generated artifacts for Wallet: `CreateWalletRequest.java` and `WalletHttpCreateTests.java`.
- Do not modify Core create classes, gateways, providers, repositories, POMs, or the single-module profile.
- Do not add Jakarta Validation annotations or `@Valid` to the request DTO/controller.
- Reuse `common.error.invalid-request`; do not add `common.request.body.invalid`.
- Preserve GET collection filter/page/size/sort and GET by ID contracts.
- Do not implement PUT, PATCH, DELETE, ID generation, idempotency, retry, advanced transactions, bulk create, or `DataIntegrityViolationException` translation.
- Expected full-profile count is 112 after the two new artifacts.

---

### Task 1: Establish baseline and generator contracts

**Files:**
- Create: `docs/superpowers/plans/2026-08-05-rest-create-integration.md`
- Inspect: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Inspect: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Inspect: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Test: existing TypeScript suite

- [ ] **Step 1: Run the clean baseline test suite**

Run `npm test` and record the exit code and test count before modifying production files.

- [ ] **Step 2: Confirm dry-run counts**

Run the real CLI dry-run for the complete profile and selected modules. Confirm 110 full/configuration operations, 6 build, 42 core, 59 entrypoints-rest selection, 60 infra-database selection, 48 build+core, and 110 build+configuration.

- [ ] **Step 3: Confirm the worktree state**

Run `git status --short` and preserve any pre-existing user changes. Do not reset or checkout files.

---

### Task 2: Add REST request DTO generation

**Files:**
- Create: `packages/adapter-java/src/model/JavaCreateRestRequestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/create-request.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`

**Interface:** Generate `Create<Entity>Request` in `entrypoint.rest.domains.<domain>.request`, with Java-resolved components and `toCommand()` returning `new Create<Entity>Command(...)`.

- [ ] **Step 1: Add a failing producer assertion**

Extend the REST producer test to require `entrypoints-rest-domain-create-request` and assert Wallet's model includes `UUID id`, `BigDecimal balance`, the request package, and the `CreateWalletCommand` import.

- [ ] **Step 2: Run the focused producer test and verify failure**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`. It must fail because the new invocation is absent.

- [ ] **Step 3: Implement the template model, template, producer invocation, and manifest entry**

Use `JavaTypeResolver` and `JavaImportCollector`; output to `entrypoints/rest/src/main/java/{{ packagePath }}/entrypoint/rest/domains/{{ domainName }}/request/{{ className }}.java`. Add the DTO after the per-entity response/controller invocations in deterministic order.

- [ ] **Step 4: Render and run the focused producer/template tests**

Run the adapter test and the template-engine tests. Confirm the generated DTO is a record, has no `@Valid`/Jakarta Validation annotation, and delegates to `CreateWalletCommand`.

---

### Task 3: Add controller POST and exception mappings

**Files:**
- Modify: `packages/adapter-java/src/model/JavaDelegatingRestControllerTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/controller.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Modify: `packages/adapter-java/src/model/JavaGlobalExceptionHandlerTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/global-exception-handler.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/global-exception-handler-test.java.njk`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`

**Interface:** Controller receives `Create<Entity>UseCase`, `@PostMapping` consumes `Create<Entity>Request`, returns `ResponseEntity<Entity>Response`, and uses `ResponseEntity.created(URI.create("/<entities>/" + created.getId()))`. Handler maps `ConflictException` to 409 and `HttpMessageNotReadableException` to 400 using `common.error.invalid-request`.

- [ ] **Step 1: Add failing producer/template assertions**

Assert the controller model contains create-use-case fields/imports and the handler model produces the existing handler artifact with the new exception behavior.

- [ ] **Step 2: Run focused tests and verify failure**

Run both adapter producer test files. They must fail on the missing model properties or generated behavior.

- [ ] **Step 3: Implement the controller model/template**

Add imports for `URI`, `ResponseEntity`, `PostMapping`, `RequestBody`, `Create<Entity>Request`, `Create<Entity>Command`, and `Create<Entity>UseCase`. Preserve the existing GET blocks byte-for-byte except for model-driven additions needed by the class constructor/imports.

- [ ] **Step 4: Implement the handler template changes**

Add explicit handlers following the existing `NotFoundException` pattern. The unreadable-body handler returns an empty `fields` list and resolves `common.error.invalid-request` with default `Invalid request.`.

- [ ] **Step 5: Run focused tests and render the generated Java**

Run adapter tests and inspect generated controller/handler output. Confirm there is no Core or persistence source change.

---

### Task 4: Add generated HTTP create and OpenAPI tests

**Files:**
- Create: `packages/adapter-java/src/model/JavaHttpCreateTestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/configuration/http-create-test.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Modify: `packages/adapter-java/src/model/JavaOpenApiSmokeTestTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/openapi-smoke-test.java.njk`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`

**Interface:** Generate `<Entity>HttpCreateTests` with real H2 repository arrange/cleanup and JDK HTTP requests for valid create, conflict, null fields, malformed UUID, malformed JSON, and create-then-find-by-ID. Extend OpenAPI smoke generation to inspect POST without snapshotting the full document.

- [ ] **Step 1: Add failing producer assertions for the new test artifact and OpenAPI expectations**

Require `configuration-http-create-test` in the producer sequence and assert the Wallet model contains the expected endpoint, repository, fixtures, and test class name.

- [ ] **Step 2: Run the focused configuration producer test and verify failure**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`; it must fail before implementation.

- [ ] **Step 3: Implement the HTTP create template/model**

Use the existing `HttpClient`, `ObjectMapper`, fixture resolver, `WalletRepository`, and `WalletEntity` conventions. Assert status, relative Location, response body, persistence values, duplicate conflict body/original preservation, invalid payloads, and subsequent GET.

- [ ] **Step 4: Implement OpenAPI POST assertions**

Add a POST operation helper and assertions for request body `$ref` to `CreateWalletRequest`, schema existence, 201 response `$ref` to `WalletResponse`, 400/409/500, and the optional Location header if emitted by Springdoc. Keep all existing GET assertions.

- [ ] **Step 5: Run focused TypeScript tests and compile the generated project**

Run the adapter tests, build the generator, generate the full profile into a temporary directory, and run Maven compilation before proceeding.

---

### Task 5: Update structural tests, smoke, CI, goldens, and docs

**Files:**
- Modify: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`
- Modify: `tests/smoke/java-multimodule.smoke.test.ts`
- Create: `tests/smoke/java-multimodule-http-create.smoke.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/continuous-integration.yml`
- Create: `docs/adr/ADR-046-rest-create-integration.md`
- Modify: `README.md`
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`
- Create: `tests/golden/java-spring-clean-multimodule/entrypoints-rest/.../CreateWalletRequest.java`
- Create: `tests/golden/java-spring-clean-multimodule/configuration/.../WalletHttpCreateTests.java`
- Modify: generated goldens for controller, handler, handler tests, and OpenAPI tests

- [ ] **Step 1: Add the new paths and count 112 to structural/golden tests**

Update expected order and golden lookup only for the two new paths and the four changed generated files. Leave Core, gateway/provider/repository, POM, and single-module goldens unchanged.

- [ ] **Step 2: Add the dedicated HTTP-create smoke**

Reuse `MavenSmokeSupport`, generate the complete profile, and run Maven with `*HttpCreateTests`. Preserve the existing Maven availability/`CODEGEN_REQUIRE_MAVEN_SMOKE` behavior.

- [ ] **Step 3: Register the script and CI step**

Add `smoke:http-create:java-multimodule`, exclude the smoke from `test` and `test:coverage`, and place the CI step after create-runtime and before Maven-reactor.

- [ ] **Step 4: Add ADR and update current documentation**

Record the approved POST/201/Location/400/409 design and update stale statements that POST, HTTP 409, or REST writes are future/read-only. Update the confirmed baseline to 112.

- [ ] **Step 5: Generate fresh goldens from the real output**

Generate into a temporary directory, copy only the approved changed/new generated artifacts into the golden tree, and review the diff for scope violations.

---

### Task 6: Verification matrix

- [ ] **Step 1: Run immediate checks**

Run `npm run typecheck`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run smoke:http-create:java-multimodule`, `npm run smoke:openapi:java-multimodule`, `npm run smoke:create-runtime:java-multimodule`, `npm run smoke:maven-reactor:java-multimodule`, and `git diff --check`.

- [ ] **Step 2: Run the complete requested matrix**

Run every command from the Milestone 6.25 matrix, including the new HTTP-create smoke. Maven must execute; do not accept a skip as success when `CODEGEN_REQUIRE_MAVEN_SMOKE=true`.

- [ ] **Step 3: Audit scope and counts**

Run real dry-runs and confirm 112 full/configuration operations, 60 entrypoints-rest selection operations, unchanged Core/Infra/POM/single-module files, and no PUT/PATCH/DELETE artifacts or endpoints.

- [ ] **Step 4: Review final diff**

Use `git diff --stat`, `git diff --name-only`, and targeted searches for forbidden changes before reporting the milestone as complete.
