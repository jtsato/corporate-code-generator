# NestJS Sorting Implementation Plan

> **For implementation:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan task-by-task with review checkpoints. Use `superpowers:test-driven-development` before implementation changes and `superpowers:verification-before-completion` before any completion claim.

**Goal:** Add deterministic, repeatable collection sorting to the NestJS clean-architecture Golden Path while preserving existing pagination, filtering, CRUD, HTTP envelopes, and Java Golden Paths.

**Architecture:** Parse the public `sort=<property>:<direction>` syntax in the generated Web API layer using a generated entity-property allowlist, convert it to technology-neutral Core `SortOrder[]`, carry it through `PageRequest` and the existing page query/gateway, then sort the filtered collection in the generated in-memory repository before slicing the page.

**Tech Stack:** TypeScript, Nunjucks templates, npm workspaces, Jest, NestJS generated-project smoke tests, Maven Java non-regression smoke tests.

**Design source:** `docs/superpowers/specs/2026-08-19-nestjs-sorting-design.md` (approved by the user on 2026-08-19).

## Global constraints

- Keep Core technology-agnostic. Core templates must not import NestJS, `class-validator`, persistence classes, or concrete HTTP/framework types.
- Keep semantic concepts in Core: `SortDirection`, `SortOrder`, and `PageRequest.sort`; HTTP spelling and field allowlists belong to Web API.
- Keep templates declarative. Templates may render prepared generated property names but must not resolve primitive types or invent sorting policy.
- Preserve the current no-sort behavior: an empty sort list must retain repository insertion order.
- Use strict syntax: exactly one property and one direction separated by one colon; only exact lowercase `asc` and `desc`; reject spaces, blank segments, unknown properties, extra segments, and other directions.
- Preserve repeated parameter order and sort precedence. Sorting must be stable, with original filtered-array order as the final tie-breaker.
- Compare `null`/`undefined` after present values, dates by epoch milliseconds, numbers numerically, booleans as `false < true`, and other values deterministically as strings.
- Apply filtering before sorting and pagination. Keep existing page/size/filter validation and error-envelope behavior.
- Do not change model schema, profile selection, Java templates, or Java generated output.
- Follow TDD: add or update a focused failing test before each behavior implementation, then run the smallest relevant test before moving on.
- Regenerate goldens with the built CLI; do not hand-edit generated golden output as the primary source of truth.
- Do not install dependencies or commit/push during implementation unless separately requested.

## Task 1: Establish the baseline and map the generation surfaces

**Files to inspect:**

- `README.md`
- `CONTRIBUTING.md`
- `ROADMAP.md`
- `docs/project/CURRENT-STATE.md`
- `docs/project/QUALITY-GATES.md`
- `docs/SOLUTION-SPECIFICATION.md`
- `docs/target-architecture/REFERENCE-ARCHITECTURE.md`
- `docs/target-architecture/CAPABILITY-TAXONOMY.md`
- `docs/adr/README.md`
- `packages/adapter-nestjs/src/generation/NestJsCleanArchitectureCoreArtifactProducer.ts`
- `packages/adapter-nestjs/src/generation/NestJsCleanArchitectureWebApiArtifactProducer.ts`
- `template-packs/nestjs-clean-architecture/core/common/paging/page-request.ts.njk`
- `template-packs/nestjs-clean-architecture/core/common/paging/page-query.ts.njk`
- `template-packs/nestjs-clean-architecture/core/common/paging/page-gateway.ts.njk`
- `template-packs/nestjs-clean-architecture/infra-persistence/repositories/repository.ts.njk`
- `template-packs/nestjs-clean-architecture/web-api/entrypoints/page-request.model.ts.njk`
- `template-packs/nestjs-clean-architecture/web-api/entrypoints/filter.parser.ts.njk`
- `template-packs/nestjs-clean-architecture/web-api/entrypoints/controller.ts.njk`

**Steps:**

1. Confirm `main` is clean and the current 7.17 commits are present.
2. Run the existing baseline gates before editing:

   ```text
   npm run typecheck
   npm run build
   npm test
   npm run smoke:nestjs
   npm run smoke:java-multimodule
   npm run smoke:maven:java-multimodule
   ```

3. Record the current generated artifact counts and smoke output so the final report can distinguish sorting changes from regressions.
4. Verify that the current page request, controller, parser, repository, and artifact producers match the approved design before proceeding.

**Exit criteria:** Baseline passes, the exact current file surfaces are known, and no unrelated worktree changes are overwritten.

## Task 2: Add Core sorting semantics with tests first

**Files:**

- Create `template-packs/nestjs-clean-architecture/core/common/paging/sort-direction.ts.njk`.
- Create `template-packs/nestjs-clean-architecture/core/common/paging/sort-order.ts.njk`.
- Create `template-packs/nestjs-clean-architecture/core/common/paging/sort-order.spec.ts.njk`.
- Modify `template-packs/nestjs-clean-architecture/core/common/paging/page-request.ts.njk`.
- Create or modify `template-packs/nestjs-clean-architecture/core/common/paging/page-request.spec.ts.njk`.
- Modify `packages/adapter-nestjs/src/generation/NestJsCleanArchitectureCoreArtifactProducer.ts`.
- Modify the corresponding adapter producer tests and generated artifact expectations.

**Steps:**

1. Add failing generated Core tests for:

   - `SortDirection.Asc` and `SortDirection.Desc` values.
   - `SortOrder` construction with a nonblank property and either supported direction.
   - rejection of blank properties and unsupported direction values.
   - `PageRequest` defaulting to page `0`, size `20`, and an empty sort list.
   - `PageRequest` accepting multiple sort orders and defensively copying the caller array.
   - invalid page/size behavior remaining unchanged.

2. Implement `SortDirection` as a technology-neutral string enum or equivalent Core value with exactly `asc` and `desc` values, matching the repository's existing generated TypeScript style.
3. Implement immutable `SortOrder` with a nonblank property and a `SortDirection`, exposing only the semantic values needed by the repository and parser.
4. Extend `PageRequest` with an optional `sort` constructor argument and a readonly defensive copy. Preserve its current public defaults and validation.
5. Register the application-scoped Core artifacts and tests in the producer. Use stable artifact IDs and ensure the generated imports are relative and framework-free.
6. Run the focused adapter/golden test and inspect generated Core imports. Confirm no NestJS, validator, persistence, filesystem, or CLI dependency is introduced.

**Exit criteria:** Core tests pass; generated Core represents sorting semantics without HTTP syntax; `PageRequest` cannot be mutated through the caller's original array; existing page request behavior remains green.

## Task 3: Add strict per-entity Web API parsing and DTO metadata

**Files:**

- Create `template-packs/nestjs-clean-architecture/web-api/entrypoints/sort.parser.ts.njk`.
- Create `template-packs/nestjs-clean-architecture/web-api/entrypoints/sort.parser.spec.ts.njk`.
- Modify `template-packs/nestjs-clean-architecture/web-api/entrypoints/page-request.model.ts.njk`.
- Modify `packages/adapter-nestjs/src/generation/NestJsCleanArchitectureWebApiArtifactProducer.ts`.
- Modify the corresponding adapter producer tests and generated artifact expectations.

**Steps:**

1. Add failing generated parser tests for each entity:

   - missing `sort` returns `[]`;
   - one valid `property:asc` and `property:desc` produces one `SortOrder`;
   - repeated values preserve input order and precedence;
   - unknown property, unknown direction, blank property, blank direction, missing colon, extra colon, and whitespace each throw the existing `ValidationException` contract;
   - a non-string/non-array input is rejected consistently with the existing filter parser;
   - arrays containing one invalid element fail the complete parse rather than partially succeeding.

2. Implement a generated per-entity `SortParser` that accepts `undefined`, a string, or a string array, validates exactly two colon-separated segments, checks the generated TypeScript property allowlist, maps exact lowercase directions to Core `SortDirection`, and returns `SortOrder[]` in request order.
3. Add an optional repeatable `sort` property to the generated page request DTO. Use existing validation conventions and `ApiPropertyOptional` metadata with a representative example such as `balance:desc`; do not make OpenAPI metadata the source of parser behavior.
4. Register the parser and parser test as per-entity Web API artifacts. Keep the parser dependent only on generated Core paging types and the existing validation exception abstraction.
5. Run focused parser tests and inspect the generated OpenAPI document for a repeatable query parameter without changing unrelated query metadata.

**Exit criteria:** All strict parser cases pass, the DTO exposes the documented repeatable query input, and invalid input maps to the existing structured 400 path.

## Task 4: Propagate parsed sorting through the controller and HTTP contract

**Files:**

- Modify `template-packs/nestjs-clean-architecture/web-api/entrypoints/controller.ts.njk`.
- Modify generated NestJS e2e/smoke fixtures that exercise collection endpoints.
- Modify controller/generation tests if the repository has direct template assertions for constructor arguments or imports.

**Steps:**

1. Add failing generated-project assertions for:

   - ascending and descending collection results;
   - repeated sort parameters;
   - sort combined with existing filter, page, and size parameters;
   - malformed and unknown sort values returning the existing 400 envelope.

2. Import the generated entity `SortParser` in the controller and pass `SortParser.parse(request.sort)` as the third `PageRequest` argument.
3. Preserve the current defaults (`page ?? 0`, `size ?? 20`) and existing filter parsing order/error handling.
4. Run the generated NestJS endpoint test before repository sorting is implemented to verify that failures are specifically about order, not query wiring or validation.

**Exit criteria:** The HTTP layer produces the expected Core `PageRequest.sort`; invalid requests fail through the existing validation exception handler; no endpoint contract unrelated to sorting changes.

## Task 5: Implement stable in-memory repository sorting

**Files:**

- Modify `template-packs/nestjs-clean-architecture/infra-persistence/repositories/repository.ts.njk`.
- Modify generated repository tests or NestJS smoke fixtures covering persistence ordering.

**Steps:**

1. Add failing repository/generated-project tests for:

   - one-field ascending and descending sorting;
   - filtering before sorting and pagination after sorting;
   - repeated sort precedence, including equal primary keys resolved by the next key;
   - stable insertion order when all requested keys tie;
   - no sort preserving insertion order;
   - deterministic comparisons for numeric, boolean, date, string, null, and undefined values as applicable to generated entity properties.

2. In the repository, retain the existing filter result, then sort a copy only when `pageRequest.sort` is nonempty, and only then calculate the page slice.
3. Implement a local comparison helper with the approved policy: nullish values last, Date epoch comparison, numeric comparison, boolean ordering, and deterministic string comparison for remaining values. Return the first nonzero order result in request order.
4. Add the original filtered-array index as the final comparison key so equal records remain stable across runtimes and repeated generation.
5. Keep no-sort execution behavior and result object/envelope unchanged. Avoid introducing a framework or ORM dependency into the repository template.
6. Run focused repository and generated HTTP tests, then inspect the generated source for deterministic imports and formatting.

**Exit criteria:** The generated endpoint returns sorted pages correctly, filters before sorting, paginates after sorting, preserves insertion order without sorting, and has deterministic tie behavior.

## Task 6: Regenerate goldens and prove deterministic output

**Files:**

- Generated NestJS golden output under the repository's configured golden fixture directory.
- `packages/adapter-nestjs` golden tests and expected artifact path lists, including `GENERATED_PATHS` or equivalent inventory constants.
- Any generated-project fixture model only if an existing fixture cannot exercise multiple sortable properties.

**Steps:**

1. Build the CLI before generation:

   ```text
   npm run build
   ```

2. Generate the existing NestJS wallet-service golden fixture into the configured output directory using the CLI, then inspect the diff for only the approved sorting artifacts and expected test/OpenAPI changes.
3. Update artifact inventories from actual CLI output, not by hand-counting expected files.
4. Generate the same fixture twice into separate temporary directories and compare normalized file lists and file contents byte-for-byte.
5. Run golden tests and the focused generated-project tests. If a generated test fails, fix the source template/producer and regenerate rather than editing generated output directly.

**Exit criteria:** Golden output is reproducible, artifact inventories match the CLI, and no Java golden file changes occur.

## Task 7: Document the milestone and its support boundary

**Files:**

- Create `docs/adr/ADR-083-nestjs-sorting.md` (use the next repository ADR number after the existing 7.17 ADR).
- Modify `docs/adr/README.md`.
- Modify `ROADMAP.md` to mark 7.18 Sorting complete only after all gates pass.
- Modify `docs/project/CURRENT-STATE.md` with measured artifact/test/smoke evidence.
- Modify `docs/project/QUALITY-GATES.md` if the new generated-project sort assertions add a required gate or command.
- Modify `docs/target-architecture/CAPABILITY-TAXONOMY.md` to move NestJS sorting from planned/gap to supported, with explicit non-goals.
- Modify `README.md` only where the user-facing capability summary or command inventory would otherwise become stale.

**Steps:**

1. Write ADR-083 with context, decision, strict query grammar, Core/Web API/persistence ownership, stability and nullish comparison policy, alternatives rejected, and consequences.
2. Update the ADR index and milestone status consistently; do not claim native validation before it has actually passed.
3. Record measured evidence only after the final commands run: generated artifact count, deterministic-generation result, repository test totals/coverage if applicable, NestJS golden and native gates, and Java non-regression status.
4. Document that sorting is in-memory for the current NestJS profile and does not imply database/ORM sorting, nested fields, computed fields, configurable null ordering, case-insensitive ordering, or Java changes.

**Exit criteria:** Documentation, roadmap status, capability taxonomy, and implementation agree; all reported measurements are command-backed.

## Task 8: Independent review and final verification

**Required roles:**

- `tech_lead`: review architecture, ownership boundaries, deterministic semantics, scope, and documentation; reject any Core/framework coupling or undocumented behavior.
- `developer_a`: drive implementation task-by-task, write tests before implementation, regenerate goldens, and report changed files and focused test evidence.
- `quality_assurance`: independently validate generated artifacts, invalid HTTP inputs, deterministic output, import resolution, and regressions; do not rely only on the implementation driver's test run.

**Verification sequence:**

1. Review the complete diff and run `git diff --check`.
2. Run repository gates:

   ```text
   npm run typecheck
   npm run build
   npm test
   npm run test:coverage
   ```

3. Run NestJS gates, including the required native-project gate with npm smoke enabled:

   ```text
   npm run smoke:nestjs
   $env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs
   ```

4. Run Java non-regression gates:

   ```text
   npm run smoke:java-multimodule
   npm run smoke:maven:java-multimodule
   ```

5. Have `tech_lead` review the consolidated diff, have `quality_assurance` rerun the independent validation, and address every rejected finding before completion.
6. Confirm `git status --short --branch`, current branch, and changed-file scope. Do not commit or push unless the user explicitly requests it in a later instruction.

**Final acceptance:** All approved acceptance criteria from the design spec pass; all required roles have reported; the working tree contains only the intended 7.18 implementation, tests, generated goldens, and documentation.
