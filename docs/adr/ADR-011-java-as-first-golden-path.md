# ADR-011 — Java as the First Golden Path

## Status

Accepted

## Context

Corporate Code Generator is intended to support multiple technology ecosystems.

A first technology is required to validate the architecture through an end-to-end vertical slice.

An existing Wallet Service implemented with Java and Spring Boot is available as a reference application.

## Decision

Java will be the first technology implemented by the generator.

The initial Profile will be:

java-spring-clean

The existing Wallet Service will serve as a Golden Reference from which architectural conventions will be extracted.

The reference application must not be blindly converted into templates.

Each convention must first be classified as belonging to:

* Application Model;
* Profile;
* Module;
* Technology Adapter;
* Rule;
* Transformer;
* Template.

## Initial Scope

The first vertical slice will generate only a technology-independent domain entity represented as a Java class.

Initial example:

Wallet

* id: uuid
* balance: decimal

The first milestone explicitly excludes:

* Spring;
* JPA;
* REST;
* database access;
* Docker;
* CI/CD;
* Helm;
* Terraform.

## Consequences

The architecture will first be validated using Java.

A second technology must later be implemented to verify that Java-specific assumptions have not leaked into the Core or IR.
