# ADR-085 — NestJS Generated Repository Hygiene (`.gitignore` and `README.md`)

## Status

Accepted — Milestone 7.20.

## Context

A generated `nestjs-clean-architecture` project produced source, colocated unit
tests, an end-to-end suite and build configuration, but nothing that makes the
output usable as a repository. The same two consequences the Java Golden Path
hit at milestone 6.37 apply here.

First, the generated tree had no `.gitignore`. A consumer who ran
`npm install && npm run build` and then `git add .` would commit `node_modules/`,
`dist/`, `coverage/` and IDE metadata. Every generated project would need the
same hand-written file as its first manual commit — and in the Node ecosystem
the cost of getting this wrong is higher than in Java, because `node_modules/`
is large enough to make the mistake expensive to undo.

Second, the generated tree had no `README.md`. The layer boundaries, the inward
dependency rule, the commands that install, build, test and run the project, the
HTTP surface, the collection query contract and the language negotiation
behavior were discoverable only by reading generated sources, even though every
one of those facts is already known to the generator at plan time.

The [NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) records both
files as gap G1 and as the one remaining parity item with a direct Java
precedent and no departure from the reference project — the local
`nestjs-clean-architecture-example` has both files.

## Decision

- The `build` module of the `nestjs-clean-architecture` profile emits two
  additional artifacts at the generated project root: `.gitignore` and
  `README.md`. Both are unconditional; neither is behind a profile option.
- `.gitignore` is a static template. It covers Node dependency and log output,
  TypeScript build output, test and coverage output, environment files, IDE
  metadata and operating-system files. It takes no template model, because none
  of its content varies with the application model.

  It ignores `.env` and `.env.*` while re-including `.env.example`. Neither file
  is generated yet; milestone 7.22 adds them. Writing the rule now rather than
  amending the ignore file later means a consumer who creates a `.env` by hand
  before 7.22 lands cannot commit a secret by accident.
- `README.md` is rendered from the existing `NestJsApplicationTemplateModel`,
  which already carries the application name and the entity list. Per-entity
  REST paths use each entity's `restCollectionPath`, the same field the
  controller template renders into `@Controller(...)`, so the documented paths
  cannot drift from the generated controllers.
- The `README.md` closes by telling the reader that the project is generated and
  that changing the model and regenerating is preferable to editing generated
  files by hand.

### Golden storage convention

The generated `.gitignore` is stored in the golden tree as `gitignore`, without
its leading dot, and the smoke test maps the target path to the golden path. A
golden file literally named `.gitignore` would be a live ignore file over the
golden tree itself, which is how the Java Golden Path already stores it
(alongside `dockerignore`). Adopting the same mapping keeps one convention
across both stacks rather than two.

## Consequences

- The full-profile example rises from 90 to 92 CREATE operations. The `build`
  module selection rises from 5 to 7.
- The README is documentation that can go stale against a capability it
  describes. The mitigation is that its variable content is model-derived rather
  than written prose: the entity sections and their paths come from the same
  template model the controllers use. Its fixed prose — the layer table, the
  collection query contract, the error contract — is a maintenance obligation
  for every later milestone in this phase that changes those contracts.
  Milestones 7.22, 7.23, 7.26, 7.27 and 7.28 each change something this file
  states, and each must update it.
- The README documents in-memory persistence as a property of the generated
  project. Milestone 7.26 makes that a technology option and this file has to
  say so at that point.

## Alternatives considered

- **A profile option gating both files.** Rejected: a repository without a
  `.gitignore` is not a variant anyone wants, and ADR-058 already settled the
  same question the same way for Java.
- **Reusing the Java `readme.md.njk` with a shared model.** Rejected: the two
  READMEs share a shape but almost no content — different runtimes, commands,
  layer names, and query contracts. A shared template would be a conditional
  block per stack, which is harder to read than two templates.
- **Storing the golden as a real `.gitignore` and adding a negation rule to the
  repository's own ignore configuration.** Rejected: it makes the golden tree's
  correctness depend on repository-level configuration far from the test that
  reads it. The dotless convention is local and already established.

## Validation

Typecheck, build, `npm test` (55 files, 301 tests), `npm run smoke:nestjs`
(3/3), and `CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs`
(5/5) all passed. Two consecutive generations were byte-identical, and the
identifier-only example emits both files and the same 92 CREATE operations.
Goldens were derived by copying built-CLI output.
