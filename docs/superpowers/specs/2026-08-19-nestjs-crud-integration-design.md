# NestJS CRUD Integration Design

**Status:** Approved for implementation

## Goal

Evolve the `nestjs-clean-architecture` Golden Path from create/read to a complete in-memory CRUD surface while preserving the generator's framework-free Core, deterministic output, and `bootstrap` composition root.

## Context

The current NestJS path generates:

- `POST /<collection>`;
- `GET /<collection>` with paging and `eq`/`ne` filtering;
- `GET /<collection>/<id>`;
- health checks, Swagger UI, response envelopes, validation, i18n, and generated Jest/Supertest tests.

The reference at `C:\Dev\99-sandbox\nestjs-clean-architecture-example` provides useful conventions for ports, use cases, mappers, in-memory repositories, testable controllers, and explicit dependency injection. It is not itself a CRUD implementation and its Core contains framework imports in places where this generator must remain framework-free. The reference is therefore guidance for structure and testing, not a source to copy literally.

## Scope

Add, for every generated entity:

- full replacement update through `PUT`;
- partial update through `PATCH`;
- physical delete through `DELETE`;
- Core commands, validators, use cases, gateways, and unit tests;
- in-memory repository update/delete operations and providers;
- HTTP request models, controller methods, OpenAPI metadata, and composition-root wiring;
- generated e2e coverage for the complete CRUD lifecycle;
- golden files, smoke assertions, ADR, roadmap, current-state, quality-gate, and capability documentation updates.

The persistence technology remains the existing in-memory adapter. The Java Golden Paths are not changed.

## Non-goals

This milestone does not add:

- sorting;
- soft delete or restore;
- database, ORM, or migrations;
- attribute/composite uniqueness or `409` conflict behavior;
- optimistic locking, ETags, `If-Match`, bulk delete, or JSON Patch;
- changes to the Application Model/IR;
- generated README, `.gitignore`, CI, or containerization for NestJS.

## HTTP contract

| Method | Endpoint | Behavior |
| --- | --- | --- |
| `GET` | `/<collection>` | Existing paged/filterable collection read; `200`. |
| `GET` | `/<collection>/<id>` | Existing individual read; `200`, invalid ID `400`, absent entity `404`. |
| `POST` | `/<collection>` | Existing create contract; `201`, `Location`, and created representation. |
| `PUT` | `/<collection>/<id>` | Full replacement; body contains mutable attributes only; path ID is authoritative; `200` with updated representation; absent entity `404`. |
| `PATCH` | `/<collection>/<id>` | Partial update; body contains optional mutable attributes only; omitted fields remain unchanged; `200` with updated representation; absent entity `404`. |
| `DELETE` | `/<collection>/<id>` | Physical in-memory deletion; `204` with no body; absent or repeated deletion `404`. |

The existing response envelope remains in use. No `{ data: ... }` wrapper is introduced.

## Update and validation semantics

- `PUT` is not an upsert. It validates every mutable required field and replaces the current entity identified by the path.
- `PATCH` is not JSON Patch. It is a plain JSON object containing zero or more mutable attributes.
- An empty `PATCH` is rejected with `400`.
- The identifier is never taken from the update body. The generated DTOs omit it, and the existing NestJS whitelist behavior remains unchanged for unexpected properties.
- A supplied field is validated using the same semantic primitive rules used by the existing Core validation.
- A required field supplied as `null` is rejected. Optional-field nullability is not expanded in this milestone because the Application Model has no explicit `nullable` concept; PATCH changes are therefore represented by supplied non-null values.
- The generated controller distinguishes omitted PATCH properties from supplied properties before constructing the Core command.
- Delete is deliberately non-idempotent: after a successful delete, repeating the same request returns `404`, matching the accepted Java REST behavior.

Path identifiers continue to use the semantic primitive type selected by the adapter. The adapter must normalize path values for the primitive types it supports before Core validation so numeric and date-like identifiers do not rely on NestJS's TypeScript-only parameter annotation.

## Generated architecture

The generated dependency direction remains:

```text
bootstrap -> web-api -> core
bootstrap -> infra-persistence -> core
```

### Core

For each entity, generate:

- `Update<Entity>Command`, validator, gateway, use-case interface, use case, and test;
- `Patch<Entity>Command`, changes type, validator, use-case interface, use case, and test; the use case reuses the existing find-by-ID gateway and the shared update gateway;
- `Delete<Entity>Command`, gateway, use-case interface, use case, and test.

The update gateway is shared by PUT and PATCH. The PATCH use case reads the current entity through the existing find-by-ID gateway, applies only supplied changes, then delegates the resulting entity to the shared update gateway. Core files must contain no `@nestjs/*`, `class-validator`, or `class-transformer` imports.

### Infra persistence

Extend the generated repository with:

- `updateById`, returning the updated entity or `undefined`;
- `deleteById`, returning whether an entity was removed.

Add providers that map persistence entities to and from the existing domain model and implement the Core update/delete gateways. An update or delete against a missing identifier must not create a record or mutate another record.

### Web API

Extend the existing entity controller with `PUT`, `PATCH`, and `DELETE` methods. Generate separate update and patch request models that exclude the identifier. Use the existing presenter, response builder, validation filters, not-found filter, response transformer, and OpenAPI conventions.

### Bootstrap

Extend the existing per-entity module in `bootstrap` with the update and delete provider bindings and use-case factories. Do not move dependency-injection wiring back into `web-api`.

## Test strategy

The implementation follows red-green-refactor cycles:

1. add focused failing tests for Core commands/use cases, repository operations, producer template IDs, and generated HTTP behavior;
2. run each focused test and confirm the failure is caused by the missing CRUD behavior;
3. implement the smallest change that makes the test pass;
4. regenerate goldens from the built CLI, then run the complete relevant gates.

Required verification includes:

```text
npm run typecheck
npm run build
npm test
npm run smoke:nestjs
CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs
```

The generated e2e lifecycle must prove create, collection read, read by ID, PUT, PATCH, DELETE, not-found after delete, invalid input, and the expected `201`/`200`/`204`/`400`/`404` statuses. Golden tests must continue to prove deterministic output and Core framework purity.

## Documentation and compatibility

Create ADR-082 for the NestJS CRUD contract and update:

- `ROADMAP.md` with the completed Phase 7 milestone;
- `docs/project/CURRENT-STATE.md` with the new REST surface, counts, and validation evidence;
- `docs/project/QUALITY-GATES.md` with the CRUD generated-project coverage;
- `docs/target-architecture/CAPABILITY-TAXONOMY.md` with current NestJS CRUD support;
- `README.md` to remove CRUD from the NestJS gap list.

The `nestjs-clean-architecture` profile manifest remains unchanged. Existing Java output and the single-module Java profile must remain byte-compatible.
