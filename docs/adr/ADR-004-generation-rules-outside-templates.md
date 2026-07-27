# ADR-004 — Generation Rules Outside Templates

## Status

Accepted

## Context

Template engines support conditionals, loops, variables, macros and other programming constructs.

This makes it possible to implement significant generation logic directly inside templates.

Doing so would make generation behavior:

* difficult to test independently;
* distributed across templates;
* harder to reuse;
* harder to understand;
* tightly coupled to the selected Template Engine.

## Decision

Generation decisions will be implemented primarily through Rules and Transformers.

Templates will receive prepared Template Models and will primarily represent how an artifact is written.

Example:

Instead of deciding inside a Java template whether `java.util.List` is required, a Rule or Transformer will populate the required imports before rendering.

Preferred:

Template Model:

imports:
* java.util.List
* java.util.UUID

Template:

for each import
    render import

Avoid:

if entity contains one-to-many
    add java.util.List

inside the template.

## Consequences

### Positive

* generation decisions are unit-testable;
* templates remain small;
* behavior can be reused;
* Template Engine replacement becomes easier;
* technology decisions become easier to locate.

### Negative

* additional Template Model types are required;
* simple generation scenarios may require more TypeScript code.

## Architectural Rule

Templates MAY contain presentation-oriented conditions.

Templates SHOULD NOT contain semantic or technology-resolution logic that can reasonably be performed before rendering.
