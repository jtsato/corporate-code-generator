# ADR-051 — REST PATCH Integration

## Status

Accepted — Milestone 6.31.

## Context

The Java multi-module Golden Path already exposes full replacement updates through
`PUT`. Partial updates require distinguishing an omitted JSON property from a
property explicitly set to `null`, while keeping the Core independent of Jackson
and Spring.

## Decision

Generate PATCH only for the Java multi-module profile. The Core receives a
`Patch<Entity>Command` containing nullable values and a boolean
`<field>Provided` flag for each mutable field. The command rejects an empty patch,
rejects `null` for required fields when supplied, and accepts explicit `null` for
optional fields. The interactor loads the current entity through `findById`,
merges supplied fields, and delegates the result to the existing `update` port.

The REST request is a mutable Jackson-friendly class. Its setters set the
corresponding presence flags, including when the setter receives `null`. The
controller exposes `PATCH /{id}` and delegates to the Core command. Configuration
registers the patch use case, and generated HTTP/OpenAPI tests cover the endpoint
and request schema.

## Scope

The single-module `java-spring-clean` profile is unchanged. PATCH does not add
new model semantics, persistence methods, or Jackson dependencies to Core.

## Consequences

- The full multi-module profile grows from 125 to 131 generated artifacts.
- Core grows from 50 to 54 artifacts; REST grows from 69 to 74; configuration
  grows from 125 to 131.
- Explicit `null` and omission semantics are deterministic and testable.
- PATCH reuses the existing update gateway contract and persistence behavior.
