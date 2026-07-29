# ADR-015 — Explicit Spring Wiring in Configuration Module

## Status

Accepted

## Context

The Java multi-module Golden Path separates core contracts and use cases,
REST entrypoints, database infrastructure, and the executable configuration
module. Core defines gateway contracts and use cases; infrastructure implements
the gateway. Spring must compose those classes without coupling core or
infrastructure to framework annotations.

## Decision

Generate domain-specific `@Configuration` classes with explicit `@Bean`
methods in the `configuration` module. They bind gateway contracts to their
infrastructure implementations and use-case contracts to their interactors.

Do not generate `@Service`, `@Component`, `@Repository`, `@Named`, or
`@Autowired` in core or infrastructure at this stage.

## Consequences

* Core and infrastructure remain plain Java.
* Spring composition is explicit and located in the executable module.
* The generated wiring compiles with the existing module dependencies.
* Selecting an implementation remains explicit when multiple gateway
  implementations are introduced.
* Runtime/context validation remains a future milestone; Maven compile alone
  does not instantiate the Spring context.
