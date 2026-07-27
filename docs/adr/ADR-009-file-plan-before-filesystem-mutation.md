# ADR-009 — File Plan Before Filesystem Mutation

## Status

Accepted

## Context

A generator may create, overwrite, skip and eventually delete or merge files.

Writing files while templates are being processed creates several problems:

* partial generations;
* difficult dry-run support;
* difficult conflict detection;
* filesystem side effects mixed with rendering;
* poor testability.

## Decision

Corporate Code Generator will build a complete File Plan before performing filesystem mutations.

Conceptually:

Model
    ↓
Generation
    ↓
Rendering
    ↓
File Plan
    ↓
Validation
    ↓
Preview
    ↓
File Writer

A File Plan contains explicit operations.

Initial operations:

* CREATE;
* OVERWRITE;
* SKIP.

Future operations may include:

* DELETE;
* MERGE.

## Consequences

### Positive

* supports dry-run;
* enables conflict detection;
* generation can be inspected before mutation;
* filesystem behavior becomes testable;
* partial writes can be reduced;
* future diff/preview functionality becomes easier.

### Negative

* generated content may need to remain in memory before writing;
* an additional planning abstraction is required.

## Architectural Rule

Templates and Template Engines MUST NOT write generated artifacts directly to the target filesystem.
