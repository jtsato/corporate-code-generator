# ADR-069 — Generated Mutation Testing Capability

## Status

Accepted — Milestone 6.48.

## Context

[ADR-060](ADR-060-generated-coverage-reporting.md) gave the generated build line
and branch coverage. Coverage records which generated code the generated tests
*executed*; it does not record whether those tests would *notice* if the code
changed. A generated test suite can reach high line coverage while asserting
almost nothing, and nothing in the generated build could tell the difference.

The Wallet Reference Gap Plan lists this as Group B gap #3 and schedules it as
Milestone 6.48: "PIT with `targetClasses` aligned to the `Interactor` suffix;
opt-in, excluded from every-push CI."

## Decision

- The generated `core/pom.xml` declares a Maven **profile** `mutation`
  containing `pitest-maven`, with `pitest-junit5-plugin` as a plugin dependency
  and one execution binding `mutationCoverage` to `verify`.
- `targetClasses` is `<namespace>.core.*UseCaseInteractor` and `targetTests` is
  `<namespace>.core.*`. The `Interactor` suffix follows structural decision D4,
  which kept `Interactor` where the reference project uses `UseCaseImpl`.
- `outputFormats` is `HTML` and `XML`, and `timestampedReports` is `false`, so
  the report always lands at the fixed path `core/target/pit-reports/`. The
  generated README and the generated CI step both name that path, and a dated
  subdirectory would invalidate both.
- Both plugin versions are pinned through parent-POM properties
  (`pitest-maven-plugin.version`, `pitest-junit5-plugin.version`) fed by adapter
  constants, for the same determinism reason ADR-060 gives for JaCoCo:
  `spring-boot-starter-parent` does not manage PIT, so an unpinned declaration
  would resolve from remote `maven-metadata.xml`.
- Only `core` receives the profile. It is the only module holding use-case
  interactors, and mutating framework glue would produce noise, not signal.
- The generated CI workflow gains a `Mutation testing` step guarded by
  `github.event_name == 'workflow_dispatch'`, so it is reachable on demand and
  never runs on a push or pull request.
- **No mutation threshold is generated.** See "Why no threshold yet".

## "Opt-in" means a Maven profile, not a generator option

The gap plan called for an "opt-in profile option". As
[ADR-066](ADR-066-generated-docker-capability.md) already recorded, no
profile-option mechanism exists: `Profile` has no `capabilities` or `options`
field, `ProfileLoader` does not parse one, and the CLI has no flag.

ADR-066 resolved this by emitting unconditionally and recording the deferral.
This decision does better, because mutation testing has a natural opt-in
mechanism that costs nothing to build: a Maven profile. The configuration is
always generated, so every generated project *has* the capability, but nothing
activates it unless the profile is named. `mvn clean verify` never pays for it.

That satisfies the plan's requirement literally — opt-in, and excluded from
every-push CI — while adding no generator mechanism and **no new artifact**. The
full-profile CREATE count stays at 164.

## Why no threshold yet

ADR-060 established the precedent: measure first, gate once the measurement is
defensible. The baseline measured against a freshly generated
`examples/wallet-service` project is:

| Metric | Value |
| --- | ---: |
| Mutations generated | 26 |
| Killed | 24 (92%) |
| Survived | 1 |
| No coverage | 1 |
| Test strength | 96% |
| Line coverage of mutated classes | 82/86 (95%) |
| Wall time | ~19 s |

92% is a real number produced by generated tests against generated code, not a
number calibrated to pass. A threshold is still deferred: one entity produces
only 26 mutations, so a percentage gate would swing hard on a single surviving
mutant and would say more about the shape of the example model than about the
generated tests. A threshold becomes meaningful alongside the coverage gate in
Milestone 6.51, against a model with more than one entity.

## Alternatives rejected

- **Inventing a Profile-schema capability flag to gate the plugin**: rejected
  for the reason ADR-066 gives — it is a larger, separate capability than the
  artifact it would gate, and the Maven profile already delivers the opt-in.
- **Declaring PIT in the parent POM for all four modules**: rejected. Only
  `core` has use-case interactors; the other three modules would generate
  mutants in framework adapters, where a surviving mutant usually means the
  mutation was meaningless rather than that a test is weak.
- **Binding `mutationCoverage` to `test` instead of `verify`**: rejected. PIT
  needs compiled test classes, and `verify` is the phase the generated README
  and CI step can name without surprising anyone.
- **A `schedule:` trigger for nightly mutation runs in the generated
  workflow**: rejected as scope expansion. `workflow_dispatch` already exists in
  that workflow (ADR-065) and makes the capability reachable without inventing a
  cadence on the consumer's behalf.
- **PIT 1.19.1, the version Maven Central's search index reports as latest**:
  rejected because it cannot read the bytecode this Golden Path produces. It
  fails with `Unsupported class file major version 69` against Java 25 classes.
  The search index was stale; `maven-metadata.xml` reports 1.25.9, which parses
  them. Plugin versions for this generator must be taken from
  `maven-metadata.xml`, not from the search API.

## Scope boundary

This decision does not add a mutation threshold, a coverage threshold, Sonar
integration, or mutation analysis for any module other than `core`. It does not
change which tests are generated, where they live, or how many artifacts the
profile produces.

## Consequences

- `mvn -P mutation -pl core verify` on a generated project writes a PIT report
  to `core/target/pit-reports/`; the default build is unchanged and unaffected.
- The generated build carries two more pinned plugin versions to maintain,
  unlike Boot-managed plugins.
- This repository gains a `smoke:mutation:java-multimodule` gate that asserts
  mutants are generated against `*UseCaseInteractor` classes and killed, so a
  future change that silently stops mutating anything fails CI.
- Milestone 6.51 has a measured mutation baseline to set a threshold against,
  alongside the coverage baseline from ADR-060.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (48 test files, 212 tests; the
  mutation smoke is excluded from `npm test` like every other Maven smoke).
- `npm run smoke:java-multimodule` — golden byte comparison; the full-profile
  count stayed at 164 CREATE operations.
- `mvn -B clean verify` against a freshly generated `examples/wallet-service`
  project — BUILD SUCCESS, and PIT did not run.
- `mvn -B -P mutation -pl core verify` against the same project — BUILD SUCCESS
  with the statistics tabulated above, and `core/target/pit-reports/` present
  with no timestamped subdirectory.
- `npm run smoke:mutation:java-multimodule` with `CODEGEN_REQUIRE_MAVEN_SMOKE`.
- The four changed goldens were copied from that fresh CLI output.
