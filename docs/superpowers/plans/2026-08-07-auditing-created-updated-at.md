# Auditing (createdAt/updatedAt) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in per-entity `audited: boolean` model flag that, when `true`, makes the `java-spring-clean-multimodule` profile generate `createdAt`/`updatedAt` (`LocalDateTime`) timestamps through the Core model, JPA entity, persistence mapper, gateway provider, REST responses, and Spring configuration wiring — with zero effect on entities/profiles that don't opt in.

**Architecture:** Approved in `docs/superpowers/specs/2026-08-07-auditing-created-updated-at-design.md`. `Create*UseCaseInteractor` sets both timestamps from an injected `GetLocalDateTime` clock port (Core-only, JDK `Clock`-backed). `Update*`/`Patch*UseCaseInteractor` set `updatedAt` from the clock and pass `createdAt = null` — the infra `*GatewayProvider.update()` method preserves the real `createdAt` by copying it from the already-fetched existing row onto the freshly mapped entity before saving, via one new `setCreatedAt` setter (not a general setter-per-field rewrite). REST responses expose both fields read-only.

**Tech Stack:** TypeScript generator (`packages/adapter-java`), Nunjucks (`.njk`) templates under `template-packs/java-spring-clean-multimodule/`, generated Java 25 / Spring Boot / JPA / Querydsl output, Vitest for generator tests, Maven for generated-code validation.

## Global Constraints

- Profile scope: `java-spring-clean-multimodule` only. `java-spring-clean` (single-module) must be byte-for-byte unaffected — verify via `npm run smoke:java-multimodule` after every template-touching task, since that golden comparison covers the currently-unaudited `examples/wallet-service`.
- `examples/wallet-service/model.yaml` and its golden files under `tests/golden/java-spring-clean-multimodule/` are **not modified** by this plan — `audited` stays unset there, so the existing golden byte-comparison keeps proving non-regression (per milestone 6.34's precedent).
- No `createdBy`/`updatedBy`, no filtering/sorting on audit fields, no new DB indexes — out of scope per the design doc.
- `createdAt`/`updatedAt` on the Core `Wallet`-equivalent model must **not** carry `@NotNull`/`validationAnnotation` — `Wallet` extends `SelfValidating<Wallet>` and validates on every construction, including the internal command-construction inside `Update`/`Patch` interactors, which must be able to pass `createdAt = null` before persistence.
- Every template edit must be verified against `npm run smoke:java-multimodule` (byte-for-byte golden comparison) with `audited` absent, to prove zero regression, before being considered done.
- Run `npm run typecheck && npm run build` after every TypeScript-touching task.

---

### Task 1: Commit the already-drafted `audited` model flag

The schema/parser change (`Entity.audited?: boolean`, default `false`) already exists uncommitted in the working tree. This task verifies it and commits it as the foundation the rest of the plan builds on.

**Files:**
- Modify (already changed, uncommitted): `packages/core/schemas/1.0/model.schema.json`, `packages/core/schemas/schemas/1.0/model.schema.json`, `packages/core/src/model/Entity.ts`, `packages/core/src/model/document/ApplicationModelDocument.ts`, `packages/core/src/parser/ModelParser.ts`, `packages/core/tests/ModelParser.test.ts`

**Interfaces:**
- Produces: `Entity.audited?: boolean` (defaults to `false` after parsing, per `ModelParser.ts`: `audited: document.audited ?? false`). Every later task reads `entity.audited === true` to decide whether to emit audit-related output.

- [ ] **Step 1: Confirm the existing diff matches expectations**

Run: `git diff -- packages/core/src/model/Entity.ts packages/core/src/model/document/ApplicationModelDocument.ts packages/core/src/parser/ModelParser.ts`
Expected: `Entity.ts` and `ApplicationModelDocument.ts` each add `readonly audited?: boolean;`; `ModelParser.ts` adds `audited: document.audited ?? false,` inside the entity-mapping block.

- [ ] **Step 2: Run the existing test suite for this slice**

Run: `npm test -- packages/core/tests/ModelParser.test.ts`
Expected: PASS, including the two new tests `"should default audited to false when omitted"` and `"should parse an explicit audited flag"`.

- [ ] **Step 3: Run typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both succeed with exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/core/schemas/1.0/model.schema.json packages/core/schemas/schemas/1.0/model.schema.json packages/core/src/model/Entity.ts packages/core/src/model/document/ApplicationModelDocument.ts packages/core/src/parser/ModelParser.ts packages/core/tests/ModelParser.test.ts
git commit -m "feat(core): add opt-in audited flag to the entity model"
```

---

### Task 2: Core `GetLocalDateTime` clock port and implementation

Add the two new, profile-wide (not per-entity), Core-only files that back the auditing feature's clock abstraction, generated only when at least one entity in the application is `audited`.

**Files:**
- Create: `template-packs/java-spring-clean-multimodule/core/common/get-local-date-time.java.njk`
- Create: `template-packs/java-spring-clean-multimodule/core/common/get-local-date-time-impl.java.njk`
- Modify: `template-packs/java-spring-clean-multimodule/manifest.yaml` (near the `core-self-validating` entry, line 221)
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts` (trailing static-artifact list, lines 1295-1307)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Produces: generated `core/common/time/GetLocalDateTime.java` (interface, one method `LocalDateTime now()`) and `core/common/time/GetLocalDateTimeImpl.java` (implementation using `Clock.systemDefaultZone()`), emitted only when `request.application.entities.some((entity) => entity.audited === true)`.

- [ ] **Step 1: Write the failing producer test**

Add to `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`:

```ts
it("emits the GetLocalDateTime port and implementation only when an entity is audited", () => {
  const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();

  const withoutAudited = producer.produce(buildRequest({ audited: false }));
  expect(withoutAudited.some((artifact) => artifact.templateId === "core-get-local-date-time")).toBe(false);
  expect(withoutAudited.some((artifact) => artifact.templateId === "core-get-local-date-time-impl")).toBe(false);

  const withAudited = producer.produce(buildRequest({ audited: true }));
  const port = withAudited.find((artifact) => artifact.templateId === "core-get-local-date-time");
  const impl = withAudited.find((artifact) => artifact.templateId === "core-get-local-date-time-impl");
  expect(port?.model).toMatchObject({ packageName: "io.github.jtsato.walletservice.core.common.time" });
  expect(port?.outputVariables).toMatchObject({ className: "GetLocalDateTime" });
  expect(impl?.model).toMatchObject({ packageName: "io.github.jtsato.walletservice.core.common.time" });
  expect(impl?.outputVariables).toMatchObject({ className: "GetLocalDateTimeImpl" });
});
```

Use this file's existing `buildRequest`-style helper (adapt to however the file already constructs a `GenerationRequest` fixture — extend it to accept an `audited` flag on the `Wallet` entity's attributes, matching the existing fixture-building pattern in that test file).

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts -t "GetLocalDateTime"`
Expected: FAIL — `templateId === "core-get-local-date-time"` not found.

- [ ] **Step 3: Add the manifest entries**

In `template-packs/java-spring-clean-multimodule/manifest.yaml`, immediately after the `core-self-validating` entry (line 221-224):

```yaml
  - id: core-get-local-date-time
    module: core
    template: core/common/get-local-date-time.java.njk
    output: core/src/main/java/{{ packagePath }}/core/common/time/{{ className }}.java
  - id: core-get-local-date-time-impl
    module: core
    template: core/common/get-local-date-time-impl.java.njk
    output: core/src/main/java/{{ packagePath }}/core/common/time/{{ className }}.java
```

- [ ] **Step 4: Write the two templates**

`template-packs/java-spring-clean-multimodule/core/common/get-local-date-time.java.njk`:

```njk
package {{ packageName }};

import java.time.LocalDateTime;

public interface GetLocalDateTime {
    LocalDateTime now();
}
```

`template-packs/java-spring-clean-multimodule/core/common/get-local-date-time-impl.java.njk`:

```njk
package {{ packageName }};

import java.time.Clock;
import java.time.LocalDateTime;

public class GetLocalDateTimeImpl implements GetLocalDateTime {
    @Override
    public LocalDateTime now() {
        return LocalDateTime.now(Clock.systemDefaultZone());
    }
}
```

- [ ] **Step 5: Wire the conditional emission into the producer**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`, immediately before the final `return [...entityArtifacts, ...]` (around line 1294), add:

```ts
const anyEntityAudited = request.application.entities.some((entity) => entity.audited === true);
const timePackageName = `${namespace}.core.common.time`;
```

Then change the return statement (line 1295-1307) to splice in the two new artifacts conditionally, right after the `core-self-validating` entry:

```ts
    return [...entityArtifacts,
      { templateId: "core-application-exception", model: { packageName, className: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ApplicationException" } },
      { templateId: "core-field-violation", model: { packageName, className: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "FieldViolation" } },
      { templateId: "core-validation-exception", model: { packageName, className: "ValidationException", parentClassName: "ApplicationException", fieldViolationClassName: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ValidationException" } },
      { templateId: "core-not-found-exception", model: { packageName, className: "NotFoundException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "NotFoundException" } },
      { templateId: "core-conflict-exception", model: { packageName, className: "ConflictException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ConflictException" } },
      { templateId: "core-self-validating", model: { packageName: `${namespace}.core.common.validation`, exceptionPackage: packageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "SelfValidating" } },
      ...(anyEntityAudited ? [
        { templateId: "core-get-local-date-time", model: { packageName: timePackageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "GetLocalDateTime" } },
        { templateId: "core-get-local-date-time-impl", model: { packageName: timePackageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "GetLocalDateTimeImpl" } },
      ] : []),
      ...["SortDirection", "SortOrder", "PageRequest", "PageResult"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...request.application.entities.filter((entity) => entity.attributes.some((attribute) => attribute.required)).map((entity) => { const domainName = toJavaPackageSegment(entity.name); return { templateId: "core-domain-validation-test", model: { packageName: `${namespace}.core.domains.${domainName}.model`, exceptionPackage: packageName, className: `${entity.name}ValidationTests`, entityType: entity.name, nullArguments: entity.attributes, requiredFieldNames: entity.attributes.filter((attribute) => attribute.required).map((attribute) => attribute.name).sort((left, right) => left.localeCompare(right)) }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entity.name}ValidationTests` } }; }),
      ...["SortOrder", "PageRequest", "PageResult"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
      ...["FilterOperator", "FilterCondition", "FilterGroupOperator", "FilterGroup", "FilterExpression"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: filterPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...["FilterCondition", "FilterGroup", "FilterExpression"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: filterPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
    ];
```

(Only the `core-self-validating` line and the new spliced-in block are new; every other line is unchanged from today — copy it verbatim to avoid disturbing unrelated output.)

- [ ] **Step 6: Run the test to confirm it passes**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts -t "GetLocalDateTime"`
Expected: PASS.

- [ ] **Step 7: Confirm zero regression on the non-audited golden path**

Run: `npm run smoke:java-multimodule`
Expected: PASS with no diff (since `examples/wallet-service` has no audited entities, `anyEntityAudited` is `false`, and the spliced block contributes nothing).

- [ ] **Step 8: Run typecheck and full unit suite**

Run: `npm run typecheck && npm test`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add template-packs/java-spring-clean-multimodule/manifest.yaml template-packs/java-spring-clean-multimodule/core/common/get-local-date-time.java.njk template-packs/java-spring-clean-multimodule/core/common/get-local-date-time-impl.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "feat(java-multimodule): generate GetLocalDateTime clock port when any entity is audited"
```

---

### Task 3: Core domain model gains `createdAt`/`updatedAt` (Wallet + Tombstone)

Extend the shared `createJavaEntityTemplateModel` transformer with an optional, purely additive `extraFields` parameter, and use it (plus a matching inline change to the hand-built tombstone model) so that when `entity.audited`, the Core `Wallet` and `WalletTombstone` classes gain `createdAt`/`updatedAt` fields — **without** `@NotNull`, per the Global Constraints.

**Files:**
- Modify: `packages/adapter-java/src/transformers/createJavaEntityTemplateModel.ts`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts` (Wallet model call site ~line 744-749, tombstone construction ~line 720-735)
- Test: `packages/adapter-java/tests/createJavaEntityTemplateModel.test.ts` (create if it doesn't already exist as a dedicated file — check first with `Glob "packages/adapter-java/tests/createJavaEntityTemplateModel*"`; if a transformer test file already exists, add to it instead)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Consumes: nothing new from earlier tasks.
- Produces: `createJavaEntityTemplateModel(entity, packageName, typeResolver?, selfValidationEnabled?, extraFields?)` — new 5th parameter `extraFields: readonly { readonly name: string; readonly type: string; readonly import: string }[]` (default `[]`). Later tasks do not depend on this signature directly (Create/Update/Patch interactors build their own field lists), but Task 6 (persistence mapper) and Task 7 (persistence entity) rely on the Core `Wallet` having `getCreatedAt()`/`getUpdatedAt()` getters with exactly those names.

- [ ] **Step 1: Write the failing transformer test**

```ts
import { describe, expect, it } from "vitest";
import { createJavaEntityTemplateModel } from "../src/transformers/createJavaEntityTemplateModel.js";
import type { Entity } from "@corporate-code-generator/core";

describe("createJavaEntityTemplateModel", () => {
  it("appends extra fields without a validation annotation", () => {
    const entity: Entity = {
      name: "Wallet",
      attributes: [{ name: "balance", type: "decimal", required: true, identifier: false }],
    };

    const model = createJavaEntityTemplateModel(entity, "io.github.jtsato.walletservice.core.domains.wallet.model", undefined, true, [
      { name: "createdAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
      { name: "updatedAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
    ]);

    expect(model.fields).toEqual([
      { name: "balance", type: "BigDecimal", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
      { name: "createdAt", type: "LocalDateTime", modifiers: ["private", "final"] },
      { name: "updatedAt", type: "LocalDateTime", modifiers: ["private", "final"] },
    ]);
    expect(model.constructorParameters).toEqual([
      { name: "balance", type: "BigDecimal" },
      { name: "createdAt", type: "LocalDateTime" },
      { name: "updatedAt", type: "LocalDateTime" },
    ]);
    expect(model.getters).toEqual([
      { name: "getBalance", returnType: "BigDecimal", fieldName: "balance" },
      { name: "getCreatedAt", returnType: "LocalDateTime", fieldName: "createdAt" },
      { name: "getUpdatedAt", returnType: "LocalDateTime", fieldName: "updatedAt" },
    ]);
    expect(model.imports).toContain("java.time.LocalDateTime");
  });

  it("defaults extraFields to empty and stays identical to today's behavior", () => {
    const entity: Entity = {
      name: "Wallet",
      attributes: [{ name: "balance", type: "decimal", required: true, identifier: false }],
    };

    const model = createJavaEntityTemplateModel(entity, "io.github.jtsato.walletservice.core.domains.wallet.model", undefined, true);

    expect(model.fields).toEqual([
      { name: "balance", type: "BigDecimal", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
    ]);
  });
});
```

Adjust the exact `Entity` fixture shape (required fields like `identifier`) to match the real `Entity`/`Attribute` types in `packages/core/src/model/Entity.ts` — check that file if the fixture above doesn't typecheck.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- packages/adapter-java/tests/createJavaEntityTemplateModel.test.ts`
Expected: FAIL — TypeScript error or `extraFields` ignored (5-argument call doesn't compile yet).

- [ ] **Step 3: Extend the transformer**

Rewrite `packages/adapter-java/src/transformers/createJavaEntityTemplateModel.ts`:

```ts
import type { Entity } from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";
import type { JavaFieldModel } from "../model/JavaFieldModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export interface JavaSyntheticFieldModel {
  readonly name: string;
  readonly type: string;
  readonly import: string;
}

export function createJavaEntityTemplateModel(
  entity: Entity,
  packageName: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  selfValidationEnabled = false,
  extraFields: readonly JavaSyntheticFieldModel[] = [],
): JavaEntityTemplateModel {
  const imports = new JavaImportCollector();
  const validationEnabled = selfValidationEnabled && entity.attributes.some((attribute) => attribute.required);
  if (validationEnabled) {
    imports.add("jakarta.validation.constraints.NotNull");
    imports.add(packageName.replace(/\.domains?(?:\..*)?$/, ".common.validation.SelfValidating"));
  }
  const attributeFields: JavaFieldModel[] = entity.attributes.map((attribute) => {
    const javaType = typeResolver.resolve(attribute.type);
    imports.add(javaType.import);
    return attribute.required ? { name: attribute.name, type: javaType.name, modifiers: ["private", "final"], validationAnnotation: "@NotNull" } : { name: attribute.name, type: javaType.name, modifiers: ["private", "final"] };
  });
  const syntheticFields: JavaFieldModel[] = extraFields.map((field) => {
    imports.add(field.import);
    return { name: field.name, type: field.type, modifiers: ["private", "final"] };
  });
  const fields = [...attributeFields, ...syntheticFields];
  const constructorParameters = fields.map((field) => ({ name: field.name, type: field.type }));
  const getters = fields.map((field) => ({
    name: `get${field.name[0]?.toUpperCase() ?? ""}${field.name.slice(1)}`,
    returnType: field.type,
    fieldName: field.name,
  }));

  return {
    packageName,
    imports: imports.values(),
    className: entity.name,
    modifiers: ["public"],
    fields,
    constructorParameters,
    getters,
    ...(validationEnabled ? { extendsType: `SelfValidating<${entity.name}>`, validateSelf: true } : {}),
  };
}
```

- [ ] **Step 4: Run the transformer test to confirm it passes**

Run: `npm test -- packages/adapter-java/tests/createJavaEntityTemplateModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `extraFields` into the Wallet call site**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`, replace lines 742-751:

```ts
        {
          templateId: "core-domain-entity",
          model: createJavaEntityTemplateModel(
            entity,
            `${domainPackage}.model`,
            undefined,
            true,
            entity.audited === true
              ? [
                  { name: "createdAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
                  { name: "updatedAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
                ]
              : [],
          ),
          outputVariables: { ...outputVariables, className: entityType },
        },
```

- [ ] **Step 6: Wire audited fields into the tombstone model**

In the same file, replace the tombstone-building block (lines 720-735):

```ts
      const tombstoneImports = new JavaImportCollector();
      const tombstoneFields = entity.attributes.map((attribute) => {
        const type = this.typeResolver.resolve(attribute.type);
        tombstoneImports.add(type.import);
        return { name: attribute.name, type: type.name, modifiers: ["private", "final"] };
      });
      tombstoneImports.add("java.time.Instant");
      const auditedTombstoneFields = entity.audited === true
        ? [
            { name: "createdAt", type: "LocalDateTime", modifiers: ["private", "final"] },
            { name: "updatedAt", type: "LocalDateTime", modifiers: ["private", "final"] },
          ]
        : [];
      if (entity.audited === true) tombstoneImports.add("java.time.LocalDateTime");
      const tombstoneModel: JavaEntityTemplateModel = {
        packageName: `${domainPackage}.model`,
        imports: tombstoneImports.values(),
        className: `${entityType}Tombstone`,
        modifiers: ["public"],
        fields: [...tombstoneFields, ...auditedTombstoneFields, { name: "deletedAt", type: "Instant", modifiers: ["private", "final"] }],
        constructorParameters: [...tombstoneFields.map(({ name, type }) => ({ name, type })), ...auditedTombstoneFields.map(({ name, type }) => ({ name, type })), { name: "deletedAt", type: "Instant" }],
        getters: [...tombstoneFields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })), ...auditedTombstoneFields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })), { name: "getDeletedAt", returnType: "Instant", fieldName: "deletedAt" }],
      };
```

- [ ] **Step 7: Add producer-level assertions**

Add to `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`:

```ts
it("adds createdAt/updatedAt to the Wallet model and tombstone only when audited", () => {
  const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();
  const artifacts = producer.produce(buildRequest({ audited: true }));

  const domainEntity = artifacts.find((artifact) => artifact.templateId === "core-domain-entity");
  expect(domainEntity?.model).toMatchObject({
    fields: expect.arrayContaining([
      expect.objectContaining({ name: "createdAt", type: "LocalDateTime" }),
      expect.objectContaining({ name: "updatedAt", type: "LocalDateTime" }),
    ]),
  });
  expect((domainEntity?.model as { fields: { validationAnnotation?: string }[] }).fields.find((field) => field.name === "createdAt")?.validationAnnotation).toBeUndefined();

  const tombstone = artifacts.find((artifact) => artifact.templateId === "core-domain-tombstone");
  expect(tombstone?.model).toMatchObject({
    fields: expect.arrayContaining([
      expect.objectContaining({ name: "createdAt" }),
      expect.objectContaining({ name: "updatedAt" }),
      expect.objectContaining({ name: "deletedAt" }),
    ]),
  });
});
```

- [ ] **Step 8: Run the tests, typecheck, and golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`
Expected: PASS.

Run: `npm run typecheck && npm run smoke:java-multimodule`
Expected: both succeed; smoke shows no golden diff (non-audited `wallet-service` output is untouched — `extraFields` defaults to `[]`, `auditedTombstoneFields` is `[]`).

- [ ] **Step 9: Commit**

```bash
git add packages/adapter-java/src/transformers/createJavaEntityTemplateModel.ts packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/createJavaEntityTemplateModel.test.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "feat(java-multimodule): add createdAt/updatedAt to the audited Core domain model and tombstone"
```

---

### Task 4: Create interactor sets both timestamps from the injected clock

**Files:**
- Modify: `packages/adapter-java/src/model/JavaCreateUseCaseInteractorTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/core/usecase/create/interactor.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts` (create interactor model, ~lines 218-224 imports, ~lines 375-389 model)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Consumes: Core `Wallet` constructor now accepts `(...attributeArgs, createdAt, updatedAt)` when audited (Task 3).
- Produces: `JavaCreateUseCaseInteractorTemplateModel` gains optional `secondaryDependencyType?: string`, `secondaryDependencyFieldName?: string`, `preStatements?: readonly string[]`. Task 5 and Task 6 reuse the identical three fields on their own model interfaces (copy this shape, do not invent a different one).

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaCreateUseCaseInteractorTemplateModel.ts`:

```ts
export interface JavaCreateUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly entityType: string;
  readonly entityConstructorArguments: readonly string[];
  readonly executeMethodName: string;
  readonly gatewayCreateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
  readonly secondaryDependencyType?: string;
  readonly secondaryDependencyFieldName?: string;
  readonly preStatements?: readonly string[];
}
```

- [ ] **Step 2: Update the template**

Replace `template-packs/java-spring-clean-multimodule/core/usecase/create/interactor.java.njk` in full:

```njk
package {{ packageName }};

{% for import in imports %}import {{ import }};
{% endfor %}
public final class {{ className }} implements {{ interfaceName }} {
    private final {{ gatewayType }} {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
    private final {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }};
{%- endif %}

    public {{ className }}({{ gatewayType }} {{ gatewayFieldName }}{% if secondaryDependencyType %}, {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }}{% endif %}) {
        this.{{ gatewayFieldName }} = {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
        this.{{ secondaryDependencyFieldName }} = {{ secondaryDependencyFieldName }};
{%- endif %}
    }

    @Override
    public {{ entityType }} {{ executeMethodName }}({{ commandType }} command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "{{ commandRequiredMessageKey }}",
                "{{ commandRequiredDefaultMessage }}"
            )));
        }
{%- for statement in preStatements %}
        {{ statement }}
{%- endfor %}

        {{ entityType }} entity = new {{ entityType }}(
{% for argument in entityConstructorArguments %}            {{ argument }}{% if not loop.last %},{% endif %}
{% endfor %}        );

        return {{ gatewayFieldName }}.{{ gatewayCreateMethodName }}(entity);
    }
}
```

- [ ] **Step 3: Wire the producer**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`, add right after the existing `createInteractorImports` block (after line 224):

```ts
      if (entity.audited === true) {
        createInteractorImports.add("java.time.LocalDateTime");
        createInteractorImports.add(`${namespace}.core.common.time.GetLocalDateTime`);
      }
```

Then replace the `createInteractorModel` construction (lines 375-389):

```ts
      const createInteractorModel: JavaCreateUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.create`,
        imports: createInteractorImports.values(),
        className: createInteractorType,
        interfaceName: createUseCaseType,
        commandType: createCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        entityConstructorArguments: entity.audited === true
          ? [...entity.attributes.map((attribute) => `command.${attribute.name}()`), "createdAt", "updatedAt"]
          : entity.attributes.map((attribute) => `command.${attribute.name}()`),
        executeMethodName: "execute",
        gatewayCreateMethodName: "create",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
        ...(entity.audited === true ? {
          secondaryDependencyType: "GetLocalDateTime",
          secondaryDependencyFieldName: "getLocalDateTime",
          preStatements: [
            "final LocalDateTime createdAt = getLocalDateTime.now();",
            "final LocalDateTime updatedAt = getLocalDateTime.now();",
          ],
        } : {}),
      };
```

- [ ] **Step 4: Write the producer test**

Add to `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`:

```ts
it("threads GetLocalDateTime into the create interactor only when audited", () => {
  const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();

  const notAudited = producer.produce(buildRequest({ audited: false }));
  const plainCreate = notAudited.find((artifact) => artifact.templateId === "core-create-use-case-interactor");
  expect(plainCreate?.model).toMatchObject({ secondaryDependencyType: undefined });

  const audited = producer.produce(buildRequest({ audited: true }));
  const auditedCreate = audited.find((artifact) => artifact.templateId === "core-create-use-case-interactor");
  expect(auditedCreate?.model).toMatchObject({
    secondaryDependencyType: "GetLocalDateTime",
    secondaryDependencyFieldName: "getLocalDateTime",
    preStatements: [
      "final LocalDateTime createdAt = getLocalDateTime.now();",
      "final LocalDateTime updatedAt = getLocalDateTime.now();",
    ],
    entityConstructorArguments: expect.arrayContaining(["createdAt", "updatedAt"]),
  });
});
```

(Confirm the exact `templateId` string used for the create interactor by grepping the producer file for `"core-create-use-case-interactor"` — use whatever string is already there; do not guess a new one.)

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`
Expected: PASS.

Run: `npm run typecheck && npm run smoke:java-multimodule`
Expected: both succeed; **this is the critical whitespace-regression check** — if the golden diff shows unexpected blank-line changes in `CreateWalletUseCaseInteractor.java`, adjust the `{%- -%}` trim markers in the template from Step 2 until the diff is empty, then re-run.

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaCreateUseCaseInteractorTemplateModel.ts template-packs/java-spring-clean-multimodule/core/usecase/create/interactor.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "feat(java-multimodule): set createdAt/updatedAt from GetLocalDateTime on create"
```

---

### Task 5: Update interactor sets `updatedAt`, passes `createdAt = null`

Same shape as Task 4, applied to the update interactor. Only `updatedAt` comes from the clock; `createdAt` is passed as the literal `null` so the infra layer (Task 9) can preserve the real value.

**Files:**
- Modify: `packages/adapter-java/src/model/JavaUpdateUseCaseInteractorTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/core/usecase/update/interactor.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts` (update interactor imports ~line 248-254, model ~lines 432-446)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Consumes: same `secondaryDependencyType`/`secondaryDependencyFieldName`/`preStatements` shape introduced in Task 4.
- Produces: generated `UpdateWalletUseCaseInteractor` whose `entityConstructorArguments` ends with `"null", "updatedAt"` (in that order — matches the Core `Wallet` constructor's `createdAt, updatedAt` parameter order from Task 3).

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaUpdateUseCaseInteractorTemplateModel.ts` — add the same three optional fields as Task 4's `JavaCreateUseCaseInteractorTemplateModel`:

```ts
export interface JavaUpdateUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly entityType: string;
  readonly entityConstructorArguments: readonly string[];
  readonly executeMethodName: string;
  readonly gatewayUpdateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
  readonly secondaryDependencyType?: string;
  readonly secondaryDependencyFieldName?: string;
  readonly preStatements?: readonly string[];
}
```

- [ ] **Step 2: Update the template**

Replace `template-packs/java-spring-clean-multimodule/core/usecase/update/interactor.java.njk` with the same structure as Task 4's create template, changing only `gatewayCreateMethodName` → `gatewayUpdateMethodName` on the final call:

```njk
package {{ packageName }};

{% for import in imports %}import {{ import }};
{% endfor %}
public final class {{ className }} implements {{ interfaceName }} {
    private final {{ gatewayType }} {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
    private final {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }};
{%- endif %}

    public {{ className }}({{ gatewayType }} {{ gatewayFieldName }}{% if secondaryDependencyType %}, {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }}{% endif %}) {
        this.{{ gatewayFieldName }} = {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
        this.{{ secondaryDependencyFieldName }} = {{ secondaryDependencyFieldName }};
{%- endif %}
    }

    @Override
    public {{ entityType }} {{ executeMethodName }}({{ commandType }} command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "{{ commandRequiredMessageKey }}",
                "{{ commandRequiredDefaultMessage }}"
            )));
        }
{%- for statement in preStatements %}
        {{ statement }}
{%- endfor %}

        {{ entityType }} entity = new {{ entityType }}(
{% for argument in entityConstructorArguments %}            {{ argument }}{% if not loop.last %},{% endif %}
{% endfor %}        );

        return {{ gatewayFieldName }}.{{ gatewayUpdateMethodName }}(entity);
    }
}
```

- [ ] **Step 3: Wire the producer**

After the existing `updateInteractorImports` block (after line 254):

```ts
      if (entity.audited === true) {
        updateInteractorImports.add("java.time.LocalDateTime");
        updateInteractorImports.add(`${namespace}.core.common.time.GetLocalDateTime`);
      }
```

Replace the `updateInteractorModel` construction (lines 432-446):

```ts
      const updateInteractorModel: JavaUpdateUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.update`,
        imports: updateInteractorImports.values(),
        className: updateInteractorType,
        interfaceName: updateUseCaseType,
        commandType: updateCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        entityConstructorArguments: entity.audited === true
          ? [...entity.attributes.map((attribute) => `command.${attribute.name}()`), "null", "updatedAt"]
          : entity.attributes.map((attribute) => `command.${attribute.name}()`),
        executeMethodName: "execute",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
        ...(entity.audited === true ? {
          secondaryDependencyType: "GetLocalDateTime",
          secondaryDependencyFieldName: "getLocalDateTime",
          preStatements: ["final LocalDateTime updatedAt = getLocalDateTime.now();"],
        } : {}),
      };
```

- [ ] **Step 4: Write the producer test**

Mirror Task 4 Step 4, asserting on the update interactor's `templateId`, with `entityConstructorArguments` ending `["null", "updatedAt"]` and `preStatements` containing exactly one line.

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff.

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaUpdateUseCaseInteractorTemplateModel.ts template-packs/java-spring-clean-multimodule/core/usecase/update/interactor.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "feat(java-multimodule): set updatedAt from GetLocalDateTime on update, defer createdAt to infra"
```

---

### Task 6: Patch interactor sets `updatedAt`, passes `createdAt = null`

Same treatment as Task 5, applied to `PatchWalletUseCaseInteractor`, which already fetches `current` via `gatewayFindByIdMethodName` before merging.

**Files:**
- Modify: `packages/adapter-java/src/model/JavaPatchUseCaseInteractorTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/core/usecase/patch/interactor.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts` (patch interactor imports ~line 276-282, model ~lines 509-526)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Consumes: same shape as Tasks 4-5.
- Produces: generated `PatchWalletUseCaseInteractor` whose `mergedEntityArguments` ends with `"null", "updatedAt"`.

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaPatchUseCaseInteractorTemplateModel.ts`:

```ts
export interface JavaPatchUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly entityType: string;
  readonly mergedEntityArguments: readonly string[];
  readonly executeMethodName: string;
  readonly gatewayFindByIdMethodName: string;
  readonly gatewayUpdateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
  readonly secondaryDependencyType?: string;
  readonly secondaryDependencyFieldName?: string;
  readonly preStatements?: readonly string[];
}
```

- [ ] **Step 2: Update the template**

Replace `template-packs/java-spring-clean-multimodule/core/usecase/patch/interactor.java.njk`:

```njk
package {{ packageName }};

{% for import in imports %}import {{ import }};
{% endfor %}
public final class {{ className }} implements {{ interfaceName }} {
    private final {{ gatewayType }} {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
    private final {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }};
{%- endif %}

    public {{ className }}({{ gatewayType }} {{ gatewayFieldName }}{% if secondaryDependencyType %}, {{ secondaryDependencyType }} {{ secondaryDependencyFieldName }}{% endif %}) {
        this.{{ gatewayFieldName }} = {{ gatewayFieldName }};
{%- if secondaryDependencyType %}
        this.{{ secondaryDependencyFieldName }} = {{ secondaryDependencyFieldName }};
{%- endif %}
    }

    @Override
    public {{ entityType }} {{ executeMethodName }}({{ commandType }} command) {
        if (command == null) {
            throw new ValidationException(List.of(new FieldViolation(
                "command",
                "{{ commandRequiredMessageKey }}",
                "{{ commandRequiredDefaultMessage }}"
            )));
        }
{%- for statement in preStatements %}
        {{ statement }}
{%- endfor %}

        {{ entityType }} current = {{ gatewayFieldName }}.{{ gatewayFindByIdMethodName }}(command.id());
        {{ entityType }} merged = new {{ entityType }}(
{% for argument in mergedEntityArguments %}            {{ argument }}{% if not loop.last %},{% endif %}
{% endfor %}        );
        return {{ gatewayFieldName }}.{{ gatewayUpdateMethodName }}(merged);
    }
}
```

- [ ] **Step 3: Wire the producer**

After the existing `patchInteractorImports` block (after line 282):

```ts
      if (entity.audited === true) {
        patchInteractorImports.add("java.time.LocalDateTime");
        patchInteractorImports.add(`${namespace}.core.common.time.GetLocalDateTime`);
      }
```

Replace the `patchInteractorModel` construction (lines 509-526):

```ts
      const patchInteractorModel: JavaPatchUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.patch`,
        imports: patchInteractorImports.values(),
        className: patchInteractorType,
        interfaceName: patchUseCaseType,
        commandType: patchCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        mergedEntityArguments: entity.audited === true
          ? [
              ...entity.attributes.map((attribute) => attribute.identifier
                ? `command.${attribute.name}()`
                : `command.${attribute.name}Provided() ? command.${attribute.name}() : current.get${toJavaTypeName(attribute.name)}()`),
              "null",
              "updatedAt",
            ]
          : entity.attributes.map((attribute) => attribute.identifier
              ? `command.${attribute.name}()`
              : `command.${attribute.name}Provided() ? command.${attribute.name}() : current.get${toJavaTypeName(attribute.name)}()`),
        executeMethodName: "execute",
        gatewayFindByIdMethodName: "findById",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
        ...(entity.audited === true ? {
          secondaryDependencyType: "GetLocalDateTime",
          secondaryDependencyFieldName: "getLocalDateTime",
          preStatements: ["final LocalDateTime updatedAt = getLocalDateTime.now();"],
        } : {}),
      };
```

- [ ] **Step 4: Write the producer test**

Mirror Task 5 Step 4 for the patch interactor's `templateId`, asserting `mergedEntityArguments` ends with `["null", "updatedAt"]`.

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff.

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaPatchUseCaseInteractorTemplateModel.ts template-packs/java-spring-clean-multimodule/core/usecase/patch/interactor.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "feat(java-multimodule): set updatedAt from GetLocalDateTime on patch, defer createdAt to infra"
```

---

### Task 7: Persistence entity gains `createdAt`/`updatedAt` columns and a `setCreatedAt` setter

**Files:**
- Modify: `packages/adapter-java/src/model/JavaPersistenceEntityTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/persistence-entity.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts` (`fields`/`persistenceModel` construction, lines 44-99)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

**Interfaces:**
- Produces: `JavaPersistenceEntityTemplateModel` gains `readonly setters: readonly { readonly name: string; readonly type: string; readonly parameterName: string; readonly fieldName: string }[]` (always present, empty when not audited — this is a **required**, not optional, field: every call site must supply it). Generated `WalletEntity` gains `private LocalDateTime createdAt;`, `private LocalDateTime updatedAt;`, `getCreatedAt()`/`getUpdatedAt()` getters (from the existing generic `fields`/`getters` mechanism), and one new `public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }` method. Task 9 depends on this exact setter name/signature.

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaPersistenceEntityTemplateModel.ts` — add after `uniqueConstraints`:

```ts
export interface JavaPersistenceSetterTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly parameterName: string;
  readonly fieldName: string;
}

export interface JavaPersistenceEntityTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly tableName: string;
  readonly fields: readonly JavaPersistenceFieldTemplateModel[];
  readonly constructorParameters: readonly JavaParameterModel[];
  readonly getters: readonly JavaGetterTemplateModel[];
  readonly deletionTimestampFieldName: string;
  readonly deletionTimestampColumnName: string;
  readonly deletionTimestampGetterName: string;
  readonly deletionScopeFieldName: string;
  readonly deletionScopeColumnName: string;
  readonly activeScopeConstantName: string;
  readonly activeScopeValue: string;
  readonly markDeletedMethodName: string;
  readonly restoreMethodName: string;
  readonly isActiveMethodName: string;
  readonly uniqueConstraints: readonly JavaPersistenceUniqueConstraintTemplateModel[];
  readonly setters: readonly JavaPersistenceSetterTemplateModel[];
}
```

- [ ] **Step 2: Add the setters loop to the template**

In `template-packs/java-spring-clean-multimodule/infra-database/persistence-entity.java.njk`, insert a new loop right after the existing getters loop (after line 27, before the `public Instant {{ deletionTimestampGetterName }}()` method):

```njk
{% for getter in getters %}
    public {{ getter.returnType }} {{ getter.name }}() {
        return {{ getter.fieldName }};
    }
{% endfor %}
{%- for setter in setters %}
    public void {{ setter.name }}({{ setter.type }} {{ setter.parameterName }}) {
        this.{{ setter.fieldName }} = {{ setter.parameterName }};
    }
{% endfor %}
    public Instant {{ deletionTimestampGetterName }}() {
```

(This only changes the file by inserting the new `{%- for setter in setters %}...{% endfor %}` block; every other line is unchanged.)

- [ ] **Step 3: Wire the producer**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts`, after the existing `fields` construction (after line 64), add:

```ts
      if (entity.audited === true) persistenceImports.add("java.time.LocalDateTime");
      const auditedFields = entity.audited === true
        ? [
            { name: "createdAt", type: "LocalDateTime", columnName: "created_at", nullable: false, identifier: false },
            { name: "updatedAt", type: "LocalDateTime", columnName: "updated_at", nullable: false, identifier: false },
          ]
        : [];
      const allFields = [...fields, ...auditedFields];
```

Then update the `persistenceModel` construction (lines 65-99) to use `allFields` instead of `fields` for `fields`/`constructorParameters`/`getters`, and add `setters`:

```ts
      const persistenceModel: JavaPersistenceEntityTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.entity`,
        imports: persistenceImports.values(),
        className: `${entityType}Entity`,
        tableName: toJavaDatabaseTableName(entityType),
        fields: allFields,
        constructorParameters: allFields.map(({ name, type }) => ({ name, type })),
        getters: allFields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })),
        deletionTimestampFieldName: "deletedAt",
        deletionTimestampColumnName: "deleted_at",
        deletionTimestampGetterName: "getDeletedAt",
        deletionScopeFieldName: "deletionScope",
        deletionScopeColumnName: "deletion_scope",
        activeScopeConstantName: "ACTIVE_SCOPE",
        activeScopeValue: "ACTIVE",
        markDeletedMethodName: "markDeleted",
        restoreMethodName: "restore",
        isActiveMethodName: "isActive",
        uniqueConstraints: [
          ...uniqueAttributes.map((attribute) => ({
          name: toJavaDatabaseUniqueConstraintName(
            toJavaDatabaseTableName(entityType),
            [toJavaDatabaseColumnName(attribute.name)],
          ),
          columnNames: [toJavaDatabaseColumnName(attribute.name), "deletion_scope"],
          })),
          ...uniqueGroups.map((group) => ({
            name: toJavaDatabaseUniqueConstraintName(
              toJavaDatabaseTableName(entityType),
              group.map((attributeName) => toJavaDatabaseColumnName(attributeName)),
            ),
            columnNames: [...group.map((attributeName) => toJavaDatabaseColumnName(attributeName)), "deletion_scope"],
          })),
        ],
        setters: entity.audited === true
          ? [{ name: "setCreatedAt", type: "LocalDateTime", parameterName: "createdAt", fieldName: "createdAt" }]
          : [],
      };
```

(Note `fields` — the plain attribute-derived array used elsewhere in the same function for `uniqueChecks`/`sortPropertyMapping` — must stay as-is; only the `persistenceModel`'s own `fields`/`constructorParameters`/`getters` switch to `allFields`.)

- [ ] **Step 4: Write the producer test**

Reuse the existing `toMatchObject`-style idiom from the file's `"prepares active composite uniqueness metadata"` test (around line 318-351). Add:

```ts
it("adds createdAt/updatedAt columns and a setCreatedAt setter when audited", () => {
  const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();
  const artifacts = producer.produce(buildRequest({ audited: true }));
  const entity = artifacts.find((artifact) => artifact.templateId === "infra-database-persistence-entity");

  expect(entity?.model).toMatchObject({
    fields: expect.arrayContaining([
      expect.objectContaining({ name: "createdAt", type: "LocalDateTime", columnName: "created_at", nullable: false }),
      expect.objectContaining({ name: "updatedAt", type: "LocalDateTime", columnName: "updated_at", nullable: false }),
    ]),
    setters: [{ name: "setCreatedAt", type: "LocalDateTime", parameterName: "createdAt", fieldName: "createdAt" }],
  });

  const notAudited = producer.produce(buildRequest({ audited: false }));
  const plainEntity = notAudited.find((artifact) => artifact.templateId === "infra-database-persistence-entity");
  expect(plainEntity?.model).toMatchObject({ setters: [] });
});
```

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff (non-audited `setters: []` renders no setter methods, and the `{%- for setter in setters %}...{% endfor %}` block must trim to nothing when empty — verify this specifically in the golden diff).

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaPersistenceEntityTemplateModel.ts template-packs/java-spring-clean-multimodule/infra-database/persistence-entity.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts
git commit -m "feat(java-multimodule): add createdAt/updatedAt columns and setCreatedAt to the audited persistence entity"
```

---

### Task 8: Persistence mapper carries `createdAt`/`updatedAt` in both directions

**Files:**
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts` (`mapperModel` construction, lines 107-113)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

No model interface or template change is needed here — `JavaPersistenceMapperTemplateModel`'s `toEntityArguments`/`toDomainArguments`/`toTombstoneArguments` are already flat `string[]`, and `persistence-mapper.java.njk` already loops over them generically.

**Interfaces:**
- Consumes: `WalletEntity.getCreatedAt()`/`getUpdatedAt()`/`setCreatedAt()` (Task 7), `Wallet.getCreatedAt()`/`getUpdatedAt()` (Task 3), `WalletTombstone.getCreatedAt()`/`getUpdatedAt()` (Task 3).
- Produces: `WalletPersistenceMapper.toEntity`/`toDomain`/`toTombstone` argument lists ending with the two audit getters (before `getDeletedAt()` in the tombstone case).

- [ ] **Step 1: Write the failing producer test**

```ts
it("carries createdAt/updatedAt through the persistence mapper when audited", () => {
  const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();
  const artifacts = producer.produce(buildRequest({ audited: true }));
  const mapper = artifacts.find((artifact) => artifact.templateId === "infra-database-persistence-mapper");

  expect(mapper?.model).toMatchObject({
    toEntityArguments: expect.arrayContaining(["wallet.getCreatedAt()", "wallet.getUpdatedAt()"]),
    toDomainArguments: expect.arrayContaining(["walletEntity.getCreatedAt()", "walletEntity.getUpdatedAt()"]),
    toTombstoneArguments: ["walletEntity.getBalance()", "walletEntity.getCreatedAt()", "walletEntity.getUpdatedAt()", "walletEntity.getDeletedAt()"],
  });
});
```

(Adjust the exact `domainParameterName`/`entityParameterName` literals — `wallet`/`walletEntity` — to whatever `toJavaFieldName(entityType)` actually produces for the fixture's entity name; check by running the test once and reading the actual failure output rather than guessing.)

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts -t "persistence mapper"`
Expected: FAIL — `createdAt`/`updatedAt` missing from the argument arrays.

- [ ] **Step 3: Update the mapper model construction**

Replace lines 110-112:

```ts
        toEntityArguments: entity.audited === true
          ? [...entity.attributes.map((attribute) => `${domainParameterName}.get${toJavaTypeName(attribute.name)}()`), `${domainParameterName}.getCreatedAt()`, `${domainParameterName}.getUpdatedAt()`]
          : entity.attributes.map((attribute) => `${domainParameterName}.get${toJavaTypeName(attribute.name)}()`),
        toDomainArguments: entity.audited === true
          ? [...entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`), `${entityParameterName}.getCreatedAt()`, `${entityParameterName}.getUpdatedAt()`]
          : entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`),
        toTombstoneArguments: entity.audited === true
          ? [...entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`), `${entityParameterName}.getCreatedAt()`, `${entityParameterName}.getUpdatedAt()`, `${entityParameterName}.getDeletedAt()`]
          : [...entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`), `${entityParameterName}.getDeletedAt()`],
```

- [ ] **Step 4: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff.

- [ ] **Step 5: Commit**

```bash
git add packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts
git commit -m "feat(java-multimodule): carry createdAt/updatedAt through the audited persistence mapper"
```

---

### Task 9: Gateway provider preserves `createdAt` on update

The core behavioral fix: `update()` currently discards the entity it fetches for the not-found/active check, then rebuilds and saves a brand-new mapped entity. When audited, capture that fetched entity and copy its `createdAt` onto the freshly mapped one before saving, so the real creation timestamp survives even though Core passed `createdAt = null`.

**Files:**
- Modify: `packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts` (`model: JavaGatewayProviderTemplateModel` construction, ~line 160-251)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts`

**Interfaces:**
- Consumes: `WalletEntity.setCreatedAt(LocalDateTime)` (Task 7), `WalletEntity.getCreatedAt()` (already existing via the generic getters mechanism once Task 7 lands).
- Produces: generated `WalletGatewayProvider.update()` whose behavior, for audited entities, preserves `createdAt` across an update; for non-audited entities, is byte-identical to today.

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts` — add one required field (default it to `false` at every call site, there being only one call site in this producer):

```ts
  readonly repositoryExistsMethodName: string;
  readonly audited: boolean;
}
```

(Insert `readonly audited: boolean;` as the new final line, right after `readonly repositoryExistsMethodName: string;`.)

- [ ] **Step 2: Update the template's `update()` method**

In `template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk`, replace lines 64-86:

```njk
    @Override
    public {{ entityType }} {{ updateMethodName }}({{ updateParameterName }}) {
        Objects.requireNonNull({{ updateParameterName }}, "{{ updateParameterName }}");

{%- if audited %}
        {{ persistenceEntityType }} existing = {{ repositoryFieldName }}.{{ repositoryFindByIdMethodName }}({{ updateParameterName }}.{{ identifierAccessorName }}())
            .filter({{ persistenceEntityType }}::{{ persistenceEntityActiveMethodName }})
            .orElseThrow(() -> new {{ notFoundExceptionType }}(
                "{{ notFoundMessageKey }}",
                "{{ notFoundDefaultMessage }}"
            ));
{%- else %}
        {{ repositoryFieldName }}.{{ repositoryFindByIdMethodName }}({{ updateParameterName }}.{{ identifierAccessorName }}())
            .filter({{ persistenceEntityType }}::{{ persistenceEntityActiveMethodName }})
            .orElseThrow(() -> new {{ notFoundExceptionType }}(
                "{{ notFoundMessageKey }}",
                "{{ notFoundDefaultMessage }}"
            ));
{%- endif %}

        if (hasActiveUniqueConflict({{ updateParameterName }}, {{ updateParameterName }}.{{ identifierAccessorName }}())) {
            throw new {{ conflictExceptionType }}(
                "{{ conflictMessageKey }}",
                "{{ conflictDefaultMessage }}"
            );
        }

        {{ persistenceEntityType }} entity = {{ mapperType }}.{{ mapperToEntityMethodName }}({{ updateParameterName }});
{%- if audited %}
        entity.setCreatedAt(existing.getCreatedAt());
{%- endif %}
        {{ persistenceEntityType }} saved = {{ repositoryFieldName }}.{{ repositorySaveMethodName }}(entity);

        return {{ mapperType }}.{{ mapperToDomainMethodName }}(saved);
    }
```

- [ ] **Step 3: Wire the producer**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts`, add `audited: entity.audited === true,` as the last property of the `model: JavaGatewayProviderTemplateModel` object literal (right after `repositoryExistsMethodName: "exists",`, before `sortPropertyMapping: ...`).

- [ ] **Step 4: Write the producer test**

```ts
it("preserves createdAt on update only when audited", () => {
  const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();

  const audited = producer.produce(buildRequest({ audited: true }));
  const auditedGateway = audited.find((artifact) => artifact.templateId === "infra-database-gateway-provider");
  expect(auditedGateway?.model).toMatchObject({ audited: true });

  const notAudited = producer.produce(buildRequest({ audited: false }));
  const plainGateway = notAudited.find((artifact) => artifact.templateId === "infra-database-gateway-provider");
  expect(plainGateway?.model).toMatchObject({ audited: false });
});
```

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff — the `{%- if audited %}...{%- else %}...{%- endif %}` else-branch must render byte-identical to today's unconditional block. If the diff shows a stray blank line, adjust trim markers and re-run.

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaGatewayProviderTemplateModel.ts template-packs/java-spring-clean-multimodule/infra-database/gateway-provider.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.test.ts
git commit -m "feat(java-multimodule): preserve createdAt across update for audited entities"
```

---

### Task 10: REST responses expose `createdAt`/`updatedAt` read-only

**Files:**
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts` (`components`/`response`/`tombstoneResponse` construction, lines 221-256)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts`

No model or template change needed — `JavaFactoryRestResponseTemplateModel.components`/`factoryArguments` are already generic arrays and `response.java.njk` already loops over them.

**Interfaces:**
- Consumes: `Wallet.getCreatedAt()`/`getUpdatedAt()` (Task 3), `WalletTombstone.getCreatedAt()`/`getUpdatedAt()` (Task 3).
- Produces: `WalletResponse`/`WalletTombstoneResponse` records gain `createdAt`/`updatedAt` components. Request DTOs (`CreateWalletRequest`, `UpdateWalletRequest`, `PatchWalletRequest`) are untouched — they only ever iterate `entity.attributes`, and `createdAt`/`updatedAt` are never added there.

- [ ] **Step 1: Write the failing producer test**

```ts
it("adds createdAt/updatedAt to WalletResponse and WalletTombstoneResponse when audited", () => {
  const producer = new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer();
  const artifacts = producer.produce(buildRequest({ audited: true }));

  const response = artifacts.find((artifact) => artifact.templateId === "entrypoints-rest-response");
  expect(response?.model).toMatchObject({
    components: expect.arrayContaining([
      { name: "createdAt", type: "LocalDateTime", description: "Wallet createdAt." },
      { name: "updatedAt", type: "LocalDateTime", description: "Wallet updatedAt." },
    ]),
    factoryArguments: expect.arrayContaining(["wallet.getCreatedAt()", "wallet.getUpdatedAt()"]),
  });

  const tombstoneResponse = artifacts.find((artifact) => artifact.templateId === "entrypoints-rest-tombstone-response");
  expect(tombstoneResponse?.model).toMatchObject({
    components: expect.arrayContaining([
      { name: "createdAt", type: "LocalDateTime", description: "Wallet createdAt." },
      { name: "updatedAt", type: "LocalDateTime", description: "Wallet updatedAt." },
      expect.objectContaining({ name: "deletedAt" }),
    ]),
  });
});
```

(Confirm the exact `factoryParameterName`-derived literal — `wallet.getCreatedAt()` — against what `toJavaFieldName(entityType)` actually returns for the fixture, same caveat as Task 8 Step 1.)

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts -t "createdAt/updatedAt to WalletResponse"`
Expected: FAIL.

- [ ] **Step 3: Update the producer**

Replace lines 221-239 (the `components`/`response` construction):

```ts
      const responseImports = new JavaImportCollector();
      responseImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      const components = entity.attributes.map((attribute) => {
        const type = this.typeResolver.resolve(attribute.type);
        responseImports.add(type.import);
        return { name: attribute.name, type: type.name, description: `${entityType} ${attribute.name}.` };
      });
      if (entity.audited === true) {
        responseImports.add("java.time.LocalDateTime");
        components.push(
          { name: "createdAt", type: "LocalDateTime", description: `${entityType} createdAt.` },
          { name: "updatedAt", type: "LocalDateTime", description: `${entityType} updatedAt.` },
        );
      }
      const response: JavaFactoryRestResponseTemplateModel = {
        packageName,
        imports: responseImports.values(),
        recordName: responseName,
        components,
        factoryMethodName: "from",
        factoryParameterType: entityType,
        factoryParameterName: toJavaFieldName(entityType),
        factoryArguments: entity.audited === true
          ? [
              ...entity.attributes.map((attribute) => `${toJavaFieldName(entityType)}.get${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)}()`),
              `${toJavaFieldName(entityType)}.getCreatedAt()`,
              `${toJavaFieldName(entityType)}.getUpdatedAt()`,
            ]
          : entity.attributes.map((attribute) =>
              `${toJavaFieldName(entityType)}.get${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)}()`,
            ),
      };
```

Because `tombstoneResponse` (lines 240-256) already spreads `...components` and `...entity.attributes.map(...)` from the base response's own construction, it inherits the two new fields automatically — no change needed there beyond what already exists, since `components` now includes them before `deletedAt` is appended. Leave lines 240-256 as they are today.

- [ ] **Step 4: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff.

- [ ] **Step 5: Commit**

```bash
git add packages/adapter-java/src/generation/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer.test.ts
git commit -m "feat(java-multimodule): expose createdAt/updatedAt read-only on audited REST responses"
```

---

### Task 11: Configuration wiring — `GetLocalDateTime` bean threaded into create/update/patch

**Files:**
- Modify: `packages/adapter-java/src/model/JavaDomainConfigurationTemplateModel.ts`
- Modify: `template-packs/java-spring-clean-multimodule/configuration/domain-configuration.java.njk`
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts` (imports block ~lines 125-154, `domainModel` construction ~lines 155-201)
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts`

**Interfaces:**
- Consumes: `GetLocalDateTime`/`GetLocalDateTimeImpl` (Task 2), `CreateWalletUseCaseInteractor`/`UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor` two-argument constructors (Tasks 4-6).
- Produces: generated `WalletConfiguration` gains a `@Bean GetLocalDateTime getLocalDateTime()` method, and the three affected `@Bean` methods take a second parameter, only when `entity.audited`.

- [ ] **Step 1: Extend the model interface**

`packages/adapter-java/src/model/JavaDomainConfigurationTemplateModel.ts` — add after `restoreUseCaseImplementationType`:

```ts
  readonly restoreUseCaseBeanMethodName: string;
  readonly restoreUseCaseType: string;
  readonly restoreUseCaseImplementationType: string;
  readonly audited: boolean;
  readonly timeProviderBeanMethodName?: string;
  readonly timeProviderType?: string;
  readonly timeProviderImplementationType?: string;
  readonly timeProviderParameterName?: string;
}
```

- [ ] **Step 2: Update the template**

In `template-packs/java-spring-clean-multimodule/configuration/domain-configuration.java.njk`, add a new bean right after the gateway bean (after line 10), and add the conditional second parameter to the create/update/patch beans only (lines 37-50):

```njk
package {{ packageName }};

{% for import in imports %}import {{ import }};
{% endfor %}
@Configuration
public class {{ className }} {
    @Bean
    public {{ gatewayType }} {{ gatewayBeanMethodName }}({{ repositoryType }} {{ repositoryParameterName }}) {
        return new {{ gatewayImplementationType }}({{ repositoryParameterName }});
    }
{%- if audited %}

    @Bean
    public {{ timeProviderType }} {{ timeProviderBeanMethodName }}() {
        return new {{ timeProviderImplementationType }}();
    }
{%- endif %}

    @Bean
    public {{ useCaseType }} {{ useCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ useCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ byIdUseCaseType }} {{ byIdUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ byIdUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ byFilterUseCaseType }} {{ byFilterUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ byFilterUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ pageUseCaseType }} {{ pageUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ pageUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ byFilterPageUseCaseType }} {{ byFilterPageUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ byFilterPageUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ createUseCaseType }} {{ createUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}{% if audited %}, {{ timeProviderType }} {{ timeProviderParameterName }}{% endif %}) {
        return new {{ createUseCaseImplementationType }}({{ gatewayParameterName }}{% if audited %}, {{ timeProviderParameterName }}{% endif %});
    }

    @Bean
    public {{ updateUseCaseType }} {{ updateUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}{% if audited %}, {{ timeProviderType }} {{ timeProviderParameterName }}{% endif %}) {
        return new {{ updateUseCaseImplementationType }}({{ gatewayParameterName }}{% if audited %}, {{ timeProviderParameterName }}{% endif %});
    }

    @Bean
    public {{ patchUseCaseType }} {{ patchUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}{% if audited %}, {{ timeProviderType }} {{ timeProviderParameterName }}{% endif %}) {
        return new {{ patchUseCaseImplementationType }}({{ gatewayParameterName }}{% if audited %}, {{ timeProviderParameterName }}{% endif %});
    }

    @Bean
    public {{ deleteUseCaseType }} {{ deleteUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ deleteUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ deletedByIdUseCaseType }} {{ deletedByIdUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ deletedByIdUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ deletedByFilterPageUseCaseType }} {{ deletedByFilterPageUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ deletedByFilterPageUseCaseImplementationType }}({{ gatewayParameterName }});
    }

    @Bean
    public {{ restoreUseCaseType }} {{ restoreUseCaseBeanMethodName }}({{ gatewayType }} {{ gatewayParameterName }}) {
        return new {{ restoreUseCaseImplementationType }}({{ gatewayParameterName }});
    }
}
```

- [ ] **Step 3: Wire the producer**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts`, after the existing `imports.add(...)` block (after line 154), add:

```ts
        if (entity.audited === true) {
          imports.add(`${namespace}.core.common.time.GetLocalDateTime`);
          imports.add(`${namespace}.core.common.time.GetLocalDateTimeImpl`);
        }
```

Then add to the `domainModel` object literal (after `restoreUseCaseImplementationType: \`${restoreUseCaseType}Interactor\`,` at line 200, before the closing `};`):

```ts
          audited: entity.audited === true,
          ...(entity.audited === true ? {
            timeProviderBeanMethodName: "getLocalDateTime",
            timeProviderType: "GetLocalDateTime",
            timeProviderImplementationType: "GetLocalDateTimeImpl",
            timeProviderParameterName: "getLocalDateTime",
          } : {}),
```

- [ ] **Step 4: Write the producer test**

```ts
it("threads a GetLocalDateTime bean into create/update/patch when audited", () => {
  const producer = new JavaSpringCleanMultimoduleConfigurationArtifactProducer();

  const audited = producer.produce(buildRequest({ audited: true }));
  const auditedWiring = audited.find((artifact) => artifact.templateId === "configuration-domain-wiring");
  expect(auditedWiring?.model).toMatchObject({
    audited: true,
    timeProviderBeanMethodName: "getLocalDateTime",
    timeProviderType: "GetLocalDateTime",
    timeProviderImplementationType: "GetLocalDateTimeImpl",
  });

  const notAudited = producer.produce(buildRequest({ audited: false }));
  const plainWiring = notAudited.find((artifact) => artifact.templateId === "configuration-domain-wiring");
  expect(plainWiring?.model).toMatchObject({ audited: false, timeProviderType: undefined });
});
```

- [ ] **Step 5: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff.

- [ ] **Step 6: Commit**

```bash
git add packages/adapter-java/src/model/JavaDomainConfigurationTemplateModel.ts template-packs/java-spring-clean-multimodule/configuration/domain-configuration.java.njk packages/adapter-java/src/generation/JavaSpringCleanMultimoduleConfigurationArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleConfigurationArtifactProducer.test.ts
git commit -m "feat(java-multimodule): wire GetLocalDateTime bean into audited create/update/patch use cases"
```

---

### Task 12: Fix generated-test constructor arity for audited entities

Tasks 3-6 changed the `Wallet`/`WalletTombstone` constructor arity when `audited: true` (two extra trailing `LocalDateTime` parameters, three for tombstone counting `deletedAt`). Several **generated test templates construct these types directly** (fixture seeding for `FakeWalletGateway`, direct-construction assertions), not just through the interactors touched in Tasks 4-6. Every one of those direct-construction sites must also supply the two (or three) extra fixture arguments, or the generated Maven build fails to compile. This task fixes the sites already identified precisely, then closes any remaining ones mechanically using the real compiler as the source of truth.

**Files:**
- Modify: `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`
- Test: `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`

**Interfaces:**
- Consumes: the audited `Wallet`/`WalletTombstone` constructors from Task 3.
- Produces: a private helper `auditedFixtureArguments(): string[]` and `auditedTombstoneFixtureArgument(): string` on the producer class, used by every direct-construction test-fixture site.

- [ ] **Step 1: Add the fixture-argument helpers**

In `packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts`, add two private methods to the `JavaSpringCleanMultimoduleCoreArtifactProducer` class (near the top of the class body, alongside any existing private helpers — if none exist yet, add them directly above the `produce` method):

```ts
  private auditedFixtureArguments(): readonly string[] {
    return [
      'LocalDateTime.parse("2026-01-15T10:30:00")',
      'LocalDateTime.parse("2026-01-15T10:31:00")',
    ];
  }

  private auditedTombstoneFixtureArgument(): string {
    return 'Instant.parse("2026-01-15T10:32:00Z")';
  }
```

These produce fixed, deterministic literals — they exist only to satisfy constructor arity in generated tests that don't otherwise assert anything about the timestamps, so a `.now()`-style non-deterministic value must **not** be used (it would risk flaky equality assertions between two separately-evaluated `.now()` calls).

- [ ] **Step 2: Fix the two already-identified direct-construction sites**

At line 390 (`fixtureArguments`, shared by the create and update interactor test models), change:

```ts
      const fixtureArguments = entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression);
```

to:

```ts
      const fixtureArguments = entity.audited === true
        ? [...entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression), ...this.auditedFixtureArguments()]
        : entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression);
```

This single change fixes every downstream use of `fixtureArguments` (lines 407-408, 411, 457-458, 461) automatically, since they all read from this one array — **except** `requiredFields[].nullArguments` (line 395), which must keep exactly one argument per **attribute** (not per audited field) since it's testing "null out this one required attribute" — leave line 395 (`nullArguments: entity.attributes.map((candidate, index) => candidate === attribute ? "null" : fixtureArguments[index]!)`) unchanged in shape, but verify by inspection that it still only maps over `entity.attributes` (not `fixtureArguments`'s full length) — if the generated test's `new Wallet(...)` call built from `nullArguments` also needs the two trailing audited fixture args appended (it constructs a full `Wallet`, so it does), change it to:

```ts
        nullArguments: entity.audited === true
          ? [...entity.attributes.map((candidate, index) => candidate === attribute ? "null" : fixtureArguments[index]!), ...this.auditedFixtureArguments()]
          : entity.attributes.map((candidate, index) => candidate === attribute ? "null" : fixtureArguments[index]!),
```

- [ ] **Step 3: Fix the two `core-find-*-interactor-test` sites**

At lines 964-966 and 1021-1023, both currently:

```ts
            entityConstructorArguments: entity.attributes.map((attribute, index) =>
              this.fixtureResolver.resolve(attribute.type, index).javaExpression,
            ),
```

First open `template-packs/java-spring-clean-multimodule/core/usecase/find/interactor-by-id-test.java.njk` (used by the templateId at line 952, `core-find-usecase-by-id-interactor-test`) and `template-packs/java-spring-clean-multimodule/core/usecase/find/interactor-deleted-by-id.java.njk`-adjacent test template (used by `core-find-deleted-usecase-by-id-interactor-test`, line 1008 — locate its actual template via the manifest entry for that templateId) to see whether `entityConstructorArguments` builds a `new Wallet(...)` or a `new WalletTombstone(...)`. Then:
  - If it builds `Wallet`: change to `entity.audited === true ? [...entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression), ...this.auditedFixtureArguments()] : entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression)`.
  - If it builds `WalletTombstone`: append `this.auditedTombstoneFixtureArgument()` after `this.auditedFixtureArguments()` (createdAt, updatedAt, deletedAt — matching the constructor order fixed in Task 3 Step 6).

- [ ] **Step 4: Fix the patch interactor test's `currentEntityArguments`**

At line 560, `currentEntityArguments: patchFixtureArguments` — `patchFixtureArguments` (defined at line 527) is built the same way as `fixtureArguments`; apply the identical audited-conditional append shown in Step 2 to its definition at line 527:

```ts
      const patchFixtureArguments = entity.audited === true
        ? [...entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression), ...this.auditedFixtureArguments()]
        : entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression);
```

Leave `patchCommandArguments`/`patchUpdatedArguments`/`patchOptionalNullArguments`/`patchOmittedArguments`/`patchEmptyCommandArguments` (lines 528-549) unchanged — these build `PatchWalletCommand` arguments, not `Wallet` constructor arguments, and `PatchWalletCommand`'s shape was not changed by this feature (only the merged `Wallet` inside the interactor gained fields, via `mergedEntityArguments`, already handled in Task 6).

- [ ] **Step 5: Find and fix every remaining site by compiling**

Run: `npm run build`, then generate the audited example from Task 13 below early (pull that example's `model.yaml` creation forward if needed, or use a throwaway model with one `audited: true` entity), and run `mvn -B test -q` against the scratch output.

For every compiler error of the shape `constructor Wallet in class Wallet cannot be applied to given types` or `WalletTombstone(...) cannot be applied`, open the reported generated test file, trace it back to the producer code that emits it (grep the producer for the literal string that appears right before the mismatched argument list, or for the `templateId` printed in the file's originating manifest output path), and apply the same pattern as Steps 2-4: wrap the attribute-fixture array construction in the `entity.audited === true ? [...attributeFixtures, ...this.auditedFixtureArguments()] : attributeFixtures` conditional (adding `this.auditedTombstoneFixtureArgument()` too if the constructed type is `WalletTombstone`). Re-run `mvn -B test -q` after each fix. Repeat until the build reaches `BUILD SUCCESS` with zero compile errors.

- [ ] **Step 6: Add producer-level regression tests for the sites fixed in Steps 2-4**

Add to `packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts`:

```ts
it("appends audited fixture arguments to every direct Wallet-construction test fixture", () => {
  const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();
  const artifacts = producer.produce(buildRequest({ audited: true }));

  const createTest = artifacts.find((artifact) => artifact.templateId === "core-create-use-case-interactor-test");
  expect((createTest?.model as { entityConstructorArguments: string[] }).entityConstructorArguments).toEqual(
    expect.arrayContaining(['LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']),
  );

  const patchTest = artifacts.find((artifact) => artifact.templateId === "core-patch-use-case-interactor-test");
  expect((patchTest?.model as { currentEntityArguments: string[] }).currentEntityArguments).toEqual(
    expect.arrayContaining(['LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']),
  );
});
```

(Confirm the exact `templateId` strings by grepping the producer file — use whatever is actually there rather than guessing.)

- [ ] **Step 7: Run tests, typecheck, golden smoke**

Run: `npm test -- packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts && npm run typecheck && npm run smoke:java-multimodule`
Expected: all pass, zero golden diff (every change in this task is gated behind `entity.audited === true`, so non-audited output — including `wallet-service`'s golden — is untouched).

- [ ] **Step 8: Commit**

```bash
git add packages/adapter-java/src/generation/JavaSpringCleanMultimoduleCoreArtifactProducer.ts packages/adapter-java/tests/JavaSpringCleanMultimoduleCoreArtifactProducer.test.ts
git commit -m "fix(java-multimodule): append audited fixture arguments to direct entity-construction test fixtures"
```

---

### Task 13: Real-Maven validation with a new example, and documentation

Following the milestone 6.34 precedent: `examples/wallet-service` and its golden files stay untouched. A separate example proves the feature end-to-end with a real Maven build, generated to a scratch directory (not golden-covered).

**Files:**
- Create: `examples/audited-wallet-service/model.yaml`
- Modify: `docs/project/CURRENT-STATE.md` (new "Milestone 6.35 Validation" section)
- Modify: `ROADMAP.md` (new row for milestone 6.35)

**Interfaces:**
- Consumes: the complete generation pipeline from Tasks 1-11.
- Produces: narrative validation evidence in `CURRENT-STATE.md`, matching the style of the existing "Milestone 6.34 Validation" section.

- [ ] **Step 1: Create the example model**

`examples/audited-wallet-service/model.yaml`:

```yaml
schemaVersion: "1.0"

application:
  name: audited-wallet-service
  namespace: io.github.jtsato.auditedwalletservice

entities:
  - name: Wallet
    audited: true
    attributes:
      - name: id
        type: uuid
        identifier: true
        required: true

      - name: balance
        type: decimal
        required: true
```

- [ ] **Step 2: Generate to a scratch output directory**

Run (from repo root, after `npm run build`):

```bash
node packages/cli/dist/index.js generate examples/audited-wallet-service/model.yaml --profile java-spring-clean-multimodule --output /tmp/audited-wallet-service-output
```

(Substitute a scratch path appropriate for the shell in use — e.g. the session's scratchpad directory — not a path inside the repo.)

Expected: exits 0, prints a CREATE count summary.

- [ ] **Step 3: Manually inspect key generated files**

Read the generated `Wallet.java` (Core), `WalletEntity.java` (infra), `WalletGatewayProvider.java` (infra), `WalletResponse.java` (REST), and `WalletConfiguration.java` (configuration) from the scratch output directory. Confirm:
- `Wallet` constructor takes `(UUID id, BigDecimal balance, LocalDateTime createdAt, LocalDateTime updatedAt)` with no `@NotNull` on the last two.
- `WalletEntity` has `createdAt`/`updatedAt` `@Column` fields, a `setCreatedAt` method, and `update()` in `WalletGatewayProvider` calls `entity.setCreatedAt(existing.getCreatedAt())`.
- `WalletResponse` record includes `createdAt`/`updatedAt` components.
- `WalletConfiguration` has a `getLocalDateTime()` bean and the create/update/patch beans take two parameters.

- [ ] **Step 4: Run the real Maven build**

Run (from the scratch output directory):

```bash
mvn -B test
```

Expected: `BUILD SUCCESS`, zero compile errors, all generated tests pass. Task 12 already closed the constructor-arity compile risk (direct `Wallet`/`WalletTombstone` construction in generated test fixtures) using the compiler-driven loop in its Step 5 — this step is the final confirmation that loop actually converged. If it did not (a compile error appears here that Task 12 didn't already catch), return to Task 12 Step 5 and apply the same fix pattern there, not here — keep all generator/template changes in Task 12 so the plan's file-ownership per task stays accurate.

- [ ] **Step 5: Record the validation evidence**

Add to `docs/project/CURRENT-STATE.md`, after the "## Milestone 6.34 Validation" section:

```markdown
## Milestone 6.35 Validation

Run context: main workspace, auditing (createdAt/updatedAt) capability; date: <today's date>.

- `npm run typecheck` and `npm run build` - passed.
- `npm test` - passed, <N> test files and <N> tests.
- `npm run test:coverage` - passed; Statements <X>%, Branches <X>%, Functions <X>%, Lines <X>%.
- Full-profile wallet-service dry-run produced 148 CREATE operations, unchanged from the 6.34 baseline because `examples/wallet-service` declares no `audited` entity. `npm run smoke:java-multimodule` (golden byte-comparison) passed, confirming non-regression.
- Real Maven build of a freshly generated `examples/audited-wallet-service/model.yaml` project (`Wallet` entity, `audited: true`), generated to a scratch output directory and validated with `mvn -B test`: Reactor `BUILD SUCCESS`, <N> tests run, 0 failures, 0 errors, 0 skipped. This is new-capability evidence, not golden-covered, demonstrating the generated `GetLocalDateTime`/`GetLocalDateTimeImpl` clock port, `CreateWalletUseCaseInteractor` setting both timestamps, `UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor` setting only `updatedAt`, and `WalletGatewayProvider.update()` preserving `createdAt` via `entity.setCreatedAt(existing.getCreatedAt())` work end-to-end.
```

(Fill in the actual counts from Step 4's real command output — do not invent numbers.)

Add a new row to the Phase 6 table in `ROADMAP.md`:

```markdown
| 6.35 | Auditing (createdAt/updatedAt) | Done | Added an opt-in per-entity auditing capability with a Core clock port, infra-preserved creation timestamps, and read-only REST exposure in the Java multi-module Golden Path. | [Current State](docs/project/CURRENT-STATE.md) |
```

- [ ] **Step 6: Commit**

```bash
git add examples/audited-wallet-service/model.yaml docs/project/CURRENT-STATE.md ROADMAP.md
git commit -m "docs(project): close Milestone 6.35 — auditing (createdAt/updatedAt) validation"
```

---

### Task 14: Full regression suite

Final gate before considering the milestone complete.

**Files:** none (verification only).

- [ ] **Step 1: Full TypeScript gate**

Run: `npm run typecheck && npm run build && npm test && npm run test:coverage`
Expected: all pass; coverage stays at or above the Milestone 6.34 baseline (Statements 91.64%, Branches 76.13%, Functions 97.57%, Lines 92.6% per `CURRENT-STATE.md`).

- [ ] **Step 2: Java multi-module smoke and Maven reactor**

Run: `npm run smoke:java-multimodule && npm run smoke:maven-reactor:java-multimodule`
Expected: both pass — the first proves the non-audited `wallet-service` golden is untouched, the second proves the full generated reactor (still non-audited) still compiles and tests clean end-to-end.

- [ ] **Step 3: Single-module regression**

Run: `node packages/cli/dist/index.js generate examples/wallet-service/model.yaml --profile java-spring-clean --dry-run`
Expected: 6 CREATE operations, unchanged from the `CURRENT-STATE.md` baseline — proves the single-module profile is untouched (the `extraFields`/`audited` parameters only ever get populated by the multi-module producers).

- [ ] **Step 4: Final confirmation**

If every step above is green, the milestone is complete. No further commit is needed for this task (it's verification-only) — if any step fails, return to the relevant earlier task, fix it there, and re-run this task from Step 1.
