# Restore and Include-Deleted Queries Implementation Plan

> **For agentic workers:** Continue from the approved soft-delete baseline. Preserve existing uncommitted work, use TDD, and do not create commits unless explicitly requested.

**Goal:** Add an explicit, opt-in capability for retrieving soft-deleted records and restoring them in the Java multi-module Golden Path, without changing the default active-only behavior.

**Proposed scope:** Keep normal REST reads, filters, paging, updates, PATCH, and delete active-only. Add a separate persistence/application capability for include-deleted reads and restore, with explicit authorization at the generated use-case boundary. Reuse the existing tombstone metadata and active-uniqueness rules; restore must return a conflict when another active record owns a unique value.

**Out of scope:** Hard purge, audit history, authorization implementation, composite unique groups, optimistic locking, new database providers, and single-module output changes.

## Acceptance criteria

- Default queries remain active-only and existing endpoint contracts remain unchanged.
- Include-deleted behavior is opt-in and cannot be activated accidentally by ordinary filters or paging.
- A deleted entity can be retrieved through the explicit capability with its tombstone state represented only where that capability permits it.
- Restore clears the tombstone atomically and returns the entity to the active scope.
- Restore conflicts on active unique values with the existing 409 contract and leaves the tombstone unchanged.
- Restore of an already-active entity and restore of an unknown identifier use stable not-found/conflict semantics defined by the ADR.
- Generated persistence, application, HTTP, and Maven tests cover successful restore, conflict, hidden-by-default behavior, and idempotency/error paths.
- Goldens, ADRs, capability taxonomy, roadmap, and measured current state remain consistent.

## Execution tasks

1. Write and approve the capability contract and ADR, including endpoint shape, tombstone visibility, restore conflict semantics, and idempotency rules.
2. Extend semantic capability/profile configuration without leaking JPA or database concepts into Core.
3. Prepare adapter and template models for explicit include-deleted predicates and restore operations.
4. Implement the persistence/application flow with active-uniqueness checks and transactional restore behavior.
5. Add generated HTTP and persistence tests before implementation changes, then implement the minimal templates and producers.
6. Regenerate goldens and verify that the single-module profile and default active-only paths are unchanged.
7. Run typecheck, build, unit/integration tests, coverage, Java smoke suites, Maven reactor, and diff-scope review.
8. Update roadmap/current state and plan the following milestone only after all gates pass.

