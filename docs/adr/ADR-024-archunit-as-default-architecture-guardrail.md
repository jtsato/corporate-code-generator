# ADR-024 — ArchUnit as Default Architecture Guardrail

## Status

Accepted

## Context

ADR-017 classifies ArchUnit as a baseline quality capability for the corporate
multi-module Golden Path. The generated project needs an executable guardrail
for its promised Clean Architecture boundaries. The `configuration` module is
the composition root and has the complete application classpath.

## Decision

Generate `ArchitectureTests.java` under the `configuration` test source set.
Declare `archunit-junit5` as a test-only dependency of that module and manage
its version with the parent POM property. The generated test imports production
classes only and starts with six explicit package-boundary rules. Run it through
a dedicated Maven smoke before context and HTTP runtime smokes.

## Consequences

- Generated multi-module projects fail their architecture test when a covered
  boundary is violated.
- CI gains one Maven test step.
- Rules evolve incrementally, without a generic layered architecture rule.
- The single-module Golden Path and generated runtime code remain unchanged.
