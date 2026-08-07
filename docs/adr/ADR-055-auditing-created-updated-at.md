# ADR-055 — Auditing (createdAt/updatedAt)

## Status

Accepted — Milestone 6.35.

## Context

Generated entities had no record of when a row was created or last changed. Consumers of the Java multi-module Golden Path routinely need `createdAt`/`updatedAt` timestamps for auditing, debugging, and downstream reconciliation, but not every entity needs them, and no existing capability milestone introduced a Core-owned clock abstraction.

The reference precedent for this project's Java multi-module style already separates "what changed" from "who changed it": an update loads the existing row and mutates only the fields that actually change, rather than replacing the row wholesale. Auditing timestamps have to fit that same shape — a fresh creation gets both timestamps, an update advances only `updatedAt`, and `createdAt` survives every subsequent update unmodified.

## Decision

An entity may declare `audited: boolean` (default `false`). This is an opt-in, per-entity flag, not a profile-wide or application-wide switch — most entities in a model do not need auditing, and forcing every entity in an application to carry the same two fields would contradict the technology-agnostic, minimal-surface model philosophy already established for `unique`, `uniqueGroups`, and soft delete. The flag is honored only by the `java-spring-clean-multimodule` profile; the single-module profile does not implement auditing.

When `audited: true`:

- **Core** gains a new port, `GetLocalDateTime`, under `core/common/time/`, alongside a concrete `GetLocalDateTimeImpl` that implements it via `LocalDateTime.now(Clock.systemDefaultZone())`, generated in the same package. A concrete implementation living inside Core does not violate the "Core must not depend on Spring/JPA" architecture boundary enforced by the generated ArchUnit tests: `GetLocalDateTimeImpl` depends only on `java.time.*`, which is part of the JDK, not a framework. The existing ArchUnit rule (`coreShouldNotDependOnSpring`) checks for `org.springframework..` and `com.querydsl..` package dependencies specifically — `java.time` is exempt by construction, the same way Core's existing use of `java.util.List` or `java.math.BigDecimal` is exempt.
- The Core domain model (e.g. `Wallet`) gains two additional final fields, `createdAt` and `updatedAt`, in the existing plain-class-with-constructor-and-getters style. Unlike required business attributes, these fields deliberately do **not** carry `@NotNull` or any other self-validation annotation. `Wallet` extends `SelfValidating<Wallet>` and validates on every construction — including the internal command-construction inside `UpdateWalletUseCaseInteractor`/`PatchWalletUseCaseInteractor`, which must be able to construct a `Wallet` with `createdAt = null` before persistence (see below). A `@NotNull` on `createdAt` would make every update or patch throw a validation exception before the infra layer ever gets a chance to preserve the real value. This mirrors the existing `WalletTombstone`, which already carries a system-managed field (`deletedAt`) with no self-validation at all.
- `CreateWalletUseCaseInteractor` (and the equivalent for any audited entity) takes `GetLocalDateTime` as a secondary constructor dependency and reads the clock exactly once per invocation, assigning the same value to both `createdAt` and `updatedAt` (`final LocalDateTime createdAt = getLocalDateTime.now(); final LocalDateTime updatedAt = createdAt;`). A fresh record's `createdAt` and `updatedAt` are defined to be identical; reading the clock twice would make that untrue at sub-millisecond resolution on a real system clock.
- `UpdateWalletUseCaseInteractor` and `PatchWalletUseCaseInteractor` gain the same `GetLocalDateTime` dependency, but construct their `Wallet` with `createdAt = null` and `updatedAt = getLocalDateTime.now()`.
- **`createdAt` preservation across updates is an infra responsibility, not a Core one.** Core always passes `createdAt = null` on update and patch — it never re-fetches or threads the old value through the use case layer. `WalletGatewayProvider.update()` loads the existing persisted row by id and, when mapping the incoming domain object back onto the JPA entity, preserves the row's original `createdAt` (`entity.setCreatedAt(existing.getCreatedAt())`) while writing the new `updatedAt`. `WalletGatewayProvider.create()` has no preservation concern — it maps a brand-new entity carrying the Core-supplied `createdAt`/`updatedAt` directly and saves it.
- The generated JPA `*Entity`, persistence mapper, and REST response gain read-only `createdAt`/`updatedAt` exposure; no REST request DTO (create, update, or patch) accepts either field as client input — both are always server-generated.
- The generated Spring `GetLocalDateTime` bean lives in exactly one application-level `@Configuration` class (`TimeConfiguration`, package `<namespace>.configuration.time`), emitted once per application whenever at least one entity is audited — not once per audited entity. Every other bean in the per-entity `<Entity>Configuration` class is entity-namespaced by construction (`walletGateway`, `createWalletUseCase`, and so on), but the clock port has exactly one implementation shared by the whole application, so a single, non-entity-scoped bean is correct. The per-entity `<Entity>Configuration` class still declares `GetLocalDateTime` as a constructor parameter type on its `create`/`update`/`patch` `@Bean` methods when that entity is audited; Spring resolves it by type against the single application-level bean.

## Alternatives rejected

- **A profile-wide or application-wide `audited` toggle** instead of a per-entity flag: this would force every entity to carry two fields it may not need, breaking the minimal-surface precedent set by `unique`/`uniqueGroups`/soft delete.
- **Declaring `GetLocalDateTime` as an interface only, with the implementation generated into Infra**: rejected because the implementation has no framework dependency and Core already owns comparably framework-free concrete helpers (`SelfValidating`); routing a one-line `LocalDateTime.now(...)` wrapper through Infra would add an unnecessary cross-module hop for no architectural benefit.
- **`@NotNull` on `createdAt`/`updatedAt` in the Core model**: rejected because it is incompatible with the update/patch interactors' need to construct the model with `createdAt = null` ahead of infra-side preservation.
- **Threading the existing `createdAt` value from Core through the update/patch command** (fetch-then-pass instead of infra-side preservation): rejected because it would require an extra read in the use case layer purely to satisfy field preservation, duplicating work the gateway provider already does when it loads the existing row to apply the update.
- **Declaring the `GetLocalDateTime` bean inside each audited entity's per-entity `<Entity>Configuration` class** (the shape initially implemented and shipped early in this milestone): rejected after the final whole-branch review found that a model with two or more audited entities would emit multiple `@Bean` methods named `getLocalDateTime()` across separate `@Configuration` classes, which Spring rejects at startup (`BeanDefinitionOverrideException` under the default `allow-bean-definition-overriding=false`) because bean names collide within the same application context. Hoisting the bean to a single application-level `@Configuration` class, gated on "any entity is audited," fixes this while leaving the per-entity wiring untouched for the common single-audited-entity case.

## Scope boundary

This decision applies to schema version 1.0 and the Java Spring Clean multi-module profile only. It does not add optimistic locking, soft-delete-specific auditing fields beyond the existing `deletedAt`, configurable clock zones, audit trails of *who* changed a record, or auditing support in the single-module profile.

## Consequences

- Model documents can opt individual entities into `createdAt`/`updatedAt` tracking without affecting entities that do not declare `audited: true`.
- A freshly created audited record always has `createdAt === updatedAt`, derived from a single clock read.
- `createdAt` is immutable from the moment a row is first persisted: Core never supplies it on update/patch, and only the gateway provider — which already holds the existing row — carries it forward.
- Exactly one `GetLocalDateTime` bean exists per generated application regardless of how many entities are audited, avoiding a Spring context startup failure that was invisible to any single audited entity's own tests.
- Golden output changes only when a model declares `audited: true` on at least one entity; existing generated models remain behaviorally unchanged.

## Validation

The milestone requires Core parser/semantic tests, Java adapter template/producer tests (including a two-audited-entity regression covering the single-bean fix), generated golden verification for the unaffected non-audited path, Node quality gates, and an unfiltered Maven reactor test for a freshly generated single-entity audited application (`examples/audited-wallet-service`).
