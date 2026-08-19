# NestJS CRUD Integration Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend the generated nestjs-clean-architecture Golden Path with complete in-memory CRUD behavior (POST, GET, PUT, PATCH, DELETE) for every entity.

**Architecture:** Keep the existing bootstrap -> web-api -> core and bootstrap -> infra-persistence -> core dependency direction. Add framework-free Core commands, validators, use cases, and ports; implement the ports in the in-memory persistence adapter; expose the behavior through the existing controller, response envelope, filters, and composition root. The reference application informs ports, mappers, providers, and testing patterns but is not copied literally.

**Tech Stack:** TypeScript, Nunjucks templates, NestJS, class-validator at the generated HTTP boundary, Vitest, generated Jest/Supertest e2e tests.

**Spec:** docs/superpowers/specs/2026-08-19-nestjs-crud-integration-design.md

## Global Constraints

- Do not modify the Application Model/IR or profiles/nestjs-clean-architecture/profile.yaml.
- The generated Core must remain free of @nestjs/*, class-validator, and class-transformer imports.
- The generated response body shape and response transformer must remain unchanged.
- PUT is full replacement and is not an upsert; PATCH is a plain partial object; DELETE is physical, non-idempotent, and returns 404 after deletion.
- Do not add sorting, soft delete/restore, ORM/database support, uniqueness conflict handling, or NestJS README/CI/container artifacts in this milestone.
- Preserve existing Java output byte-for-byte.
- Follow TDD: each production behavior starts with a focused failing test and the failure is observed before implementation.
- Regenerate golden files with the built CLI; do not author generated goldens as the primary implementation.

---

### Task 1: Prepare isolated execution and verify the baseline

**Files:**
- Read: AGENTS.md, docs/project/CURRENT-STATE.md, docs/project/QUALITY-GATES.md, docs/SOLUTION-SPECIFICATION.md
- Read: docs/superpowers/specs/2026-08-19-nestjs-crud-integration-design.md
- Read: C:/Dev/99-sandbox/nestjs-clean-architecture-example/README.md and relevant src/core, src/infra, and src/web-api files

**Interfaces:**
- Consumes: the approved CRUD design and current repository state.
- Produces: an isolated workspace or an explicit in-place execution decision, plus a verified baseline.

- [ ] Step 1: Check repository isolation and current changes

Run:

    git rev-parse --git-dir
    git rev-parse --git-common-dir
    git branch --show-current
    git status --short

Preserve the existing user change in README.md. If an isolated worktree is created, ensure the feature work includes the approved README change without overwriting it.

- [ ] Step 2: Run the baseline TypeScript suite

Run:

    npm test

Expected: the pre-change suite passes with zero failures. If the baseline fails, stop and report the failure before implementing CRUD.

- [ ] Step 3: Build the current CLI for generated-project tests

Run:

    npm run build

Expected: exit code 0 and packages/cli/dist/index.js exists.

---

### Task 2: Define prepared NestJS template models and path parsing

**Files:**
- Modify: packages/adapter-nestjs/src/model/NestJsEntityTemplateModel.ts
- Modify: packages/adapter-nestjs/src/transformers/NestJsEntityTransformer.ts
- Test: packages/adapter-nestjs/tests/NestJsEntityTransformer.test.ts
- Test: packages/adapter-nestjs/tests/TypeScriptTypeResolver.test.ts

**Interfaces:**
- Consumes: semantic Entity attributes and the existing TypeScriptTypeResolver.
- Produces: prepared template data containing mutableProperties, update/patch validation metadata, and a deterministic identifier.pathValueExpression used by all ID-based HTTP operations.

- [ ] Step 1: Add failing transformer tests

Add tests that assert:

    expect(model.mutableProperties.map((property) => property.name)).toEqual(["balance"]);
    expect(model.identifier.pathValueExpression).toBe("id");

Add a numeric identifier case asserting the generated path expression converts the route string to a number and leaves invalid values available for Core validation. Add date/datetime coverage if the resolver supports those identifier types.

- [ ] Step 2: Run the focused tests and verify RED

Run:

    npm test -- packages/adapter-nestjs/tests/NestJsEntityTransformer.test.ts packages/adapter-nestjs/tests/TypeScriptTypeResolver.test.ts

Expected: failure because mutableProperties and path parsing metadata do not exist yet.

- [ ] Step 3: Implement the prepared model

Add focused model fields rather than making templates infer semantics:

    readonly mutableProperties: readonly NestJsPropertyTemplateModel[];
    readonly identifier: NestJsPropertyTemplateModel & {
      readonly pathValueExpression: string;
    };
    readonly updateRequestValidationImports: readonly string[];
    readonly patchRequestValidationImports: readonly string[];

Compute mutable properties by excluding the semantic identifier. Compute the path expression in the adapter for supported primitive identifiers. Do not introduce framework types into the Core model.

- [ ] Step 4: Run focused tests and verify GREEN

Run the same focused command. Expected: all transformer/type resolver tests pass.

---

### Task 3: Add Core update use case with TDD

**Files:**
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/command.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/command.validator.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/gateway.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/usecase.interface.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/usecase.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/update/usecase.spec.ts.njk
- Modify: packages/adapter-nestjs/src/generation/NestJsCleanArchitectureCoreArtifactProducer.ts
- Modify: template-packs/nestjs-clean-architecture/manifest.yaml
- Test: packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

**Interfaces:**
- Consumes: mutableProperties and existing primitive validation statement generation.
- Produces: Update<Entity>Command, Update<Entity>CommandValidator, IUpdate<Entity>Gateway, IUpdate<Entity>UseCase, and Update<Entity>UseCase.

- [ ] Step 1: Add a failing producer test for update template IDs

Assert that the Core producer returns these additional IDs once per entity:

    expect(templateIds).toEqual(expect.arrayContaining([
      "core-update-command",
      "core-update-command-validator",
      "core-update-gateway",
      "core-update-usecase-interface",
      "core-update-usecase",
      "core-update-usecase-test",
    ]));

- [ ] Step 2: Run the producer test and verify RED

Run:

    npm test -- packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

Expected: failure because the producer and manifest do not declare update artifacts.

- [ ] Step 3: Add update templates and manifest entries

Generate a full command containing the path identifier and every mutable property. The validator must run the same semantic type/required checks used by create. The use case must construct a new domain entity and delegate to the shared update gateway. A gateway result of undefined must raise the existing Core NotFoundException.

Use output paths under src/core/usecases/update-{{ fileName }}/ and keep all imports relative to Core.

- [ ] Step 4: Add generated Core update behavior tests

The generated test must prove:

- invalid input does not call the gateway;
- valid full replacement delegates the identifier and mutable values;
- a missing entity raises NotFoundException.

- [ ] Step 5: Run producer tests and generated Core-focused smoke

Run:

    npm test -- packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts tests/smoke/nestjs-clean-architecture.smoke.test.ts

Expected: producer assertions pass; golden assertions may remain red until goldens are regenerated in Task 8.

---

### Task 4: Add Core patch and delete use cases with TDD

**Files:**
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/command.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/changes.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/command.validator.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/usecase.interface.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/usecase.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/patch/usecase.spec.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/delete/command.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/delete/gateway.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/delete/usecase.interface.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/delete/usecase.ts.njk
- Create: template-packs/nestjs-clean-architecture/core/usecases/delete/usecase.spec.ts.njk
- Modify: packages/adapter-nestjs/src/generation/NestJsCleanArchitectureCoreArtifactProducer.ts
- Modify: template-packs/nestjs-clean-architecture/manifest.yaml
- Test: packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

**Interfaces:**
- Consumes: existing IGet<Entity>ByIdGateway and the update gateway from Task 3.
- Produces: Patch<Entity>Command with Patch<Entity>Changes, Patch<Entity>UseCase, Delete<Entity>Command, IDelete<Entity>Gateway, and Delete<Entity>UseCase.

- [ ] Step 1: Add failing producer assertions for patch/delete artifacts

Assert all eleven new Core IDs are present:

    expect(templateIds).toEqual(expect.arrayContaining([
      "core-patch-command",
      "core-patch-changes",
      "core-patch-command-validator",
      "core-patch-usecase-interface",
      "core-patch-usecase",
      "core-patch-usecase-test",
      "core-delete-command",
      "core-delete-gateway",
      "core-delete-usecase-interface",
      "core-delete-usecase",
      "core-delete-usecase-test",
    ]));

- [ ] Step 2: Run the focused producer test and verify RED

Run the producer test from Task 3. Expected: failure for missing patch/delete template IDs.

- [ ] Step 3: Implement patch templates

Generate a changes type containing mutable properties as optional non-null values. The validator must reject an empty changes object and validate every supplied property. The use case must load the current entity through the existing find-by-ID gateway, preserve omitted properties, apply supplied values, and delegate the merged entity to the shared update gateway. Missing current entities raise NotFoundException.

- [ ] Step 4: Implement delete templates

Generate a command containing the semantic identifier. The use case calls the delete gateway and raises NotFoundException when the gateway returns false; otherwise it completes with no body value.

- [ ] Step 5: Add generated Core tests and verify focused GREEN

Generated tests must prove patch validation short-circuiting, empty patch rejection, omitted-field preservation, update delegation, delete delegation, and repeated/missing delete not-found behavior. Run the focused adapter tests and inspect the generated source for framework-free Core imports.

---

### Task 5: Extend in-memory persistence with update/delete

**Files:**
- Modify: template-packs/nestjs-clean-architecture/infra-persistence/repositories/repository.ts.njk
- Create: template-packs/nestjs-clean-architecture/infra-persistence/providers/update.provider.ts.njk
- Create: template-packs/nestjs-clean-architecture/infra-persistence/providers/delete.provider.ts.njk
- Modify: packages/adapter-nestjs/src/generation/NestJsCleanArchitectureInfraPersistenceArtifactProducer.ts
- Modify: packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

**Interfaces:**
- Consumes: IUpdate<Entity>Gateway and IDelete<Entity>Gateway from Core.
- Produces: repository methods updateById and deleteById, plus mapping providers implementing the Core ports.

- [ ] Step 1: Add failing producer and repository contract assertions

Assert the Infra producer returns:

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "infra-persistence-entity-model",
      "infra-persistence-mapper",
      "infra-persistence-repository",
      "infra-persistence-create-provider",
      "infra-persistence-get-by-id-provider",
      "infra-persistence-page-provider",
      "infra-persistence-update-provider",
      "infra-persistence-delete-provider",
    ]);

- [ ] Step 2: Run the focused test and verify RED

Run:

    npm test -- packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

- [ ] Step 3: Implement repository mutation methods

Use identifier equality consistent with findById:

    public async updateById(id: string, entity: WalletEntity): Promise<WalletEntity | undefined> {
      const index = this.wallets.findIndex((current) => current.id === id);
      if (index < 0) return undefined;
      this.wallets[index] = entity;
      return entity;
    }

    public async deleteById(id: string): Promise<boolean> {
      const index = this.wallets.findIndex((current) => current.id === id);
      if (index < 0) return false;
      this.wallets.splice(index, 1);
      return true;
    }

The actual template substitutes the generated identifier type, entity type, and collection property names for this Wallet example.

- [ ] Step 4: Implement update/delete providers

The update provider maps the domain entity to persistence, calls updateById, returns undefined for a missing row, and maps a successful result back to domain. The delete provider delegates deleteById and returns its boolean result.

- [ ] Step 5: Run focused producer tests and typecheck

Run:

    npm test -- packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts
    npm run typecheck

Expected: both commands pass for the changed producers and templates.

---

### Task 6: Add HTTP request models and controller methods

**Files:**
- Create: template-packs/nestjs-clean-architecture/web-api/entrypoints/update-request.model.ts.njk
- Create: template-packs/nestjs-clean-architecture/web-api/entrypoints/patch-request.model.ts.njk
- Modify: template-packs/nestjs-clean-architecture/web-api/entrypoints/controller.ts.njk
- Modify: packages/adapter-nestjs/src/generation/NestJsCleanArchitectureWebApiArtifactProducer.ts
- Modify: packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

**Interfaces:**
- Consumes: prepared mutable properties and identifier path expressions from Task 2, Core use-case symbols from Tasks 3-4.
- Produces: Update<Entity>Request, Patch<Entity>Request, PUT, PATCH, and DELETE controller methods with existing response conventions.

- [ ] Step 1: Add failing producer assertions for web request artifacts

Assert the Web API producer adds:

    expect(templateIds).toEqual(expect.arrayContaining([
      "web-api-update-request",
      "web-api-patch-request",
    ]));

- [ ] Step 2: Run the focused producer test and verify RED

Run the NestJS artifact producer test. Expected: failure because the request templates are not registered.

- [ ] Step 3: Implement update/patch request templates

Update<Entity>Request contains every mutable property with the same required/type validators used by create. Patch<Entity>Request contains mutable properties as optional and uses the existing HTTP validation boundary. Neither DTO declares the identifier.

- [ ] Step 4: Add controller methods

Implement:

    @Put('/:id')
    public async update(...): Promise<HttpResponse<EntityResponse>>

    @Patch('/:id')
    public async patch(...): Promise<HttpResponse<EntityResponse>>

    @Delete('/:id')
    public async delete(...): Promise<HttpResponse<void>>

Construct Core commands with the normalized path identifier. For PATCH, use Object.prototype.hasOwnProperty.call(request, propertyName) to preserve omission semantics. Return 200 with the presenter for update/patch and 204 with no body for delete.

- [ ] Step 5: Add OpenAPI metadata and verify focused generation tests

Document request/response types and 200/204/404 behavior using the existing Swagger decorator style. Run the producer test and npm run typecheck.

---

### Task 7: Wire the generated composition root

**Files:**
- Modify: template-packs/nestjs-clean-architecture/bootstrap/modules/module.ts.njk
- Modify: packages/adapter-nestjs/tests/NestJsArtifactProducers.test.ts

**Interfaces:**
- Consumes: Core interfaces/providers from Tasks 3-5 and the controller from Task 6.
- Produces: one generated entity module that resolves update, patch, delete, and existing use cases without moving wiring into web-api.

- [ ] Step 1: Add failing generated-module assertions

Assert the generated module source contains provider bindings for Update<Entity>Provider, Delete<Entity>Provider, IUpdate<Entity>UseCaseSymbol, IPatch<Entity>UseCaseSymbol, and IDelete<Entity>UseCaseSymbol.

- [ ] Step 2: Run the generated module test and verify RED

Run the focused NestJS producer/golden test. Expected: missing symbols/providers in the generated module.

- [ ] Step 3: Add explicit factories and injections

Keep the existing factory style. The PATCH use-case factory injects the existing get-by-ID gateway and the shared update gateway in addition to its validator default. The DELETE use-case factory injects its delete gateway. Do not import Infra from generated web-api files.

- [ ] Step 4: Verify generated import resolution

Run the existing NestJS smoke test after the CLI build. Confirm full profile and standalone --module web-api selections continue to report zero unresolved relative imports.

---

### Task 8: Add generated-project e2e CRUD coverage and regenerate goldens

**Files:**
- Modify: template-packs/nestjs-clean-architecture/bootstrap/e2e-test.ts.njk
- Modify: tests/smoke/nestjs-generated-project.smoke.test.ts
- Modify: tests/smoke/nestjs-clean-architecture.smoke.test.ts
- Create/modify: tests/golden/nestjs-clean-architecture/** from the built CLI output only

**Interfaces:**
- Consumes: generated CRUD HTTP surface from Tasks 3-7.
- Produces: deterministic 78-file full-profile golden output for the one-entity example and generated HTTP evidence for the CRUD lifecycle.

- [ ] Step 1: Add failing e2e assertions before implementation is complete

Extend the generated e2e template and repository smoke with assertions for:

1. create a record;
2. read it by ID and through the collection;
3. replace it with PUT and assert 200 and the new representation;
4. change one field with PATCH and assert omitted fields remain unchanged;
5. reject an empty PATCH with 400;
6. delete it and assert 204 with an empty body;
7. read and delete it again and assert 404;
8. keep invalid identifiers and validation errors at 400.

- [ ] Step 2: Run the focused generated-project test and verify RED

Run:

    npm run build
    CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs

Expected: the new PUT/PATCH/DELETE assertions fail because the generated project still lacks those routes or wiring.

- [ ] Step 3: Generate fresh goldens through the CLI

After Tasks 3-7 are green, run the built CLI into a temporary output directory and copy only the generated NestJS files into tests/golden/nestjs-clean-architecture/. Update GENERATED_PATHS from 57 to 78 expected files and keep the module ownership rules unchanged.

- [ ] Step 4: Run golden and generated-project tests

Run:

    npm run smoke:nestjs
    CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs

Expected: golden byte comparisons pass and the freshly generated project installs, builds, runs its own Jest/e2e suite, and serves the CRUD lifecycle.

---

### Task 9: Add ADR and update project documentation

**Files:**
- Create: docs/adr/ADR-082-nestjs-crud-integration.md
- Modify: docs/adr/README.md
- Modify: ROADMAP.md
- Modify: docs/project/CURRENT-STATE.md
- Modify: docs/project/QUALITY-GATES.md
- Modify: docs/target-architecture/CAPABILITY-TAXONOMY.md
- Modify: README.md

**Interfaces:**
- Consumes: verified endpoint behavior and final artifact counts from Task 8.
- Produces: consistent documented status with no claim based solely on intended behavior.

- [ ] Step 1: Write ADR-082 from the verified implementation

Record the HTTP contract, full-vs-partial update semantics, physical/non-idempotent delete, path identifier normalization, composition-root decision, and explicit non-goals.

- [ ] Step 2: Update current-state and roadmap measurements

Add Phase 7 milestone 7.17 as completed only after the generated-project gate passes. Update NestJS endpoint tables, counts (full=78, core=43, infra-persistence=51, web-api=61, bootstrap=73, build=5 for the one-entity example), test inventory, and validation evidence from actual commands.

- [ ] Step 3: Update README, capability taxonomy, and quality gates

Remove update/PATCH/delete from the NestJS gap list, add CRUD to the current support matrix, and document that the generated-project gate covers the full CRUD lifecycle. Keep soft delete/restore and sorting listed as future gaps.

- [ ] Step 4: Check documentation consistency

Run:

    git diff --check

Review all changed documentation links and verify that no document claims sorting, soft delete, ORM persistence, or uniqueness support for NestJS.

---

### Task 10: Independent quality review and final verification

**Files:**
- Review: complete diff and all changed generated artifacts
- Test: repository quality gates and generated-project gate

**Interfaces:**
- Consumes: complete implementation and documentation from Tasks 1-9.
- Produces: independent quality report and verified handoff; no commit or PR is created.

- [ ] Step 1: Run repository gates

Run:

    npm run typecheck
    npm run build
    npm test
    npm run test:coverage

- [ ] Step 2: Run NestJS generation gates

Run:

    npm run smoke:nestjs
    CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs

- [ ] Step 3: Verify Java non-regression

Run the Java golden smoke:

    npm run smoke:java-multimodule

Expected: existing Java golden output remains unchanged.

- [ ] Step 4: Perform independent review

The quality_assurance role must inspect the diff, generated import resolution, Core purity, artifact counts, documentation consistency, and scope compliance. Address every rejected finding and rerun the affected gates.

- [ ] Step 5: Final evidence review

Run:

    git diff --check
    git status --short
    git diff --stat

Report the exact commands and results. Do not commit, push, merge, rebase, or create a pull request unless explicitly requested.
