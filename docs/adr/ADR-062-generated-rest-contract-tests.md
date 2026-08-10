# ADR-062 — Generated REST Contract Tests

## Status

Accepted — Milestone 6.41.

## Context

ADR-060 measured `entrypoints/rest` at 0.442 line coverage. The module's only
generated tests were unit tests of the filter and sort parsers; the controller
itself — routing, request binding, status codes, response shape, and the
translation of a request into a Core command — was exercised only indirectly,
from the full-context HTTP tests generated into `configuration`.

The hand-written `wallet-service-java` reference solves this with a
`@WebMvcTest` slice per controller: the use cases are replaced by mocks
supplied through a nested `@TestConfiguration`, and the assertions read the
JSON contract with `jsonPath` and verify the exact command the use case
received.

## Decision

- The `entrypoints-rest` module generates one `{Entity}ControllerTests` per
  entity, annotated `@WebMvcTest(controllers = {Entity}Controller.class)` with
  `@AutoConfigureMockMvc(addFilters = false)`.
- Every use case the controller depends on is provided as a Mockito mock from a
  nested `@TestConfiguration` marked `@Bean @Primary`, following the reference's
  structure.
- The test covers all nine generated operations: create (201 plus `Location`),
  find by id, update, patch, delete (204), restore (204), find deleted by id,
  the paged listing with its metadata, and the paged deleted listing. It also
  asserts that an unparseable identifier is rejected with a 4xx.
- Response bodies are asserted with `content().json(...)` rather than
  per-field `jsonPath` matchers. Jackson's comparison is type-correct — a
  `decimal` attribute serializes as a JSON number, which a
  `jsonPath(..., is("123.45"))` string matcher would not match — and it is
  lenient about extra fields, so an audited entity's `createdAt`/`updatedAt` do
  not have to be enumerated.
- Because the generated commands are records, the test verifies the mock with
  the concrete expected command rather than `any()`. This makes the test cover
  request-to-command mapping, which is the part of the controller most likely
  to break, and it is why the patch case can assert the interleaved
  `value, valueProvided` argument order the patch command actually declares.
- The module generates a test-scoped `RestTestApplication` annotated
  `@SpringBootApplication`. A web slice locates a `@SpringBootConfiguration` by
  walking up from the test's own package; the runtime application lives in
  `configuration`, which this module does not depend on.
- The module's POM gains `spring-boot-starter-test` and
  `spring-boot-starter-webmvc-test`, both `test` scope. Spring Boot 4 ships
  test slices as separate starters, so `spring-boot-starter-test` alone does
  not provide `@WebMvcTest`.

## Alternatives rejected

- **Moving the existing full-context HTTP tests out of `configuration`**:
  rejected because they cannot run here. They load the whole application
  context, and `entrypoints/rest` does not depend on `infra/database`, so the
  context cannot be assembled. The slice test complements them; it does not
  replace them.
- **Importing the `GlobalExceptionHandler` so the slice can assert the error
  contract**: rejected because the handler lives in `configuration`, which this
  module does not depend on, and inverting that dependency to make a test
  convenient would break the architecture the ArchUnit rules enforce. Error
  translation stays covered by the configuration module's HTTP tests.
- **Generating a `ControllerTestFixture` with a `MessageSource` bean**, as the
  reference does: rejected because nothing in this slice resolves messages —
  the fixture exists in the reference only to support the imported exception
  handlers, which are not imported here.
- **Verifying mocks with `any()`**: rejected because it would drop the
  request-to-command mapping from the test's coverage, leaving the slice
  asserting little more than routing.

## Scope boundary

This decision does not change the controller, the runtime, the configuration
module's tests, or the single-module and NestJS profiles. It does not add a
coverage threshold; that remains Milestone 6.51.

## Consequences

- `entrypoints/rest` line coverage rises from 0.442 to 0.891 and branch
  coverage from 0.748 to 0.780.
- Ten generated contract tests run per entity, in a slice context that starts
  in about two seconds rather than a full application context.
- The full-profile artifact count rises by two per entity plus one per project.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean test -pl entrypoints/rest -am` against a freshly generated
  `examples/wallet-service` project: 10 tests, 0 failures.
- `mvn -B clean verify` on the full reactor: BUILD SUCCESS.
- Coverage measured from the generated `jacoco.csv`, as reported above.
