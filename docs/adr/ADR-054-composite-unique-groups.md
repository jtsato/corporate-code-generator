# ADR-054 — Composite Unique Groups

## Status

Accepted — Milestone 6.34.

## Context

Attribute-level `unique: true` is insufficient for business keys composed of more than one attribute. The model needs to express a composite uniqueness rule without leaking JPA, SQL, or provider-specific concepts into the Core.

The Java multi-module Golden Path also uses a portable soft-delete strategy: active rows have `deletion_scope = ACTIVE`, while tombstones receive an identifier-specific scope. Composite uniqueness must therefore apply to active rows and allow the same tuple to be reused after soft deletion.

## Decision

An entity may declare `uniqueGroups` as an ordered list of attribute-name lists. Each group must contain at least two distinct names, and every name must reference an attribute of the same entity. The Core parser preserves the declaration and the semantic validator reports deterministic `MODEL006`, `MODEL007`, `MODEL008`, and `MODEL009` diagnostics for invalid groups.

The Java multi-module persistence adapter converts each group into a JPA `@UniqueConstraint` over the declared business columns plus `deletion_scope`. Constraint names are deterministic and derived from the table name, declared column order, and the active-scope suffix.

The generated gateway provider prepares one active-row conflict predicate per group. A group is checked only when all of its values are non-null, matching the database's portable composite-unique null behavior. The existing attribute-level checks, conflict contract, restore checks, and single-module profile remain unchanged.

## Alternatives rejected

- Encoding composite groups as technology-specific indexes: this would violate the technology-agnostic model boundary.
- Replacing `unique: true` with named constraint objects: it would make the simple existing declaration needlessly verbose and break compatibility.
- Requiring all group attributes to be non-null: null semantics are already represented by `required`, and forcing that policy would conflate validation with uniqueness.
- Supporting composite groups in every profile immediately: the Java multi-module adapter is the only profile with an approved active-scope persistence strategy.

## Scope boundary

This decision applies to schema version 1.0 and the Java Spring Clean multi-module profile. It does not add relationships, database migrations, partial indexes, additional database providers, or composite-group behavior to the single-module profile.

## Consequences

- Model documents can declare portable composite business keys.
- Invalid references fail before generation with stable diagnostics.
- Generated JPA constraints protect active-row uniqueness under concurrent writes, while provider prechecks preserve the standard conflict response for normal requests.
- Golden output changes only when a model declares `uniqueGroups`; existing generated models remain behaviorally unchanged.
- Known limitation: constraint names are derived by joining column names with `_`, which is not an injective encoding. An entity whose attribute-level `unique: true` column name coincides with a `uniqueGroups` column join (for example attribute `tenantCode` alongside `uniqueGroups: [["tenant", "code"]]`) is disambiguated by an arity segment (`gN_`), but two composite groups whose column joins coincide at the same arity, or a pathologically named attribute that happens to match a group's disambiguated segment, are not yet detected and would silently merge into one weaker constraint. No shipped example or golden triggers this. Closing it fully (an injective encoding, or a producer-level duplicate-name guard) is tracked as follow-up work, not part of this milestone.

## Validation

The milestone requires Core schema/parser/semantic tests, Java adapter metadata tests, generated template/golden verification, Node quality gates, and an unfiltered Maven reactor test for the generated multi-module application.
