# ADR-035 — Querydsl Filter Mapper Foundation

## Status

Accepted — Milestone 6.13 foundation.

## Decision

The Java multi-module producer generates one `QuerydslFilterDefinition` per
entity. Fields are derived exclusively from the entity attributes in the
Application Model/IR, with Java value types resolved by `JavaTypeResolver` and
Querydsl paths rooted at the generated `Q<Entity>Entity` type. Supported
operators are selected from the semantic attribute type and rendered through
the compatible Querydsl path method.

The generated definitions and their Maven smoke tests are passive foundation
artifacts. They are not wired into controllers, OpenAPI, gateways, use cases,
repositories, paging, sorting, or runtime filtering.

## Consequences

Entity-specific generation no longer assumes Wallet fields such as `balance`.
The dedicated `smoke:querydsl-filter:java-multimodule` compiles definitions for
a Schedule model covering all supported primitive semantic types. Querydsl
Q-types remain Maven-generated and are not committed to the repository.
