# ADR-007 — Versioned Template Packs

## Status

Accepted

## Context

Generated source code and operational artifacts represent corporate engineering standards.

These standards evolve over time.

Examples include changes to:

* project structure;
* framework conventions;
* dependencies;
* source code style;
* Dockerfiles;
* CI/CD pipelines;
* deployment manifests;
* documentation.

Template changes can significantly alter generated applications.

Therefore, Templates cannot be treated as unversioned implementation details.

## Decision

Templates will be organized into explicitly versioned Template Packs.

Example:

```text
template-packs/
└── java-spring-clean/
    ├── manifest.yaml
    ├── core/
    ├── application/
    ├── persistence/
    ├── api/
    └── tests/
````

Each Template Pack will have an identity and version.

Example:

```yaml
id: java-spring-clean
version: 1.2.0
```

Profiles will resolve or reference compatible Template Packs.

## Template Pack Manifest

A Template Pack manifest will describe the Templates participating in generation.

Conceptually:

```yaml
templates:
  * id: domain-entity
    module: core
    template: core/entity.java.njk
    foreach: entities
    output: >
      core/src/main/java/{{ packagePath }}/{{ className }}.java
```

The exact manifest schema will be specified separately.

## Versioning

Template Packs should follow Semantic Versioning where practical.

Typical interpretation:

### PATCH

Generated behavior is corrected without intentionally changing the public architectural contract.

### MINOR

Backward-compatible generation capabilities are added.

### MAJOR

Existing generated structures, conventions or expected contracts change incompatibly.

Exact compatibility rules will be refined as the generator evolves.

## Reproducibility

The effective Template Pack version is part of the deterministic generation input.

Historical generation must not silently resolve to a newer incompatible Template Pack.

## Testing

Template Packs must have Golden Tests.

Changes to generated artifacts must produce explicit test diffs.

## Consequences

### Positive

* corporate standards become versionable;
* historical generation can be reproduced;
* Template changes are reviewable;
* Profiles can evolve independently;
* migrations between Golden Path versions become possible.

### Negative

* compatibility management is required;
* multiple versions may need to coexist;
* Template Pack distribution will eventually require lifecycle management.

## Architectural Rule

Template changes that alter generated output are versioned behavior changes and must not be treated as invisible implementation details.
