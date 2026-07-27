## ADR-006 — Profile and Module Architecture

Arquivo: `docs/adr/ADR-006-profiles-and-modules.md`

```markdown
# ADR-006 — Profile and Module Architecture

## Status

Accepted

## Context

Corporate applications are composed of multiple capabilities and conventions.

Examples include:

* domain;
* application;
* persistence;
* REST APIs;
* testing;
* Docker;
* CI/CD;
* Helm;
* Terraform;
* observability;
* documentation.

Different organizations and technology stacks require different combinations of these capabilities.

Representing the entire Golden Path as one monolithic generator would make reuse and evolution difficult.

## Decision

Corporate Code Generator will use two complementary concepts:

* Profile;
* Module.

## Profile

A Profile represents a coherent Golden Path.

It answers:

> Which composition of technologies, architecture, capabilities and conventions should be used?

Example:

```yaml
id: java-spring-clean
version: 0.1.0

technology:
  language: java
  languageVersion: 25

framework:
  name: spring-boot
  version: 4.0.5

architecture:
  style: clean-architecture

modules:
  * core
  * application
  * persistence-jpa
  * api-rest
````

Profiles may define:

* technology;
* framework;
* architecture;
* enabled Modules;
* conventions;
* Template Packs;
* defaults;
* explicit configuration.

Profiles should primarily perform composition rather than implement generation behavior.

## Module

A Module represents an independently identifiable generation capability.

Examples:

```text
core
application
persistence-jpa
api-rest
unit-tests
integration-tests
docker
github-actions
helm
terraform
documentation
```

A Module is not equivalent to a Template.

A Module may require:

* multiple Templates;
* multiple Transformers;
* multiple Rules;
* configuration;
* other Modules.

## Module Dependencies

Modules may declare dependencies.

Example:

```yaml
id: persistence-jpa

requires:
  * core
```

Another example:

```yaml
id: api-rest

requires:
  * application
```

The Module Resolver will build a dependency graph and determine the effective set and order of Modules.

Circular dependencies are invalid.

## Selective Generation

Modules enable partial generation.

Example:

```text
codegen generate
  --profile java-spring-clean
  --module core
```

or:

```text
codegen generate
  --profile java-spring-clean
  --module helm
```

Dependency resolution may automatically include required Modules according to the selected generation policy.

## Consequences

### Positive

* composable Golden Paths;
* modular generation;
* capability reuse;
* explicit dependencies;
* easier testing;
* easier incremental implementation.

### Negative

* dependency resolution is required;
* Module boundaries must be carefully designed;
* excessive Module granularity could make Profiles difficult to understand.

## Architectural Rules

A Profile represents composition.

A Module represents capability.

A Template represents artifact rendering.

These concepts must not be treated as interchangeable.
