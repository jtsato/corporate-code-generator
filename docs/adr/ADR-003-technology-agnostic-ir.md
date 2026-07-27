# ADR-003 — Technology-Agnostic Intermediate Representation

## Status

Accepted

## Context

Corporate Code Generator must generate applications for multiple technology ecosystems.

Examples include:

* Java / Spring Boot;
* .NET / C#;
* TypeScript.

Allowing technology-specific concepts into the Application Model would couple application intent to a particular implementation platform.

For example:

Guid
UUID
BigDecimal
DateTimeOffset

represent technology-specific choices rather than application semantics.

## Decision

The Application Model and Intermediate Representation will use technology-agnostic semantic concepts.

Example:

uuid
decimal
datetime

Technology-specific representations will be resolved by Technology Adapters.

Example:

uuid
 ├── Java       → UUID
 ├── C#         → Guid
 └── TypeScript → string

Semantic references should be resolved in the IR whenever practical.

Example:

Order.customer → Customer Entity

rather than:

Order.customer → "Customer"

## Consequences

### Positive

* enables multiple technology ecosystems;
* keeps application intent independent from implementation;
* simplifies future technology adapters;
* makes semantic validation independent from rendering.

### Negative

* requires an explicit semantic type system;
* requires Technology Adapters;
* some concepts may be difficult to abstract consistently across technologies.

## Architectural Rule

When a concept exists only because of a particular language, framework or deployment technology, it should not automatically become part of the core IR.

A semantic justification must exist before adding it to the technology-agnostic model.
