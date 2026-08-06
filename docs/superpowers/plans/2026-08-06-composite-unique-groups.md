# Composite Unique Groups Implementation Plan

## Goal

Add declarative composite uniqueness to the semantic model and generate deterministic active-row constraints for the Java multi-module Golden Path without changing existing attribute-level `unique: true` behavior.

## Scope

- Add a semantic `uniqueGroups` concept to the Application Model and schema validation.
- Validate that each group has at least two existing attributes and no duplicate members.
- Preserve the existing soft-delete policy: composite uniqueness applies to active rows and remains reusable after soft delete.
- Generate JPA composite constraints and provider conflict checks from prepared metadata.
- Add Core/REST-independent persistence tests, generated H2 tests, golden updates, ADR, and measured current-state updates.
- Keep the single-module profile unchanged until it has an explicit adapter design.

## Acceptance criteria

- Invalid groups fail semantic validation with deterministic diagnostics.
- A valid group generates one stable composite constraint and active-row conflict behavior.
- Soft-deleted rows do not block reuse of a composite value.
- Existing attribute-level uniqueness and restore conflict behavior remain unchanged.
- Full Node quality gates, golden comparison, Java multi-module Maven reactor, and independent QA pass.

## Planned sequence

1. Tech-lead design and ADR before schema changes.
2. RED schema/validation and producer tests.
3. Model, IR, transformer, persistence adapter, and generated-test implementation.
4. Goldens and profile-boundary verification.
5. Documentation, full gates, QA, and milestone closure.
