# ADR-057 — NestJS as the Second Golden Path

## Status

Accepted — Milestones 7.0 through 7.6

## Context

Corporate Code Generator currently supports exactly one technology: Java, through the
`java-spring-clean` and `java-spring-clean-multimodule` Golden Paths (ADR-011, ADR-014).

ADR-011 stated the following consequence when Java was chosen as the first technology: "A second
technology must later be implemented to verify that Java-specific assumptions have not leaked into
the Core or IR." This decision was never revisited; it is executed here.

A hand-written NestJS "clean architecture" example project, `nestjs-clean-architecture-example`,
authored by the same person who authored the Java Wallet Service reference, is available in a local
workspace outside this repository. It is not vendored here; only its analysis is, in
[NestJS Reference Architecture](../target-architecture/NESTJS-REFERENCE-ARCHITECTURE.md). It
separates domain models and use cases (`core`), persistence adapters (`infra`), and HTTP delivery
(`web-api`), and plays the same role for NestJS that the Wallet Service played for Java under
ADR-011.

## Decision

NestJS will be the second technology implemented by the generator, as an independent Golden Path.

The initial Profile will be:

nestjs-clean-architecture

* technology: language `typescript`, framework `nestjs`. The profile schema also requires
  `languageVersion`; it will be pinned to a supported TypeScript line when the profile is
  implemented, rather than inherited from the reference project.
* architecture: style `clean-architecture` (the same style already used by both Java profiles,
  expressed in a different technology, not a new style)
* templatePack: `nestjs-clean-architecture`

The reference project must not be blindly converted into templates. Each convention observed in
it must first be classified as belonging to:

* Application Model;
* Profile;
* Module;
* Technology Adapter;
* Rule;
* Transformer;
* Template.

As a worked example of this discipline: the reference project's domain entity identifier is a
numeric id. This is an observed historical fact, not a requirement. The generator will instead use
the semantic `uuid` primitive type already proven by the Java Golden Path, keeping identifier usage
consistent across technologies rather than inheriting a per-reference convention.

Library, runtime, and framework versions observed in the reference project are likewise historical
facts, not implicit generator requirements, consistent with ADR-014's treatment of the Java
reference's Spring Boot version and libraries.

The initial Module set, mirroring the reference project's layering:

* `build` — package manifest and TypeScript/Nest tooling configuration. Requires: none.
* `core` — domain models, use cases, and ports. Framework-free. Requires: none.
* `infra-persistence` — repository, domain/persistence mapper, and gateway-implementing provider.
  Requires: `core`.
* `web-api` — REST entrypoint, request representation. Requires: `core`.
* `bootstrap` — application composition root wiring `infra-persistence` and `web-api` to `core`
  through dependency injection. Requires: `core`, `infra-persistence`, `web-api`.

## Initial Scope

The first vertical slice will generate only a technology-independent domain entity represented as
a TypeScript class, with no NestJS or framework imports.

Initial example:

User

* id: uuid
* name: string
* email: string

This is a deliberately reduced form of the reference project's domain entity. Its password and
full-name attributes are omitted as not relevant to a generator seed, and its creation-timestamp
attribute is omitted because it belongs to the auditing capability, which is explicitly deferred.

The first milestone explicitly excludes:

* use cases;
* REST entrypoints;
* persistence;
* dependency injection wiring;
* a runnable application.

Persistence, once introduced, will start as an in-memory repository, mirroring the reference
project exactly. No database or ORM decision is made by this ADR.

## Explicitly Deferred

The following remain out of scope until scheduled as their own milestones, mirroring how the Java
Golden Path acquired each of its capabilities one milestone at a time rather than all at once:

* authentication and authorization enforcement;
* a real database, ORM, and migrations;
* pagination, filtering, and sorting;
* soft delete and restore;
* composite unique groups;
* auditing (createdAt/updatedAt);
* CORS and environment configuration profiles;
* OpenAPI/Swagger documentation completeness;
* internationalization;
* a response-envelope and interceptor convention;
* an architecture-boundary lint equivalent to ArchUnit;
* generated continuous integration;
* mutation testing;
* a multi-module or monorepo variant of this Golden Path.

## Consequences

The architecture will be validated a second time, this time using NestJS, testing whether
Java-specific assumptions leaked into the Core or IR.

`packages/cli/src/commands/GenerateCommand.ts` currently dispatches producers through a hardcoded
profile-id conditional that rejects any unrecognized profile. ADR-014 already noted that this was
acceptable only "until a concrete need for a registry exists." A second technology is that concrete
need. Replacing the conditional with a producer registry is scoped as its own milestone and ADR,
sequenced ahead of the first NestJS producers: performed first, it is a behavior-preserving refactor
of Java-only dispatch already guarded by existing Golden and smoke coverage, whereas performing it
afterwards would require modifying the same dispatch twice.

Golden Tests and smoke tests for this Golden Path are separated from the Java Golden Paths, under
their own `tests/golden/nestjs-clean-architecture/...` and `tests/smoke/nestjs-*` locations,
following the precedent set by ADR-014 for keeping Golden Paths independent. Per ADR-010's
architectural rule, Golden coverage accompanies each milestone that changes generated artifacts and
is not deferred to a later consolidation milestone.

A generated-project quality gate analogous to the Maven-required Java smokes — installing and
building and testing the generated NestJS project — is required before this Golden Path can be
considered release-ready, and is scoped as its own future milestone.
