# ADR-084: NestJS Package-Backed i18n and In-Memory Uniqueness

* Status: Accepted — milestone 7.19 release-complete
* Date: 2026-08-23
* Milestone: 7.19

## Context

The NestJS Golden Path had deterministic English and Portuguese messages implemented as a
static TypeScript map, but it did not follow the package-backed i18n convention used by the
local `nestjs-clean-architecture-example` reference. It also accepted duplicate identifiers
and did not yet apply the Application Model's `unique` and `uniqueGroups` declarations to its
in-memory persistence adapter.

The reference project uses NestJS, TypeScript, `nestjs-i18n`, JSON catalogs, an
`AcceptLanguageResolver`, and in-memory persistence. It does not use an ORM or a database.
This milestone must preserve that established stack rather than introduce a persistence
technology that is absent from the reference.

## Decision

The `nestjs-clean-architecture` profile adopts the following behavior.

### i18n

- Generated runtime dependencies include exactly `nestjs-i18n` version `10.6.0`, matching the
  established reference project.
- English and Portuguese catalogs are generated as
  `src/web-api/i18n/en/messages.json` and `src/web-api/i18n/pt/messages.json`.
- `I18nJsonLoader` and `AcceptLanguageResolver` are configured with English as the fallback;
  language tags beginning with `pt` resolve to the Portuguese catalog.
- The Nest CLI copies the catalogs as build assets, and the generated TypeScript configuration
  enables JSON module support.
- The Core owns only the framework-free `II18nService` contract and its symbol. The concrete
  adapter belongs to `web-api` and is the only layer that imports `nestjs-i18n`.
- Validation, not-found, and conflict filters are registered as request-scoped global filters,
  so request locale resolution through `I18nContext` is valid for HTTP handling.

### Uniqueness

- Every generated in-memory repository exposes `existsById`; create rejects a duplicate
  identifier with HTTP 409.
- An attribute with `unique: true` is checked against existing non-null values before create and
  update.
- Every `uniqueGroups` tuple is checked only when all candidate members are non-null or
  non-undefined. This follows the portable composite-unique null behavior already established
  by the Java Golden Path.
- Update and PATCH uniqueness checks ignore the record identified by the current identifier, so
  retaining an entity's own values is valid.
- A conflict raises the framework-free Core `ConflictException` with a stable message key and
  default message. The Web API filter returns HTTP 409 and resolves the message through the
  generated catalog.
- Identifier uniqueness is separate from attribute and composite uniqueness. An identifier-only
  entity therefore receives the identifier guard without generating attribute checks.

## Ownership and data flow

```text
Application Model unique / uniqueGroups
  -> NestJsEntityTransformer uniqueness metadata
  -> in-memory repository predicates
  -> Core ConflictException
  -> web-api i18n-aware HTTP filter
  -> HTTP 409 response
```

Templates receive prepared uniqueness metadata and render artifact shape. They do not resolve
semantic model declarations themselves. No `nestjs-i18n`, NestJS, or validation-library import
is introduced into generated Core.

## Consequences

The one-entity wallet profile emits 90 files and 90 CREATE operations. The measured
transitive selections are:

| Selection | CREATE count |
| --- | ---: |
| Full profile | 90 |
| `build` | 5 |
| `core` | 49 |
| `infra-persistence` | 58 |
| `web-api` | 72 |
| `bootstrap` | 85 |

The generated project remains in-memory. DELETE is still physical, soft delete and restore are
not generated, and uniqueness values cannot yet be reused after a tombstone because tombstones
do not exist in this path. ORM/database persistence remains outside this decision.

## Validation evidence

- `npm run typecheck` and `npm run build` passed.
- `npm test` passed with 55 files and 301 tests.
- `npm run test:coverage` passed with 92.92% statements, 82.05% branches, 97.08% functions,
  and 93.72% lines.
- `npm run smoke:nestjs` passed with 1 file and 3 tests, comparing all 90 generated paths.
- With `CODEGEN_REQUIRE_NPM_SMOKE=true`, `npm run smoke:generated-project:nestjs` passed with
  1 file and 5 tests, including generated build, Jest, e2e, localized validation, and duplicate
  unique-value HTTP conflict behavior.
- Generated identifier-only output passed `nest build`, 42 Jest tests, and 3 e2e tests.
- Generated composite-unique output passed `nest build`, 48 Jest tests, and 3 e2e tests;
  partial PATCH and Portuguese duplicate conflict behavior passed.
- Two independent full-profile generations were byte-identical, and all generated relative
  imports resolved for the tested module selections.

## Non-goals

This decision does not add an ORM, a database, soft delete, restore, auditing, CORS or
configuration profiles, generated repository hygiene, container packaging, CI generation,
advanced locale features beyond the English/Portuguese catalogs, or an architecture-boundary
lint.

## Alternatives rejected

- Adding TypeORM, Prisma, or another ORM was rejected because the established reference uses
  in-memory persistence and the milestone does not require a new persistence stack.
- Keeping the static message map was rejected because it would continue to diverge from the
  reference's `nestjs-i18n` and JSON-catalog convention.
- Treating identifier uniqueness as an optional `unique` attribute was rejected because an
  entity identifier is inherently unique and the Java Golden Path already guards it separately.
- Returning HTTP 400 for uniqueness conflicts was rejected in favor of HTTP 409, matching the
  Java Golden Path and the generated conflict semantics while intentionally differing from the
  reference example's older filter status.
