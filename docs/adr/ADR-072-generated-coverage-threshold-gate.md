# ADR-072 — Generated Coverage Threshold Gate

## Status

Accepted — Milestone 6.51. Completes the deferral recorded in
[ADR-060](ADR-060-generated-coverage-reporting.md).

## Context

ADR-060 added JaCoCo measurement to the generated build but deliberately shipped
no threshold. A 0.80 line / 0.70 branch rule had been written and failed, and
the failure was a true finding: the REST and persistence modules scored 0.442
and 0.303 line coverage because everything that tested them lived in
`configuration`. ADR-060 deferred the gate until Milestones 6.40, 6.41 and 6.42
moved those tests into the modules that own the code.

All three have since shipped. This decision sets the threshold against what the
generated build now actually produces.

## Measured coverage

Measured from the per-module `jacoco.csv` of a freshly generated
`examples/wallet-service` project, after 6.41, 6.42, 6.49 and 6.50:

| Module | Lines | Line ratio | Branches | Branch ratio |
| --- | ---: | ---: | ---: | ---: |
| `core` | 209/228 | 0.917 | 153/158 | 0.968 |
| `entrypoints/rest` | 139/156 | 0.891 | 96/123 | 0.780 |
| `infra/database` | 164/188 | 0.872 | 78/120 | 0.650 |
| `configuration` | 66/75 | 0.880 | 6/14 | 0.429 |

Compare the two modules ADR-060 flagged: `entrypoints/rest` line coverage moved
from 0.442 to 0.891 and `infra/database` from 0.303 to 0.872. The structural
defect ADR-060 documented is fixed.

## Decision

The generated parent POM adds a `jacoco-check` execution bound to `verify`,
inherited by all four modules, enforcing one rule: **BUNDLE line coverage ≥
0.80**.

The minimum is an adapter constant rendered into the template, not a literal in
the template, per the invariant that templates make no generation decisions.

## Why 0.80 and not 0.85

Every module measures at or above 0.872 today, so 0.85 would also pass. 0.80 is
chosen anyway, because this rule ships to **every generated project, not only
the wallet example**. A model with different attribute types, more entities, or
fewer optional capabilities produces differently shaped code, and a gate
calibrated to the single sample used to set it would fail projects that have
nothing wrong with them.

0.80 still bites. `infra/database`, the lowest module, has 24 uncovered lines
out of 188; roughly fifteen more uncovered lines fail the build.

## Why no branch threshold

No uniform branch minimum is defensible yet. `configuration` sits at 0.429, so
any rule above 0.42 fails every generated project, and any rule at or below 0.42
is vacuous for the other three modules, which already sit between 0.650 and
0.968.

The number is not a testing gap so much as a small denominator: `configuration`
has **14 branches in total**, and all 8 misses live in two classes —
`CorsProperties` (5/12) and the anonymous `WebMvcConfigurer` inside
`CorsWebConfiguration` (1/2). Both are property-defaulting paths. The honest fix
is to cover CORS property defaulting and then set a branch rule, which is a
follow-up milestone, not a gate to ship half-configured.

Excluding `configuration` from a branch rule was considered and rejected for
exactly the reason ADR-060 rejected excluding the weak modules: excluding what
fails is the same as having no rule.

## Alternatives rejected

- **Shipping the original 0.80 line / 0.70 branch pair from ADR-060**: rejected.
  The line half passes now, but 0.70 branch fails `infra/database` (0.650) and
  `configuration` (0.429).
- **Per-module thresholds tuned to each module's current number**: rejected.
  That is a ratchet calibrated to one sample project, and it multiplies the
  generated build's configuration surface by four for no gate strength.
- **An aggregated reactor-level check**: rejected again, for ADR-060's reason —
  aggregation hides per-module imbalance, and per-module numbers are exactly
  what made this threshold decidable.
- **Binding `check` to `test` rather than `verify`**: rejected. `verify` is
  where a gate belongs, and it matches the phase the generated README, CI step
  and `run.sh verify` task already use.

## Scope boundary

This decision adds one line-coverage rule. It does not add a branch rule, a
mutation threshold, per-module tuning, Sonar quality gates, or any change to
which tests are generated.

## Consequences

- `mvn clean verify` on a generated project now fails if any module drops below
  0.80 line coverage. Generated projects gain a real regression gate.
- The gate runs on every push through the generated CI workflow's existing
  `Verify` step; no CI change was needed.
- A future milestone can add a branch rule once CORS property defaulting is
  covered.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (48 test files, 212 tests).
- `npm run smoke:java-multimodule` — golden byte comparison.
- `mvn -B clean verify` against a freshly generated project: BUILD SUCCESS with
  "All coverage checks have been met." reported for all four modules.
- **Negative test**: the generated `pom.xml` minimum was raised to 0.95 and
  `mvn -B verify` re-run. The build failed with `Rule violated for bundle
  wallet-service-core: lines covered ratio is 0.91, but expected minimum is
  0.95`, confirming the rule is enforced rather than merely declared.
- Coverage figures above were read from the generated per-module `jacoco.csv`.
