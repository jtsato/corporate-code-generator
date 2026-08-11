# ADR-076 — NestJS HTTP Response Envelopes

## Status

Accepted — Milestone 7.11.

## Context

The generated NestJS controllers returned response DTOs directly. That preserved simple JSON
bodies but left HTTP status and headers implicit in framework decorators and made the controller
contract less expressive than the reference project's transport envelope.

## Decision

The NestJS web API generates a transport-level `HttpResponse<T>` containing status, headers, and
body, plus an `HttpResponseBuilder<T>` and a global `ResponseTransformerInterceptor`.

- create returns status `201` and `Location: /{collection}/{identifier}`;
- find-by-id returns status `200`;
- the interceptor applies status and headers through Nest's `HttpAdapter` and returns only the
  envelope body to the HTTP serializer;
- error filters remain outside the envelope and preserve their existing structured error bodies;
- Core has no dependency on the envelope or NestJS.

The response body shape is deliberately unchanged. This is a transport envelope, not a new
`{ data: ... }` JSON wrapper.

## Alternatives considered

- A universal `{ data: ... }` JSON wrapper was rejected because it would change the existing API
  body contract without being required by the reference implementation.
- Per-controller status/header mutation was rejected because it duplicates transport behavior and
  does not provide one reusable boundary for future response metadata.
- Keeping framework decorators as the only status contract was rejected because it cannot carry
  response headers and does not model the full transport result.

## Consequences

The one-entity example increases from 35 to 38 CREATE operations. Success bodies remain backward
compatible, while creation responses now advertise their resource location. Error responses are
not wrapped, so existing HTTP error consumers remain compatible.

## Verification

- Focused adapter and golden smoke tests pass: 2 files and 8 tests.
- The required-registry generated-project gate passes all 3 tests, including generated Jest,
  build, HTTP behavior, and the `Location` header.
