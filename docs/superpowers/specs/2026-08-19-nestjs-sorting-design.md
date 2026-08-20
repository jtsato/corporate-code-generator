# NestJS Sorting Design

**Status:** Proposed for milestone 7.18

## Goal

Add deterministic collection sorting to the `nestjs-clean-architecture` Golden Path
without changing the existing response envelope, pagination, filtering, CRUD
semantics, or Java Golden Paths.

The generated endpoint will accept the same strict public syntax already established
by the Java multi-module Golden Path:

```text
GET /wallets?sort=balance:desc&sort=id:asc
```

Sort expressions are repeatable and are applied in request order. Supported directions
are exactly `asc` and `desc`; spaces, unknown fields, missing fields, extra segments,
and other directions are invalid and map to the existing HTTP 400 validation contract.

## Scope and non-goals

In scope:

- technology-neutral Core `SortDirection`, `SortOrder`, and `PageRequest.sort`;
- per-entity Web API parsing with an allowlist derived from generated entity properties;
- propagation through the generated page query and gateway;
- deterministic sorting in the generated in-memory repository;
- generated Core/parser tests, golden output, and native generated-project HTTP coverage;
- OpenAPI metadata for the repeatable `sort` query parameter;
- ADR, roadmap, capability taxonomy, and current-state updates.

Out of scope:

- database or ORM sorting;
- nested properties, joins, computed fields, null-ordering options, or case-insensitive
  sorting;
- a default sort when the client omits `sort`;
- sorting changes to either Java profile;
- model-schema changes or a new capability-selection option.

## Architecture

The data flow is:

```text
HTTP sort query values
  -> generated entity SortParser and field allowlist
  -> Core SortOrder[]
  -> PageRequest.sort
  -> Page<Entity>Query / IPage<Entity>Gateway
  -> in-memory repository filter, sort, and page
  -> existing PageResult and HTTP response envelope
```

The Core owns only the semantic sort value and validates that each order has a
non-blank property and a supported direction. The Web API owns HTTP syntax and the
public-field allowlist. The in-memory persistence adapter owns runtime comparison.
Templates receive prepared entity properties and render the representation; they do
not resolve semantic primitive types or invent sort policy.

`PageRequest` will remain immutable from the caller's perspective. Its constructor
will defensively copy the supplied sort array and default it to an empty list. An
empty sort list preserves the repository's current insertion order. When sorting is
requested, the repository will apply orders in sequence with a stable original-index
tie-breaker. Values compare as follows: `null`/`undefined` after present values,
`Date` by epoch milliseconds, numbers numerically, booleans as `false < true`, and
other values by deterministic string comparison.

The generated parser will accept a missing parameter as an empty list, a single
string, or the array NestJS produces for repeated query parameters. It will require
exactly two colon-separated segments and will preserve the supplied order. Entity
property names are the generated TypeScript property names, matching the existing
filter allowlist and in-memory entity representation.

## Generated artifacts

The Core producer will add application-scoped sort direction/order artifacts and a
per-entity sort-order test. The existing page request artifact will carry `sort` and
its test will cover defaults, defensive copying, and invalid sort orders.

The Web API producer will add one per-entity parser and parser test. The page request
DTO will add an optional repeatable `sort` field with an OpenAPI example. The
controller will pass parsed orders into `PageRequest`.

The persistence repository will sort the filtered collection before slicing it. The
generated project e2e test and repository smoke will assert ascending, descending,
repeated-order, filter-plus-sort, and invalid-sort behavior.

## Acceptance criteria

1. `GET /<collection>` with no `sort` behaves exactly as before.
2. `sort=<field>:asc` and `sort=<field>:desc` return the expected order.
3. Repeated sort parameters preserve precedence and are deterministic for ties.
4. Sorting composes with existing `page`, `size`, and `filter` parameters.
5. Unknown fields, malformed expressions, spaces, and invalid directions return the
   existing structured HTTP 400 response.
6. Generated Core contains no NestJS, `class-validator`, or persistence imports.
7. Generated output remains deterministic and the Java golden output is unchanged.
8. The full repository suite, NestJS golden smoke, generated-project gate, and Java
   non-regression smoke pass.
