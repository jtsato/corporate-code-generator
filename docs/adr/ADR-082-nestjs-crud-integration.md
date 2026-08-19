# ADR-082: NestJS CRUD Integration

* Status: Accepted
* Date: 2026-08-19
* Milestone: 7.17 (complete)

## Context

The NestJS Golden Path previously exposed create and read operations over HTTP. The
Core, in-memory persistence, and web-api producers already had the prepared concepts
needed for update, partial update, and delete. Task 8 completed the generated e2e
coverage and regenerated the expected output from the built CLI. The authorized native
generated-project gate then passed with generated dependencies installed and generated
build/Jest/e2e/HTTP CRUD checks.

The decision therefore records the behavior verified by local implementation, golden,
default, and native generated-project checks.

## Decision

The `nestjs-clean-architecture` profile exposes the following entity HTTP contract:

| Operation | Endpoint | Contract |
| --- | --- | --- |
| Collection read | `GET /<collection>` | Returns the existing page response with paging and `eq`/`ne` filtering. |
| Individual read | `GET /<collection>/{id}` | Returns the entity or `404` when it is not found. |
| Create | `POST /<collection>` | Creates the entity and returns `201`, the representation, and a `Location` header. |
| Full replacement update | `PUT /<collection>/{id}` | Replaces all mutable entity values and returns `200` with the updated representation. |
| Partial update | `PATCH /<collection>/{id}` | Applies only supplied mutable values and returns `200`; an empty patch is `400`. |
| Delete | `DELETE /<collection>/{id}` | Physically removes the entity and returns `204` with an empty body. |

The PUT request is full replacement semantics: the generated update request and Core
command validate the complete mutable representation, while the path identifier is
the identity of the entity being replaced. PATCH semantics are presence-based. The
web adapter includes a field only when the request owns that property, so omitted
fields remain unchanged and supplied fields are validated by the Core patch command.

Path identifiers arrive as HTTP strings and are normalized by the NestJS transformer
for the semantic identifier type before a Core use case is called. Numeric identifiers
become numbers, date/datetime identifiers become `Date` values, booleans accept their
string forms, and string/UUID identifiers remain strings. Invalid values are reported
as HTTP `400` through the generated validation contract.

Delete uses the generated in-memory repository's physical removal operation. It is
deliberately non-idempotent: a second delete, or a read after deletion, returns
`404` because the entity is no longer present.

Dependency-injection composition remains owned by `bootstrap` as decided by
[ADR-081](ADR-081-nestjs-composition-root-wiring.md). The generated entity module
binds the CRUD Core use cases and infrastructure providers to the web controller;
CRUD wiring is not moved into `web-api`. The generated e2e specification also remains
owned by `bootstrap`.

## Consequences

The one-entity NestJS example now produces 78 CREATE operations from the built CLI.
The measured dry-run selections, including transitive module dependencies, are:

| Selection | CREATE count |
| --- | ---: |
| Full profile | 78 |
| `build` | 5 |
| `core` | 43 |
| `infra-persistence` | 51 |
| `web-api` | 61 |
| `bootstrap` | 73 |

Task 8 added 21 generated golden files for the CRUD use cases, providers, and request
models. The golden smoke compares all 78 generated paths. The local evidence also
includes the default suite passing with 55 files and 298 tests, typecheck, build,
coverage, and the NestJS golden smoke passing.

The authorized command `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs`
passed with 1 file and 3 tests, including generated dependencies installed and generated
build/Jest/e2e/HTTP CRUD checks.

The follow-up regression check also proves that an entity containing only its identifier
renders the CRUD artifact set, including the PATCH generated test, without assuming a
mutable property. Java golden and Maven compile smokes passed after this correction.

## Non-goals

This decision does not add NestJS collection sorting, soft delete or restore, ORM or
database persistence, uniqueness, auditing, generated repository hygiene, container
packaging, CI, or an architecture-boundary lint. The current persistence implementation
remains in memory. Those capabilities remain future work and are not inferred from the
CRUD HTTP surface.
