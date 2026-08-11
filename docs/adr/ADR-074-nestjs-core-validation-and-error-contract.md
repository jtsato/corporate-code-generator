# ADR-074 — NestJS Core Validation and Error Contract

## Status

Accepted — Milestone 7.9.

## Context

The initial NestJS Golden Path validated HTTP request DTOs with `class-validator`, but its Core
commands and queries had no validation contract of their own. The reference NestJS application
validates inputs at the use-case boundary and represents field-level failures explicitly.

Generated Core must remain independent of NestJS and framework validation packages. HTTP validation
is useful at the delivery boundary, but it cannot be the only protection for Core use cases invoked
through another adapter or directly in tests.

## Decision

The NestJS adapter generates a small framework-free Core validation contract:

- `FieldViolation` represents a field and its validation message;
- `ValidationException` carries the collected violations;
- each generated create command and find-by-id query gets a validator;
- each generated use case invokes its validator before calling its gateway;
- primitive validation rules are prepared by the TypeScript technology adapter and rendered by
  templates;
- the web API generates a `ValidationExceptionFilter` that maps the exception to HTTP 400 with
  `statusCode`, `message`, and `violations`;
- `class-validator` remains at the HTTP DTO boundary and is not imported by generated Core.

The UUID rule accepts the canonical UUID shape without constraining a version, because the semantic
`uuid` primitive does not declare a UUID version.

## Alternatives considered

- Copying the reference project's `fluentvalidation-ts` dependency into generated Core was rejected
  because it would couple the Core contract to a library without adding a required semantic concept.
- Relying only on HTTP DTO validation was rejected because it leaves direct and non-HTTP Core use
  cases unprotected.

## Consequences

Generated projects emit five additional files for a one-entity model: two Core exception files,
two use-case validator files, and one web filter. The generated full-profile example therefore
increases from 28 to 33 CREATE operations. Core remains free of NestJS and `class-validator`
imports.

The contract intentionally does not add i18n message keys, response envelopes, health checks, or
generated unit-test artifacts; those remain separate future capabilities.

## Verification

- TypeScript typecheck and build pass.
- Adapter producer and transformer tests pass.
- NestJS golden smoke passes with 33 generated artifacts.
- The generated-project gate passes with required npm registry access, including build and HTTP
  behavior.
