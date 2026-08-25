# ADR-086 — NestJS Module Boundary Validation

## Status

Accepted — Milestone 7.21.

## Context

[ADR-081](ADR-081-nestjs-composition-root-wiring.md) fixed two generated
artifacts — the per-entity `@Module` and the end-to-end specification — that the
template-pack manifest assigned to `web-api` while their imports depended on
modules `web-api` does not declare in `requires`. The full profile hid the
defect, because the composition root pulls in every module. Only a single-module
selection exposed it.

That milestone fixed the two instances and left the class of defect uncovered.
Nothing in the repository resolved a generated import against the module
selection that produces it, so the check was a manual instruction: resolve every
relative import in a single-module selection against the files that selection
actually produces. A manual instruction is not a gate. Every milestone that adds
a generated artifact can reintroduce the same defect, and milestones 7.22 through
7.29 all add artifacts.

Separately, the generated project itself has no way to state its layer rule. The
Java Golden Path has ArchUnit ([ADR-024](ADR-024-archunit-as-default-architecture-guardrail.md),
split by family at 6.47). The NestJS reference project has no boundary tool at
all — layering there is convention only — so adopting one is a deliberate
departure from the reference, recorded as decision N6 in the
[NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md).

## Decision

Boundary enforcement exists at two points, both derived from one source of truth:
the profile's module `requires` graph.

### Repository-side: `tests/smoke/nestjs-module-boundaries.smoke.test.ts`

- For every module the profile declares, the suite generates that selection alone
  and resolves every relative import in the produced TypeScript against the files
  that selection actually produces. Resolution tries `<path>.ts`,
  `<path>/index.ts` and `<path>` in that order.
- A separate case asserts the inward dependency direction over the full profile:
  `core` importing `infra`, `web-api`, `modules/` or `app.module`; `infra`
  importing `web-api` or the composition root; `web-api` importing `infra` or the
  composition root.
- A third case reads `profiles/nestjs-clean-architecture/profile.yaml` and asserts
  the suite's module list equals the declared one, so adding a module to the
  profile without covering it here fails rather than silently narrowing the gate.
- Import extraction is a regular expression over `from '…'`, bare `import '…'` and
  `export … from '…'`, not a TypeScript parse. The assertion is about which paths
  are named; a parser would add a dependency for no additional reach.
- The suite runs in the default `npm test`, so the gate is unconditional. It needs
  no npm registry, no install, and no database, which is why it can be.

### Generated: `eslint.config.mjs`

- The `build` module emits an ESLint flat configuration declaring one zone per
  layer with `no-restricted-imports` patterns, plus a framework-purity zone for
  `core` that forbids `@nestjs/*`, `nestjs-i18n`, `class-validator`,
  `class-transformer`, `express` and `rxjs`.
- Each layer gets exactly **one** config object. Flat config replaces rule options
  rather than merging them, so a second object naming the same rule for the same
  files would silently discard the first one's patterns. Both of `core`'s groups
  therefore live in a single rule. This is the failure mode most likely to make
  the generated config quietly vacuous, so it is stated in the generated file's
  own comment as well as here.
- Generated development dependencies grow by exactly two: `eslint` and
  `@typescript-eslint/parser`. The `typescript-eslint` meta-package is not used,
  because only core ESLint rules are configured and the plugin half would be dead
  weight.
- `package.json` gains a `lint` script, and the generated `README.md` documents it.

### Proving both are not vacuous

A guardrail that never fires is indistinguishable from an absent one, so both
enforcement points carry a negative case.

- The generated-project smoke, after asserting `npm run lint` passes on generated
  sources, prepends a `core` → `infra` import to a generated model, asserts the
  lint now fails, and asserts the failure names `no-restricted-imports` and the
  boundary message. The file is restored afterwards.
- The repository-side gate was verified by reassigning `bootstrap-entity-module`
  back to `web-api` in the manifest — literally reintroducing the ADR-081 defect —
  and confirming two cases failed. The manifest was restored; the verification is
  recorded here rather than kept as a permanent mutation test.

## Consequences

- The full-profile example rises from 92 to 93 CREATE operations, and the `build`
  module selection from 7 to 8. The `core`, `infra-persistence`, `web-api` and
  `bootstrap` selections are unchanged at 49, 58, 72 and 85, because none of them
  includes `build`.
- The default suite grows by 7 tests and the generated-project smoke by 1.
- Generated `npm install` now also fetches ESLint. The generated-project smoke
  absorbed the cost without changing its timeout budget.
- The two enforcement points can drift: the repository-side gate reads the profile,
  while the generated config is a template with the zones written out. A profile
  whose `requires` graph changes fails the repository-side gate but would leave the
  generated config stale. Milestone 7.29, which re-partitions the modules, is where
  that matters; deriving the generated zones from the profile at render time is the
  fix if it ever bites, and is deliberately not done now because a single-profile
  hard-coding is honest about what it covers.

## Alternatives considered

- **`eslint-plugin-boundaries` or `dependency-cruiser`.** Rejected: both express
  the same rule set as core `no-restricted-imports` for a folder-layered project,
  at the cost of a generated dependency the reference project does not carry.
- **Only the generated lint, no repository-side gate.** Rejected: the generated
  lint runs against the full profile, where every module is present, so it cannot
  see the ADR-081 defect at all. That defect is a property of module *selection*,
  not of the emitted source.
- **Only the repository-side gate, no generated lint.** Rejected: it protects the
  generator but leaves a consumer who edits the generated project with nothing,
  which is the gap the Java Golden Path fills with ArchUnit.
- **A generated architecture test in Jest instead of a lint rule.** Rejected:
  it would need to parse TypeScript at test time to reach the same conclusion
  ESLint reaches from configuration alone.

## Validation

Typecheck and build exit 0. `npm test` 56 files / 308 tests. NestJS golden smoke
3/3; boundary smoke 7/7; `CODEGEN_REQUIRE_NPM_SMOKE=true npm run
smoke:generated-project:nestjs` 6/6, including `npm run lint` on generated sources
and the deliberate-violation rejection. Two consecutive generations were
byte-identical, and the identifier-only example emits the same 93 CREATE
operations. Goldens were derived by copying built-CLI output.
