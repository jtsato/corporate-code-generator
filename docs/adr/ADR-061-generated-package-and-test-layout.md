# ADR-061 — Generated Package and Test Layout

## Status

Accepted — Milestone 6.40.

## Context

Two layout problems existed in the generated multi-module project.

**One module, two package roots.** `infra/database` emitted classes under two
unrelated roots. Cross-cutting persistence code lived in
`{namespace}.infra.database.common.*` and
`{namespace}.infra.database.domains.{domain}.{filter,query}`, while the entity,
mapper, repository and gateway provider for the same domain lived in
`{namespace}.infra.domains.{domain}.*`. A single generated file imported from
both roots. Nothing distinguished the two; the split was accumulated history,
not a boundary.

**All integration tests in one flat package.** `configuration/src/test`
contained 24 test classes in the single package `{namespace}`, mixing HTTP
runtime tests, persistence tests, context and smoke tests. Only the ArchUnit
suite and the exception-handler test had sub-packages.

## Decision

- Everything the `infra/database` module generates resides under
  `{namespace}.infra.database.*`. The `{namespace}.infra.domains.*` root is
  gone; `entity`, `mapper`, `repository` and the gateway provider move to
  `{namespace}.infra.database.domains.{domain}.*`, joining `filter` and
  `query`, which were already there. The module directory
  (`infra/database`) and its package root now agree.
- Generated `configuration` tests are grouped by what they exercise:

  | Sub-package | Contents |
  | --- | --- |
  | `architecture` | the ArchUnit suite (unchanged) |
  | `configuration.exception` | the exception-handler test (unchanged) |
  | `smoke` | application-context, CORS, OpenAPI and HTTP smoke tests |
  | `http` | HTTP runtime tests per operation, including the persistence-read test |
  | `persistence` | persistence tests per operation |

  `@SpringBootTest` still finds `@SpringBootConfiguration` by walking up the
  package hierarchy, so moving tests one level down needs no annotation change.

- The end-to-end tests stay in `configuration`. This is deliberate: they load
  the full application context and cross all four modules, so `configuration`
  — the only module that sees every other module — is their correct owner.
  Milestones 6.41 and 6.42 add *module-appropriate* tests (MockMvc slices in
  `entrypoints/rest`, `@DataJpaTest` slices in `infra/database`) rather than
  relocating these.

## Alternatives rejected

- **Unifying the infra module under `{namespace}.infra.*` instead of
  `{namespace}.infra.database.*`**: rejected because the module is
  `infra/database` and a future `infra/messaging` or `infra/cache` would then
  collide in the same package root. The longer root keeps the package name and
  the module directory in agreement.
- **Adopting the reference's flat `infra.domains.{domain}` layout**, with
  entity, mapper, repository and provider side by side in one package:
  rejected because the generated module already separates `filter` and `query`
  by role, and flattening would mean either giving those up or having a
  partially flat layout — a third inconsistency instead of a fix.
- **Relocating the existing full-context tests into `entrypoints/rest` and
  `infra/database`**: rejected because it is not a relocation. Those tests
  require the whole application context, and `entrypoints/rest` does not
  depend on `infra/database`, so the context cannot be assembled there.
  Module-local testing requires *different* tests, which is why it is
  scheduled as its own work.
- **Splitting `configuration` tests by entity rather than by test kind**:
  rejected because it scales the wrong way. With several entities it produces
  many small packages each containing one of every kind, while grouping by
  kind keeps a stable, small set of packages whatever the model contains.

## Scope boundary

This decision changes package names and file locations only. No generated
behavior, no test assertion, no dependency and no artifact count changes. The
full-profile count stays at 150 CREATE operations.

## Consequences

- Every generated file that referenced `{namespace}.infra.domains.*` — the
  gateway provider, the Spring wiring configuration and 18 generated tests —
  now imports from `{namespace}.infra.database.domains.*`. Import ordering
  shifted in the gateway provider as a result, since `entity` now sorts before
  `filter` under a common prefix.
- A reader opening `configuration/src/test` sees five directories describing
  what is tested instead of one directory holding 24 files.
- Coverage attribution is unchanged by this milestone; it is the module-local
  test milestones that will move the numbers ADR-060 recorded.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean verify` against a freshly generated `examples/wallet-service`
  project after the package rename: BUILD SUCCESS.
- `mvn -B clean verify` again after the test-package regrouping: BUILD
  SUCCESS, with every generated test still discovered and passing.
