# ADR-095 — NestJS Multi-Module Variant

## Status

Accepted — Milestone 7.29, the last of the [NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md).

## Context

Gap G11 is a multi-module variant of the NestJS Golden Path, mirroring how
`java-spring-clean-multimodule` was split from `java-spring-clean`. Decision N10
scheduled it last, because it re-partitions every artifact the preceding
milestones emit, and named milestone 7.21's boundary validation as its
prerequisite: a layer split is only safe to perform once something checks that
the layers actually hold.

N10 called for "a new profile plus template pack". That was written before the
NestJS pack had 139 templates.

## Decision

### A layout variant, not a second copy

The new profile emits **the same artifacts** as `nestjs-clean-architecture`, one
npm workspace package per module instead of one folder per module. Duplicating
139 templates to achieve that would have guaranteed the two packs drift apart:
every subsequent milestone would have had to touch both, and nothing would have
noticed when one was missed.

So the multi-module pack declares `extends`, and template **files** are borrowed
while template **definitions** are not. The derived pack lists every artifact it
emits with its own output path — 144 entries — and points each at a template in
the base pack. Only file lookup is inherited; a derived pack can still override
an inherited file by placing one at the same relative path.

This is a small addition to the core: a manifest may name a pack it extends, and
`TemplatePackResolver` returns the search path nearest-first, refusing a cycle.

### The one thing a layout genuinely changes

Two layouts of the same code differ in exactly two ways: where an artifact lands,
and how one layer names another. The first is the manifest's business. The second
was, until now, baked into 136 import statements as relative paths whose depth
depends on the importing file.

Each shared template now takes a **root per layer** and defaults it to the
relative path the single-package layout needs:

```njk
{%- set coreRoot = corePackage | default('../../core') -%}
import { Wallet } from '{{ coreRoot }}/models/wallet.model';
```

The multi-module producers supply `@<app>/core` instead. **Supplying those three
values is the whole of what turns a folder import into a package import**, and
the refactor is behavior-preserving by construction: with nothing supplied, every
template renders exactly the string it did before. That was verified by the
single-package goldens coming out byte-identical.

### Package imports, and the resolution they require

Cross-package imports keep their suffix — `@wallet-service/core/models/wallet.model`
rather than a barrel — through an `exports` subpath map on each package. That
demanded one non-obvious setting, established by prototype before any template
was touched:

**`module` and `moduleResolution` must be `node16`.** Under the classic `node`
resolution TypeScript ignores `exports` and rejects every deep subpath, while
Node itself resolves them happily — the build fails on types for imports that
would work at runtime. `node16` keeps CommonJS emit, so Nest, its decorators and
its DI are unaffected.

### Two enforcements of the dependency direction

The generated ESLint config forbids the imports that would cross a boundary the
wrong way, now by package name rather than by relative path. Underneath it, **a
package that does not declare another in its `dependencies` cannot resolve it at
all**, and `@<app>/core` declares none.

The Core having an empty dependency list is the same claim the lint makes,
expressed where the package manager can act on it.

### Build, test, and what each resolves against

`npm run build` is `tsc --build packages/bootstrap`, not `nest build`: the build
walks the project references so each package compiles in dependency order and
publishes declarations to the next. Unit tests run from the root against
**sources** — Jest's `moduleNameMapper` and `tsconfig.spec.json`'s `paths` both
point package names at `packages/*/src` — so the suite needs no prior build. The
two have to agree, and they are configured in different files, which is why the
gate asserts both.

## Consequences

- The multi-module profile emits **135** CREATE operations against the
  single-package profile's 127 for the same model: the same artifacts plus a
  manifest and compiler configuration per package, a root workspace manifest, a
  shared compiler baseline, and a test configuration. `tsconfig.json` and
  `tsconfig.build.json` have no counterpart once each package carries its own.
- Both profiles support both persistence options and per-entity auditing. All
  four combinations were generated, and the option reaches only the package that
  owns persistence.
- The core gains template-pack inheritance, which is available to any future
  pack; `TEMPLATE006` reports a cycle.
- Every one of the 136 cross-layer imports in the shared templates is now a
  variable with a literal default. A new template with a cross-layer import must
  do the same, or it will render a relative path into a workspace.
- The generated project's `nest build` is replaced by `tsc --build`, so
  `nest start --watch` is not offered in this layout.

## Alternatives considered

- **Duplicating the template pack**, as N10's wording implied and as the Java
  packs do. Rejected: `java-spring-clean` has six templates, so its split cost
  nothing; here it would have duplicated 139 and guaranteed drift. The plan chose
  "a new profile plus template pack" without knowing that count, and this keeps
  the profile and the pack while single-sourcing their contents.
- **TypeScript path aliases in both layouts**, which would have made the two
  renderings identical. Rejected: `paths` are compile-time only, so the emitted
  `require` would not resolve without a runtime resolver or a bundler — a new
  dependency on the default path to serve the variant.
- **Barrel imports** (`@<app>/core`) instead of subpaths, which work under
  classic `node` resolution. Rejected: the import specifier would then change
  shape rather than just its prefix, so every one of the 136 sites would need its
  own variable rather than one per layer.
- **A `layout` concept in the profile**, rewriting output paths by rule. Rejected
  as a larger core feature than needed: the explicit per-artifact mapping is
  longer but says exactly where each artifact goes, and it is the thing a
  reviewer would want to read.
- **One `dist` for the whole workspace.** Rejected: it defeats project references
  and puts the packages back into one compilation unit, which is the thing the
  variant exists to avoid.

## Validation

Typecheck and build exit 0. `npm test` 61 files / 365 tests. The single-package
goldens are **byte-identical** to the ones milestone 7.28 approved, which is what
shows the import refactor changed nothing for that profile. Multi-module golden
and layout smoke 8/8; `CODEGEN_REQUIRE_NPM_SMOKE=true npm run
smoke:generated-project-multimodule:nestjs` 3/3.

The generated workspace was installed, linted, built and run: **79 unit tests and
5 end-to-end tests** in memory, **87 and 5** under TypeORM, with the compiled
composition root serving health, CRUD, soft delete, the deleted-only routes,
restore and Swagger over HTTP. All four combinations of model and persistence
option generate byte-identically across two runs.

The layout assertions were proven non-vacuous by relocating one inherited
artifact to a path the rewrite does not predict, which failed exactly the three
cases that compare the two profiles and the golden; the manifest was then
restored. Dropping an entry outright cannot pass silently either — the producer
still invokes it, so generation fails.

The architecture was validated by prototype before any template changed: a
two-package workspace with deep subpath imports, decorators, DI, Jest and a
boundary lint, built and served, which is where the `node16` resolution
requirement was found.
