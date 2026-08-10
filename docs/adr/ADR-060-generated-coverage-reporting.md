# ADR-060 — Generated Coverage Reporting

## Status

Accepted — Milestone 6.39. The coverage *threshold* originally planned for
this milestone is deferred to Milestone 6.51; see "Why no threshold yet".

## Context

The generated Maven project measured no coverage. Nothing in the generated
build recorded which generated code its generated tests actually executed, so
no downstream consumer could tell whether the generated test suite covered the
generated behavior or merely compiled alongside it.

The milestone as planned was "JaCoCo agent, report, and a `check` threshold at
`verify`."

## Decision

- The generated parent POM declares `jacoco-maven-plugin` in
  `<build><plugins>`, inherited by all four modules, with two executions:
  `prepare-agent` (default phase) and `report` bound to `test`.
- The plugin version is pinned through a `jacoco-maven-plugin.version`
  property. It is **not** left to inherit, because
  `spring-boot-starter-parent` does not manage `jacoco-maven-plugin`: an
  unpinned declaration made Maven resolve the plugin from remote
  `maven-metadata.xml`, which is exactly the kind of undeclared external state
  ADR-005 forbids. This is a determinism fix, not a style preference, and it
  is the one place where ADR-059's "do not restate Boot-managed plugin
  versions" rule does not apply, because Boot does not manage this one.
- Each module produces `target/site/jacoco/` with HTML, XML and CSV output
  after `mvn test`.
- No `check` execution and no threshold are generated.

## Why no threshold yet

A threshold was written, set to 0.80 line and 0.70 branch, and run against a
freshly generated project. It failed, and the failure is a true finding rather
than a bad threshold. Measured per-module coverage was:

| Module | Line | Branch |
| --- | ---: | ---: |
| `core` | 0.917 | 0.968 |
| `entrypoints/rest` | 0.442 | 0.748 |
| `infra/database` | 0.303 | 0.533 |
| `configuration` | 0.859 | 0.429 |

`core` is the only module whose tests live with the code they exercise. The
REST and persistence modules score low not because their code is untested, but
because everything that tests them — the HTTP runtime tests and the
persistence tests — is generated into `configuration`. JaCoCo attributes that
execution to the `configuration` bundle, so the modules that own the code look
uncovered while `configuration` carries coverage for code it does not own.

Setting the threshold to whatever currently passes would encode that defect as
the standard. Setting it to a meaningful value would fail every generated
project. The threshold therefore waits until Milestones 6.40, 6.41 and 6.42
have moved controller tests into `entrypoints/rest` and persistence slice
tests into `infra/database`; a new Milestone 6.51 introduces the `check` rule
against the coverage those milestones produce.

Measurement lands now because it is what makes the later threshold
defensible — the numbers above are the baseline the test-relocation
milestones will be judged against.

## Alternatives rejected

- **Shipping a 0.40 line threshold so the gate passes today**: rejected. A
  threshold calibrated to current output is not a gate; it only ratchets when
  someone remembers to raise it.
- **Excluding `entrypoints/rest` and `infra/database` from the check**:
  rejected. Excluding the two modules with the worst coverage is the same
  thing as having no gate, and it would hide the structural problem instead of
  scheduling its fix.
- **An aggregated reactor-level report instead of per-module reports**:
  rejected for now. Aggregation would mask exactly the per-module imbalance
  documented above. It becomes worth reconsidering once each module carries
  its own tests.
- **Leaving the plugin version unpinned**: rejected for the determinism reason
  given above.

## Scope boundary

This decision does not add a coverage threshold, an aggregated report, Sonar
integration, or mutation testing. It does not change which tests are generated
or where they live.

## Consequences

- `mvn test` on a generated project writes per-module JaCoCo reports.
- The generated build now has a pinned plugin version that must be maintained,
  unlike Boot-managed plugins.
- Milestone 6.51 has a concrete, measured baseline to set a threshold against.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean verify` against a freshly generated `examples/wallet-service`
  project: BUILD SUCCESS, no missing-plugin-version warning, per-module
  `target/site/jacoco/` reports present, and
  `configuration/target/wallet-service-starter.jar` produced.
- Per-module coverage measured from the generated `jacoco.csv` reports, as
  tabulated above.
