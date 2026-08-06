# REST PATCH Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task with review checkpoints. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add deterministic partial-update support to the Java multi-module Golden Path through `PATCH /<entities>/{id}` while preserving the existing GET, POST, PUT, and DELETE contracts.

**Architecture:** Generate a REST request class that records property presence independently from nullable values, convert it to a technology-neutral Core patch command, and perform the merge inside a generated Core interactor using the existing `findById` and `update` gateway methods. Keep Jackson confined to the REST adapter and validate the complete generated flow with producer tests, goldens, a real-H2 HTTP test, OpenAPI assertions, a Maven smoke, and the full reactor gate.

**Tech Stack:** TypeScript generator, Nunjucks templates, Java 25, Spring MVC/Jackson, Spring Data JPA, H2, JUnit, AssertJ, Springdoc OpenAPI, Vitest, Maven.

## Global Constraints

- `PATCH /<collection>/{id}` returns `200` with the updated response DTO on success.
- Omitted fields preserve their current values; supplied values replace them; explicit `null` clears only attributes with `required: false`.
- A supplied `null` for `required: true`, an empty PATCH body, malformed JSON, invalid field types, and invalid path identifiers return `400`.
- Missing identifiers return `404`; unexpected failures remain `500` through the existing error contract.
- The path identifier is authoritative and is never accepted from the request body.
- Generated Core must not depend on Spring, JPA, Jackson, REST, concrete filesystems, or new external dependencies.
- Reuse the existing Core gateway `findById` and `update` methods; do not change the gateway interface or persistence provider contract.
- Preserve existing GET, POST, PUT, and DELETE behavior and generated output except for the additional PATCH operation and related OpenAPI documentation.
- Scope is limited to `java-spring-clean-multimodule`; leave `java-spring-clean` unchanged.
- Expected counts are full/configuration `131`, core `54`, entrypoints-rest `74`, infra-database `72`, build+core `60`, build `6`, and unchanged single-module counts.
- Do not add optimistic locking, ETags, auditing, soft delete, authentication, authorization, deployment scaffolding, registry support, plugin support, or unrelated refactors.
- Preserve existing user changes in `ROADMAP.md`, `docs/project/CURRENT-STATE.md`, and the previously created release-readiness plan/spec; do not commit, push, merge, rebase, or create a pull request.

---

### Task 1: Add Core patch command and validation

**Files:**
- Create: `packages/adapter-java/src/model/JavaPatchCommandTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaPatchUseCaseTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaPatchUseCaseInteractorTemplateModel.ts`
- Create: `packages/adapter-java/src/model/JavaPatchUseCaseInteractorTestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/patch/command.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/patch/usecase.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/patch/interactor.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/usecase/patch/interactor-test.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`

**Interfaces:**
- `Patch<Entity>Command` contains the identifier, one nullable value per non-identifier attribute, and one boolean `<attribute>Provided` flag per non-identifier attribute.
- `Patch<Entity>UseCase` exposes `Entity execute(Patch<Entity>Command command)`.
- `Patch<Entity>UseCaseInteractor` validates the command, loads the current entity with `gateway.findById(command.id())`, merges supplied values, and delegates the resulting entity to `gateway.update(...)`.

- [ ] **Step 1: Extend Core producer tests with failing artifact assertions**

Add the four expected template IDs and paths. Assert the Wallet patch command model has `UUID id`, `BigDecimal balance`, `boolean balanceProvided`, required-field metadata for `balance`, and a common message for the no-field case. Assert the interactor model imports the gateway, entity, patch command, `FieldViolation`, `ValidationException`, and `java.util.List`.

- [ ] **Step 2: Run the focused Core producer test and confirm RED**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`. It must fail because the patch artifact IDs and models do not exist.

- [ ] **Step 3: Implement the patch template models and producer invocations**

Follow the existing update producer patterns, but derive non-identifier fields and presence flags from `entity.attributes`. For each required non-identifier field, emit its domain-specific required message key and default. Emit a command-level violation using `common.patch.field.required` and `At least one field must be provided.` when no presence flag is true. Register the four manifest entries under `core/src/main/java` and `core/src/test/java` patch use-case paths.

- [ ] **Step 4: Implement the command and use-case templates**

Generate a Java record whose compact constructor validates identifier, required supplied-null fields, and the at-least-one-field rule. Generate the use-case interface and interactor so the interactor computes each constructor argument as `command.<field>Provided() ? command.<field>() : current.<getter>()`, then calls `gateway.update(merged)` exactly once.

- [ ] **Step 5: Add focused generated Core tests and run them GREEN**

Generate assertions for: null command, null identifier, empty patch, required supplied-null, optional supplied-null accepted, omitted field preserved, supplied value replaced, `findById` delegation, and one `update` delegation. Run the Core producer test and the relevant template tests.

### Task 2: Generate the PATCH REST request and controller operation

**Files:**
- Create: `packages/adapter-java/src/model/JavaPatchRestRequestTemplateModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/patch-request.java.njk`
- Modify: `packages/adapter-java/src/model/JavaDelegatingRestControllerTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts`
- Modify: `template-packs/java-spring-clean-multimodule/entrypoints-rest/domain/controller.java.njk`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`

**Interfaces:**
- `Patch<Entity>Request` is a mutable generated class with typed nullable fields, private presence flags, a no-argument constructor, Jackson setters that mark supplied fields including explicit null, and `toCommand(identifier)`.
- The controller model gains `patchUseCaseType`, `patchUseCaseFieldName`, `patchUseCaseExecuteMethodName`, `patchRequestType`, `patchMethodName`, `patchOperationSummary`, and `patchOperationDescription`.

- [ ] **Step 1: Add failing REST producer assertions**

Require `entrypoints-rest-domain-patch-request`, assert its request package, typed fields, presence flags, `@JsonSetter` setters, patch command import, and `toCommand(UUID id)`. Assert the controller contains `PatchWalletUseCase`, `PatchWalletRequest`, `PatchMapping`, `RequestBody`, and a `WalletResponse` return type while retaining all current PUT/POST/GET/DELETE fields.

- [ ] **Step 2: Run the focused REST producer test and confirm RED**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`. It must fail on the missing patch request and controller model fields.

- [ ] **Step 3: Implement the request model and template**

Generate one setter per non-identifier attribute. Each setter must assign the typed value and set its matching `<attribute>Provided` flag to `true`, including when Jackson invokes it with `null`. `toCommand` passes the path identifier, all values, and all flags in deterministic attribute order.

- [ ] **Step 4: Add the PATCH controller method**

Generate:

```java
@PatchMapping("/{id}")
public WalletResponse patch(@PathVariable UUID id, @RequestBody PatchWalletRequest request) {
    Wallet patched = patchWalletUseCase.execute(request.toCommand(id));
    return WalletResponse.from(patched);
}
```

Include OpenAPI responses `200`, `400`, `404`, and `500`. Do not modify existing operation mappings or POST `Location` behavior.

- [ ] **Step 5: Run focused REST/template tests and inspect output**

Run the REST producer tests and render the Wallet controller/request. Confirm omission and explicit null are represented by the generated setters/flags and that no Jackson type appears in Core models.

### Task 3: Add generated HTTP PATCH integration and OpenAPI coverage

**Files:**
- Create: `packages/adapter-java/src/model/JavaHttpPatchTestTemplateModel.ts`
- Create: `packages/adapter-java/src/transformers/createJavaHttpPatchTestModel.ts`
- Create: `template-packs/java-spring-clean-multimodule/configuration/http-patch-test.java.njk`
- Modify: `packages/adapter-java/src/model/JavaOpenApiSmokeTestTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/openapi-smoke-test.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`
- Modify: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml`

**Interfaces:**
- `JavaHttpPatchTestTemplateModel` supplies repository/entity fixtures, valid single-field and multi-field payloads, empty payload, required-null payload, optional-null expressions for transformer fixtures, invalid JSON, endpoint paths, and assertion snippets.
- `JavaOpenApiSmokeTestTemplateModel` adds `patchRequestSchemaName` and generated `documentsThePatchOperation()`/`patchOperation(...)` support.

- [ ] **Step 1: Add failing configuration producer assertions**

Require `configuration-http-patch-test` in deterministic order after the existing HTTP update artifact. Assert Wallet fixtures, `/wallets`, `PatchWalletRequest`, valid payloads, empty body, required-null payload, invalid JSON, and the OpenAPI patch schema name.

- [ ] **Step 2: Run the focused configuration producer test and confirm RED**

Run `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`. It must fail before the model, transformer, template, and producer invocation exist.

- [ ] **Step 3: Implement the patch HTTP transformer and template**

Use `@SpringBootTest(RANDOM_PORT)`, `@ActiveProfiles("test")`, real H2 repository cleanup, and JDK `HttpClient`. Generate tests for one-field preservation, multi-field replacement, empty object `400`, required-null `400`, missing identifier `404`, malformed JSON `400`, invalid UUID `400`, and persisted merged values. Keep fixtures deterministic and use the existing Java fixture resolver.

- [ ] **Step 4: Extend generated OpenAPI assertions**

Assert `PATCH /wallets/{id}`, a required UUID path parameter, a request schema without `id` and without required individual properties, `200 WalletResponse`, and `400/404/500` responses. Preserve all GET, POST, PUT, and DELETE assertions.

- [ ] **Step 5: Run focused tests and compile generated Java**

Run both configuration producer tests, `npm run build`, generate the full profile into a temporary directory, and compile/test the generated project with Maven before updating goldens.

### Task 4: Update structural tests, goldens, scripts, and CI

**Files:**
- Modify: `tests/integration/JavaMultimoduleBuildGeneration.integration.test.ts`
- Modify: `tests/integration/MultiModuleProfileFoundation.integration.test.ts`
- Create: `tests/smoke/java-multimodule-http-patch.smoke.test.ts`
- Modify: `tests/smoke/java-multimodule.smoke.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/continuous-integration.yml`
- Create/update: `tests/golden/java-spring-clean-multimodule`

- [ ] **Step 1: Add exact paths and count assertions**

Add four Core patch paths, the REST patch request path, the configuration HTTP patch path, changed controller/OpenAPI goldens, and expected counts `131/54/74/72/60/6`. Assert the single-module profile and unrelated Core/Infra/POM outputs remain unchanged except for the approved transitive Core additions.

- [ ] **Step 2: Add the dedicated Maven smoke**

Create `tests/smoke/java-multimodule-http-patch.smoke.test.ts` using the existing Maven smoke helper. Generate the full profile and run Maven filtered to `*HttpPatchTests` with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`; fail if Maven is unavailable.

- [ ] **Step 3: Register the script and CI ordering**

Add `smoke:http-patch:java-multimodule` as `npm run build && vitest run tests/smoke/java-multimodule-http-patch.smoke.test.ts`. Exclude the new smoke from `npm test` and coverage. Add the CI step after HTTP delete and before Maven reactor, preserving the existing environment variable policy.

- [ ] **Step 4: Generate and review goldens**

Generate fresh output from the CLI and copy only the approved new PATCH artifacts plus changed controller/OpenAPI/configuration outputs into the golden tree. Do not hand-edit generated Java or alter unrelated goldens.

### Task 5: Add ADR and update project documentation

**Files:**
- Create: `docs/adr/ADR-051-rest-patch-integration.md`
- Modify: `docs/adr/README.md`
- Modify: `README.md` only if its capability summary requires the PATCH endpoint
- Modify: `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- Modify: `docs/target-architecture/CAPABILITY-TAXONOMY.md`
- Modify: `ROADMAP.md`
- Modify: `docs/project/CURRENT-STATE.md`

- [ ] **Step 1: Write ADR-051**

Record the PATCH contract, omission/presence/null semantics, required-field behavior, Core merge ownership, reuse of `findById`/`update`, error mapping, concurrency limitation of read-merge-update, and explicit non-scope for locking, ETags, auditing, and security.

- [ ] **Step 2: Update architecture and capability documentation**

Document PATCH as a REST/Core capability, state that partial merge occurs in Core, and remove PATCH from the future-capability tables. Preserve the existing PUT and DELETE descriptions.

- [ ] **Step 3: Update measured project records only after validation**

Add Milestone 6.31 as `Done` only after all gates pass. Record actual counts, smoke results, test totals, and the new PATCH endpoint in `CURRENT-STATE.md`; do not copy volatile counts into architecture documents.

### Task 6: Verification and independent QA

**Files:**
- Review: all files changed by Tasks 1–5

- [ ] **Step 1: Run core gates**

Run `npm run typecheck`, `npm run build`, `npm test`, `npm run test:coverage`, and `git diff --check`.

- [ ] **Step 2: Run PATCH and adjacent smokes**

Run with Maven required: `npm run smoke:http-patch:java-multimodule`, `npm run smoke:http-delete:java-multimodule`, `npm run smoke:openapi:java-multimodule`, and `npm run smoke:maven-reactor:java-multimodule`. Run `npm run smoke:java-multimodule` and the relevant update-runtime smoke.

- [ ] **Step 3: Audit generated output and scope**

Re-run all documented dry-run selections, verify exact counts, search for accidental PATCH changes in the single-module profile, confirm no new dependencies/POM changes, and inspect goldens against fresh CLI output.

- [ ] **Step 4: Obtain independent QA review**

Have the `quality_assurance` role inspect the final diff, counts, docs, goldens, endpoint semantics, and gate output. Address rejected findings and rerun affected checks.

- [ ] **Step 5: Final status review**

Run `git status --short --branch`, `git diff --stat`, `git diff --name-only`, and `git diff --check`. Report exact evidence and leave commit/push decisions to the user.
