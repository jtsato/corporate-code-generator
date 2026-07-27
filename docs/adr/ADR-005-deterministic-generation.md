# ADR-005 — Deterministic Generation

## Status

Accepted

## Context

Corporate Code Generator will be used to implement repeatable corporate Golden Paths.

Developers and CI/CD pipelines must be able to regenerate an application without producing unexplained differences.

Non-deterministic generation would make:

* code reviews noisy;
* Golden Tests unreliable;
* CI/CD unpredictable;
* generated artifacts difficult to reproduce;
* historical versions difficult to rebuild.

## Decision

Generation will be deterministic.

The following property must hold:

```text
Application Model
+
Generator Version
+
Model Schema Version
+
Profile Version
+
Template Pack Version
+
Explicit Configuration

=

Identical Generated Output
````

All information capable of changing generated output must be represented by an explicit and reproducible input.

## Prohibited Implicit Inputs

Generation must not implicitly depend on:

* current date or time;
* random values;
* LLM responses;
* network services;
* mutable remote state;
* machine-specific configuration;
* environment variables not explicitly declared as generation inputs;
* filesystem state unrelated to the declared generation target.

## Ordering

Collections whose ordering affects generated output must use deterministic ordering.

Examples include:

* imports;
* generated files;
* entities when order is not semantically significant;
* Module execution;
* dependency resolution;
* File Plan operations.

## Generated Metadata

Generated artifacts should not contain volatile metadata such as:

```text
Generated at: 2026-07-27 14:32:10
```

unless explicitly requested and excluded from reproducibility guarantees.

## Formatting

Formatters must be pinned or otherwise version-controlled when formatting affects generated output.

Formatter behavior is part of the effective generation environment.

## Consequences

### Positive

* reproducible builds;
* stable Golden Tests;
* meaningful diffs;
* easier debugging;
* reliable CI/CD;
* historical generations can be reproduced.

### Negative

* all relevant configuration must be explicit;
* dependency and formatter versions require careful management;
* convenience features based on implicit environment state must be avoided.

## Architectural Rule

If two generation executions receive identical declared inputs and versions, any difference in generated artifacts must be treated as a defect unless explicitly documented otherwise.
