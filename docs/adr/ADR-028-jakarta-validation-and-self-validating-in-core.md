# ADR-028: Jakarta Validation and SelfValidating in Core

## Status

Accepted.

## Decision

`java-spring-clean-multimodule` generates 41 artifacts. Core entities with required attributes extend `SelfValidating<T>`, use Jakarta Validation's `@NotNull`, and invoke `validateSelf()` at the end of construction. Validation failures are represented by `ValidationException` and `FieldViolation`.

Core depends only on the Jakarta Validation API; it remains Spring-free and does not import Hibernate Validator. Hibernate Validator is test infrastructure in `core`, while Spring Boot validation is runtime infrastructure in `configuration`.

The generated validation behavior is verified by `smoke:validation:java-multimodule`. REST DTO validation, validation groups, custom validators, localized validation messages, and HTTP exception handling remain future work.
