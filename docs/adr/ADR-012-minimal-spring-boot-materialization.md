# ADR-012 — Minimal Spring Boot Materialization

## Status

Accepted

## Decision

The `java-spring-clean` Golden Path materializes a minimal Spring Boot
application in the generated project.

The `build` module generates a Maven POM with the Spring Boot parent,
`spring-boot-starter`, and `spring-boot-maven-plugin`. The `bootstrap` module
generates the application entry point annotated with `@SpringBootApplication`.

The initial Spring Boot version is fixed at `4.1.0` in the Java adapter. It is
not resolved dynamically and is not yet part of the Profile contract.

## Scope

This decision does not add web, REST, JPA, repositories, tests, Docker, or
other Spring dependencies. `frameworkVersion` may be promoted to the Profile
contract in a future milestone when multiple framework versions or Profiles
make that metadata necessary.

## Consequences

The generated project now materializes the framework declared by the Profile,
while keeping framework version ownership explicit in the technology adapter
for this single-profile MVP.
