# ADR-080: NestJS Generated e2e Tests

* Status: Accepted
* Date: 2026-08-11
* Milestone: 7.15

## Context

Golden comparisons and the generated HTTP smoke gate validate the project from the generator repository, but generated applications also need a native test command for end-to-end behavior.

## Decision

Generate a separate Jest configuration and `test/app.e2e-spec.ts` using Supertest. The suite boots the generated Nest application, installs the same global validation, error-filter, i18n, and response-transformer policies as the runtime, and covers health, create/envelope headers, pagination/filtering, and Portuguese validation errors.

## Consequences

Consumers receive a runnable `npm run test:e2e` command. Supertest and its type package are generated development dependencies; broader scenario coverage remains model/profile-specific work.
