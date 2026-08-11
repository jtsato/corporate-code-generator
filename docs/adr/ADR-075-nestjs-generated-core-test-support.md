# ADR-075 — NestJS Generated Core Test Support

## Status

Accepted — Milestone 7.10.

## Context

The NestJS Golden Path could build and run its generated application, but it did not emit a
project-native test suite. The reference project keeps Core tests beside the use cases, and the
generated-project gate should verify that those tests compile and execute rather than relying only
on repository-side golden comparisons and HTTP assertions.

## Decision

The NestJS adapter generates:

- Jest and ts-jest development dependencies;
- `test`, `test:watch`, and `test:cov` package scripts;
- package-local Jest configuration rooted at `src` with `*.spec.ts` discovery;
- a colocated create-use-case spec and get-by-id-use-case spec per entity;
- deterministic valid and invalid fixture expressions prepared by the transformer from semantic
  primitive types;
- assertions that invalid Core input fails before the gateway and valid input reaches the gateway.

The generated-project execution gate runs the generated project's `npm test` after installation
and before starting the compiled application. The tests remain framework-free and import neither
NestJS nor `class-validator`.

## Alternatives considered

- Generating only repository-side tests was rejected because it does not prove the generated
  project's own test configuration or source test compilation.
- Generating a full NestJS e2e suite now was deferred; HTTP behavior is already covered by the
  generated-project gate, while `@nestjs/testing` and `supertest` would expand this milestone's
  dependency and bootstrap surface unnecessarily.
- Inferring fixture values in templates was rejected because semantic type-to-value decisions
  belong in the adapter transformer.

## Consequences

The one-entity example increases from 33 to 35 CREATE operations. Generated projects now have a
native unit-test entry point, while Core remains independent of framework and delivery concerns.
Coverage thresholds and mutation-testing policy for the generated NestJS project remain future
capabilities.

## Verification

- Typecheck and build pass.
- Focused adapter and golden smoke tests pass: 3 files and 15 tests.
- The required-registry generated-project gate passes all 3 tests, including generated `npm test`.
