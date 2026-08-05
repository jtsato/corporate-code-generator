# ADR-045 — Full Maven Reactor Quality Gate

## Context

The generated `java-spring-clean-multimodule` Golden Path is validated by
specialized Maven smokes, each scoped to a feature through
`-Dtest=<pattern>`. Milestone 6.23 fixed a preexisting failure in
`RestSortParserTests` (`List.of((String) null)` threw `NullPointerException`
before `RestSortParser.parse` was invoked). No existing smoke's `-Dtest`
pattern covered that test class, so the failure stayed outside every
automated gate until an unfiltered `mvn test` was run manually against the
generated reactor. After the 6.23 fix, that same unfiltered `mvn test` passed
across the complete reactor.

## Decision

Add a dedicated smoke, `smoke:maven-reactor:java-multimodule`
(`tests/smoke/java-multimodule-maven-reactor.smoke.test.ts`), that generates
the `java-spring-clean-multimodule` profile and runs `mvn test` against the
generated reactor root with no `-Dtest` filter, reusing the existing
`testWithMaven` helper unchanged. The CI workflow runs it as a new step,
`Maven reactor smoke Java multi-module`, after `Create runtime smoke Java
multi-module` and before `SonarCloud Scan`. It follows the same
`CODEGEN_REQUIRE_MAVEN_SMOKE` availability policy as the other Maven smokes.

All existing feature-focused Maven smokes remain unchanged and continue to
run.

## Consequences

- Coverage of generated Java tests increases: every generated test now runs
  together, at least once per CI run.
- Cross-cutting failures and tests left outside every `-Dtest` pattern are
  now caught automatically instead of requiring a manual reactor run.
- CI time increases by roughly 20-30 seconds with a warm Maven cache, since
  the reactor compiles and runs in under 20 seconds once dependencies are
  already resolved by earlier steps in the same job.
- Feature-focused smokes remain useful for isolating which capability a
  failure belongs to; the reactor smoke does not replace that diagnostic
  value, it only closes the gap they leave between them.
