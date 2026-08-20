# ADR-083: NestJS Collection Sorting

* Status: Accepted — milestone 7.18 release-complete; final gates passed
* Date: 2026-08-19
* Milestone: 7.18 (release-complete)

## Context

Generated NestJS collection endpoints previously supported CRUD, filtering, and
pagination, but they had no deterministic sort contract. Clients could not request
an ordered collection while preserving the existing response, filter, or page
semantics.

## Decision

The `nestjs-clean-architecture` profile accepts repeatable collection query values
using this exact syntax:

```text
sort=<property>:<direction>
```

The direction is exactly lowercase `asc` or `desc`. The generated Web API parser
uses a generated TypeScript property allowlist. Invalid, malformed, whitespace-
containing, or unknown values produce the existing structured HTTP 400 response.
Repeated `sort` values are retained in request order.

### Ownership and data flow

The ownership boundary is:

```text
HTTP sort query values
  -> generated Web API parser and property allowlist
  -> Core SortOrder[]
  -> immutable PageRequest.sort
  -> page query and gateway
  -> in-memory repository filter, sort, and page
  -> existing page result and HTTP response envelope
```

The Web API parser owns HTTP syntax and the public-field allowlist. Core owns the
technology-neutral `SortDirection`, `SortOrder`, and immutable `PageRequest.sort`
values. The persistence repository owns in-memory comparison and the
filter-then-sort-then-page ordering. Templates receive prepared values and render
artifact shape; they do not make semantic decisions.

### Determinism

Sorting evaluates repeated orders by precedence and uses the stable original index
within the filtered collection as the final tie-breaker. `null` and `undefined`
follow present values in both directions. Dates compare by epoch milliseconds,
numbers numerically, booleans as `false < true`, and other values with
locale-independent string comparison. An empty sort list preserves insertion order.

### Scope boundary and non-goals

This milestone does not add database or ORM ordering, nested properties, joins,
computed fields, configurable null ordering, case-insensitive ordering, a default
sort, a schema/profile option, or Java changes.

## Consequences

Sorting composes with the existing collection filter and pagination contract while
keeping the generated Core framework-free. The built CLI full profile emits `85`
files and `85 CREATE` operations. `GENERATED_PATHS` contains `85` unique entries and
matches the CLI output exactly. Two independent runs have zero byte mismatches.

The NestJS golden smoke passed `3/3`; the focused producer test passed `11/11`; and
the generated repository test passed `4/4` after the ascending nullish-last assertion
was added. Typecheck and build exited 0. Coordinator-verified final evidence after
the UUID v4 fixture fix includes `npm test` at 55 files/300 tests, coverage at 55
files/300 tests with 92.78% statements, 81.52% branches, 97.04% functions, and
93.58% lines, dependency-enabled generated-project smoke at 1 file/5 tests, NestJS
smoke at 1 file/3 tests after an elevated rerun following sandbox `spawn EPERM`, and
Java and Maven smokes at 1 file/1 test each. Coordinator-verified `git diff --check`
exited 0 with only LF/CRLF warnings.

## Alternatives rejected

- Making sorting decisions in templates was rejected because templates must remain
  render-ready and cannot own semantic policy.
- A permissive parser was rejected because malformed, whitespace-containing, and
  unknown values must use the existing structured HTTP 400 contract.
- An implicit or default sort was rejected because omitting `sort` must preserve
  insertion order.
- Database-specific ordering was rejected because this milestone supports the
  generated in-memory repository only and must keep comparison semantics
  deterministic across runtimes.
