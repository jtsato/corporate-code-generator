# ADR-064 — Generated OpenAPI Contract Interface

## Status

Accepted — Milestone 6.43. Refines ADR-027's placement of OpenAPI annotations.

## Context

The generated `{Entity}Controller` carried 53 OpenAPI annotation usages inline.
Every one of its nine handlers opened with an `@Operation`, up to four
`@Parameter` declarations, and an `@ApiResponses` block of three to five
`@ApiResponse` entries, before the signature and the four to eight lines of
code that actually do the work. The documented contract and the request
handling were interleaved throughout a 250-line file.

The `wallet-service-java` reference separates the two: an `*ApiMethod`
interface holds `@Tag`, `@Operation`, `@Parameter` and `@ApiResponses`, and the
controller implements it while keeping the Spring routing annotations.

Decision D6 of the gap plan approved adopting that separation.

## Decision

- The `entrypoints-rest` module generates one `{Entity}Api` interface per
  entity, in the same package as the controller. It declares the nine method
  signatures and carries the class-level `@Tag` plus every `@Operation`,
  `@Parameter` and `@ApiResponses` annotation.
- `{Entity}Controller` now declares `implements {Entity}Api`, marks each
  handler `@Override`, and keeps only Spring's annotations: `@RestController`,
  `@RequestMapping`, the HTTP method mappings, and the parameter annotations
  `@PathVariable`, `@RequestBody` and `@RequestParam`.
- Parameter annotations stay on the implementation rather than moving to the
  interface, matching the reference. Spring MVC resolves handler parameters
  from the implementing method.
- The interface receives its own import list rather than reusing the
  controller's, so neither file carries imports it does not use. Ten Swagger
  imports and `ResponseStatus` moved out of the controller.
- One interface per entity, not one per operation. The reference splits its
  controllers per operation and therefore splits the interfaces the same way;
  the generated Golden Path has a single controller per entity, so a single
  interface per entity is the matching shape.

## Verification that the specification is unchanged

Moving annotations to an interface is only safe if springdoc still reads them.
It does — confirmed against a running generated application rather than
assumed:

```text
tags:              [{"name":"Wallets","description":"Wallet operations"}]
POST /wallets tags: ["Wallets"]
POST /wallets summary: "Create wallet"
```

The generated `{Entity}OpenApiSmokeTests`, which asserts operation-level
parameter descriptions, defaults, minimums and response schema references
against the live `/v3/api-docs` document, passes unchanged.

## Alternatives rejected

- **One interface per operation, as in the reference**: rejected because it
  would generate nine interfaces per entity to serve one controller, without
  the per-operation controller split that makes the reference's arrangement
  coherent.
- **Moving the Spring routing annotations to the interface too**: rejected.
  Spring's handling of inherited mapping annotations is narrower than
  springdoc's handling of inherited documentation annotations, and the
  reference keeps routing on the implementation for the same reason.
- **Reusing the controller's import list for the interface**: rejected because
  it would leave each file importing the other's dependencies, replacing 53
  inline annotations with two lists of unused imports.
- **Leaving the annotations inline**: rejected per D6. The controller was
  annotation-dominated, and the OpenAPI contract is the part of a generated
  REST module a reader is most likely to want to read on its own.

## Scope boundary

This decision does not change any route, status code, request or response
shape, or the emitted OpenAPI document. It does not change the Swagger UI
policy set by ADR-027, nor the single-module and NestJS profiles.

## Consequences

- The generated controller is now routing and delegation only; the contract
  reads as a single documented interface.
- The full-profile artifact count rises from 155 to 156 CREATE operations, one
  interface per entity.
- The generated contract test from ADR-062 needed no change: it targets the
  controller, which still exposes the same handlers.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean verify` against a freshly generated `examples/wallet-service`
  project: BUILD SUCCESS, including the OpenAPI smoke test.
- Live `/v3/api-docs` inspection confirming tags, operation tags and summaries
  survive the move, as quoted above.
