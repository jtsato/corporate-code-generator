# ADR-001 — TypeScript as Generator Implementation Language

## Status

Accepted

## Context

Corporate Code Generator requires an implementation language suitable for:

* command-line applications;
* declarative model processing;
* JSON and YAML;
* JSON Schema;
* template rendering;
* filesystem operations;
* cross-platform execution;
* strong typing;
* automated testing.

The generator itself must remain independent from the languages of the applications it generates.

The initial target technologies include:

* Java;
* C#;
* TypeScript.

## Decision

TypeScript running on Node.js will be used as the primary implementation language of Corporate Code Generator.

The project will use TypeScript strict mode.

The generator implementation language does not imply that TypeScript-specific concepts may appear in the technology-agnostic Application Model or IR.

## Consequences

### Positive

* strong integration with JSON-based formats;
* mature CLI ecosystem;
* mature template engine ecosystem;
* cross-platform runtime;
* strong typing;
* straightforward distribution through npm;
* good tooling support;
* natural integration with Nunjucks.

### Negative

* Node.js becomes a runtime dependency for the CLI;
* TypeScript type safety does not exist at runtime and requires explicit validation at external boundaries;
* care must be taken to prevent JavaScript-specific concepts from leaking into the IR.

## Alternatives Considered

### Java

Strong ecosystem and typing, but would make the first Java Golden Path implementation and the generator implementation share the same technology, increasing the risk of accidental coupling.

### C\#

Strong typing and tooling, but similar concerns apply when implementing .NET Golden Paths.

### Go

Good fit for standalone CLI distribution, but has a less natural ecosystem for the selected template strategy and model manipulation requirements.

## Decision Drivers

The primary drivers are:

1. cross-platform CLI support;
2. strong typing;
3. JSON/YAML ecosystem;
4. template ecosystem;
5. development productivity;
6. independence from generated application technologies.
