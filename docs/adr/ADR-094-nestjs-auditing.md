# ADR-094 — NestJS Auditing

## Status

Accepted — Milestone 7.28.

## Context

Gap G10 in the [NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) is
`createdAt`/`updatedAt` tracking, mirroring Java's milestone 6.35
([ADR-055](ADR-055-auditing-created-updated-at.md)). Decision N8 settled the one
question that mattered up front: the timestamps come from a **Core clock port**,
not from TypeORM's `@CreateDateColumn`/`@UpdateDateColumn`.

The Application Model already carried `audited: boolean` — parser, schema and
semantic validation accepted it from 6.35 onwards — so nothing in `core` changed.
This milestone is entirely a NestJS adapter and template-pack change.

## Decision

### Opt-in per entity, and free when it is not asked for

`audited: true` is declared on an entity, exactly as in 6.35. Most entities do
not need two extra columns, and a profile-wide switch would contradict the
minimal-surface precedent that `unique`, `uniqueGroups` and soft delete set.

The load-bearing consequence is that a model which does not ask for auditing must
generate **exactly** what it generated before. That is not left to inspection:
`examples/nestjs-audited-wallet-service` is deliberately identical to
`examples/nestjs-wallet-service` apart from the flag, its golden is stored as the
*difference* between the two generations, and
`tests/smoke/nestjs-auditing.smoke.test.ts` asserts that the difference is
exactly three added files and fifteen changed ones.

### A clock port in the Core, injected

`src/core/common/time/clock.ts` declares `IClock`, its injection symbol, and a
`SystemClock` that returns `new Date()`. The concrete implementation lives in the
Core rather than in the persistence adapter: it depends on nothing but a
JavaScript builtin — the same latitude the Core already takes with `Date` in its
own models — and routing a one-line wrapper through infrastructure would add a
hop for no architectural gain. The generated boundary lint still passes, because
what it forbids in the Core is `@nestjs/*` and `class-validator`.

The port is what makes N8's rationale real: the create use case reads
`this.clock.now()` rather than calling `new Date()`, so a generated test can say
what "now" was. An assertion about a timestamp the production code invented is
either tautological or flaky.

**One clock per application, not per entity.** The port, its test, and
`ClockModule` are emitted once, gated on "some entity is audited". Two audited
entities reading two independent clock instances would be harmless today and
confusing the moment anyone wanted to control time.

### One reading for a creation

`Create{Entity}UseCase` reads the clock **once** and assigns the same value to
both fields. A fresh record is defined to have identical timestamps, and two
readings would make that untrue at sub-millisecond resolution. The generated test
asserts `createdAt === updatedAt` by identity, not by proximity.

### The Core never supplies a creation timestamp on a write

Update and patch construct the domain object with `createdAt: null` and a fresh
`updatedAt`. `Update{Entity}Provider` — which already loads the stored row to
apply the update — writes the original value back. Fetching it in the Core would
be a second read for a value the adapter is already holding.

Patch passes `null` even though it has `current` in hand, so that update and
patch state the same rule and there is exactly one place that decides what a
creation timestamp survives.

This makes the Core model's `createdAt` a `Date | null`. **Null says "not
supplied"**; a plausible-but-wrong value would be worse, which is the same
judgement `toTombstone` makes about a fabricated deletion date. The nullability
is transient — every object that comes back from a gateway carries a real value —
and the presenter throws rather than rendering `null`, because a null there means
the adapter failed to preserve.

### Plain ORM columns

The TypeORM entity uses `@Column({ name: 'created_at' })` and `updated_at`, not
the ORM's own date columns, per N8. They declare no `type` for the same reason
every other column does not: no spelling of a date column is accepted by both
PostgreSQL and SQLite ([ADR-092](ADR-092-nestjs-orm-persistence-foundation.md)).

### A soft-delete defect this milestone surfaced and fixed

Composing auditing with the TypeORM option exposed a real 7.27 bug. Creating an
entity whose identifier belonged to a **tombstone** behaved differently in the two
adapters: TypeORM's `save` wrote over the deleted row and left it deleted — the
API answered 201 for a record that stayed invisible — while the in-memory adapter
appended a second row sharing the identifier.

Neither is right. Soft delete releases a unique *business* value; it never
releases the identifier, because the row holding it still exists and restore is
how it comes back. Both repositories now expose `existsAnyById`, tombstones
included, and the create provider uses it, so creating over a tombstone is a
conflict under either option. This is exactly the divergence
[ADR-092](ADR-092-nestjs-orm-persistence-foundation.md) says the option must not
have, and it was invisible until two capabilities were combined.

## Consequences

- The audited example emits **130** CREATE operations against the default
  option's 127, and **132** against `typeorm`'s 129. A non-audited model is
  unchanged at 127 and 129.
- Auditing adds three files and rewrites fifteen. Nine of the fifteen are Core;
  no request model is among them, because neither timestamp is ever client input.
- The generated end-to-end suite compares audited responses field by field and
  requires only that the timestamps parse, then asserts across a `PUT` that
  `createdAt` survives and `updatedAt` advances — the one part of this contract no
  unit test can establish.
- `existsById` remains active-only, because updating a tombstone must still be a
  404. `existsAnyById` is the deliberate exception.
- Auditing composes with both persistence options and with soft delete; all four
  combinations were generated, built and run.
- Not included, following ADR-055's scope boundary: who changed a record,
  configurable clock zones, audit trails, and optimistic locking.

## Alternatives considered

- **`@CreateDateColumn`/`@UpdateDateColumn`.** Rejected by N8 before this
  milestone began: the database would own the value, generated tests could only
  assert that *something* was written, and the in-memory option would have to
  imitate a behavior it cannot observe.
- **A profile-wide or application-wide auditing switch.** Rejected, following
  ADR-055: it would put two columns on every entity that never asked for them.
- **Re-reading the stored `createdAt` in the update use case.** Rejected: a
  second read for a value the adapter already holds, and it would put a
  persistence concern in the Core.
- **Passing `current.createdAt` from patch, which has it.** Rejected: update and
  patch would then state different rules for the same field, and the adapter
  preserves it either way, so the value patch supplied would be ignored.
- **A non-nullable `createdAt` with a placeholder on updates.** Rejected: a
  plausible wrong value hides the fact that nothing supplied one, which is the
  failure mode `null` exists to make loud.
- **`@Global()` for the clock module.** Rejected: an explicit import in each
  audited entity module documents the dependency where it is used.
- **Auditing the tombstone view.** Rejected: Java's tombstone carries only
  business fields and `deletedAt`, and the deleted-only routes stay
  contract-comparable.

## Validation

Typecheck and build exit 0. `npm test` 60 files / 357 tests. NestJS golden smoke
3/3 over 127 generated paths; boundary smoke 13/13; packaging and CI smoke 14/14;
persistence-option smoke 8/8; **auditing smoke 7/7**;
`CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs` 9/9; and
its TypeORM counterpart 5/5.

All four combinations of model and persistence option generate byte-identically
across two runs, and the identifier-only example is unchanged at 127 and 129.

Both audited projects were installed, linted, built and run: the in-memory one
passes **83 generated unit tests and 5 end-to-end tests**, the TypeORM one **91
and 5**.

Non-vacuity was proven by deleting the single line that preserves the creation
timestamp in a scratch copy of the generated project, which failed exactly the
CRUD end-to-end case and nothing else; the file was then restored. The
tombstoned-identifier defect above was itself found this way — by running the
audited end-to-end suite against the TypeORM option, where it appeared as a `PUT`
answering 404 after a `POST` had answered 201.
