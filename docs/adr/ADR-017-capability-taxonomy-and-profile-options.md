# ADR-017 — Capability Taxonomy and Profile Options

## Status

Accepted as a taxonomy baseline. Capability implementations remain deferred to
their roadmap milestones.

## Context

The Wallet Golden Path is intentionally small, while the advanced Bookstore
reference contains cross-cutting concerns, persistence technologies, quality
tools and environment configuration. Treating every reference artifact as a
module or default would make the generator non-deterministic in scope and would
mix domain intent with technology choices.

## Decision

The generator distinguishes:

1. physical modules — Maven/source ownership and dependency boundaries;
2. capabilities — coherent generated behavior and artifact sets;
3. technology options — implementation choices inside capabilities;
4. environment options — runtime exposure and configuration;
5. quality capabilities — build/test verification behavior.

Capabilities may emit artifacts into multiple physical modules. A common
artifact set is a documentation grouping, not a new schema entity. Capabilities
are not aliases for templates.

The future `java-spring-clean-multimodule` baseline is limited to architecture
and contract foundations: ArchUnit, JaCoCo, global error handling, basic i18n,
property-driven CORS, OpenAPI specification, configuration profiles and core
paging common. Swagger UI, PIT, Docker/Compose, Testcontainers, security,
Keycloak, Querydsl, Entity Graph, MapStruct and P6Spy require explicit opt-in.
Self-validation remains pending its own design ADR.

The Core may depend on stable Jakarta APIs but not Spring. Provider
implementations such as Hibernate Validator must not define the Core contract.
Technology-specific choices remain outside the technology-agnostic model.

## Consequences

- Profile composition can express capabilities without creating a producer per
  template or a monolithic profile implementation.
- Existing Golden Paths remain compatible until a later implementation
  milestone changes an explicit default.
- Capability combinations need schema validation in a future profile-options
  milestone.
- Security, persistence, OpenAPI, quality and runtime options can evolve
  independently and receive focused ADRs.
- The Application Model remains unchanged in 6.1; search filters/operators and
  authorization metadata are future model decisions.

## Alternatives rejected

- Copying the reference project's physical modules and libraries as defaults.
- Treating every capability as a new physical Maven module.
- Inferring search operations from entity attributes.
- Making provider-specific Okta or Keycloak behavior the generic security
  contract.
- Making Docker Compose the primary integration-test mechanism.

## Follow-up ADRs

ADR-018 through ADR-023 cover Jakarta/SelfValidating, error/i18n, OpenAPI,
security/Keycloak and quality/Testcontainers boundaries respectively. They are
not part of this ADR's implementation.
