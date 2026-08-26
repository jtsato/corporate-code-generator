# ADR-093 — NestJS Soft Delete and Restore

## Status

Accepted — Milestone 7.27.

## Context

The generated NestJS project removed rows physically. Gaps G9 and G10 in the
[NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) were both blocked
on real persistence, which [ADR-092](ADR-092-nestjs-orm-persistence-foundation.md)
delivered. Decision N7 approved mirroring the Java REST contract exactly — same
routes, same deleted-only semantics, same restore command, same conflict
behavior — so the two Golden Paths stay contract-comparable.

The Java precedent is [ADR-052](ADR-052-soft-delete-active-uniqueness.md) for the
tombstone and active uniqueness, and [ADR-053](ADR-053-restore-include-deleted-queries.md)
for the explicit deleted-only routes and restore.

## Decision

### The capability is unconditional, under both persistence options

N7 spoke only about the TypeORM implementation, which left open whether soft
delete should exist under the in-memory default. It does, and that is the first
decision this milestone had to make.

ADR-092 established that **the `persistence` option must not change the REST
contract** and put a gate behind it. A capability that existed only under
`typeorm` would break that immediately: the same model would answer 404 or 200 on
`GET /wallets/deleted` depending on a flag that is supposed to be an
implementation detail. So both adapters implement it, and the option's footprint
is unchanged — still sixteen files rewritten and two added, with the three new
providers and the entire tombstone model byte-identical between them.

### No `deletionScope` column

Java carries a non-null `deletionScope` alongside `deletedAt` so a composite
database unique constraint can scope uniqueness to active rows. **NestJS does not
need it.** Uniqueness here is enforced by the provider, not by a constraint, so
scoping the *query* to active rows is the whole mechanism: `hasUniqueConflict`
skips tombstones, and a deleted row's unique value is released.

The honest cost: there is no database-level guarantee behind it. Java's
constraint also protected concurrent writers, and the NestJS precheck has a race
window. That window is not new — the precheck has always been the only
enforcement here — but soft delete does not close it either. The generated
TypeORM entity declares no unique index at all today; adding one is its own
decision, and a *conditional* one is not portable across the two engines this
path supports.

### `@DeleteDateColumn`, and what it buys

The TypeORM entity marks the column with `@DeleteDateColumn`, so every ordinary
query, `findOne` and `existsBy` exclude tombstones without being told to, and
`withDeleted()` is the explicit opt-out the deleted-only routes use. Hiding a
tombstone becomes a property of the mapping rather than something each new query
has to remember.

Two places still need care, and both are commented in the generated code:

- **`update` does not apply the soft-delete filter.** Restore depends on that —
  it has to write to a row the ordinary queries cannot see. But it also means
  `softDeleteById` must check the row is active first, or a repeated `DELETE`
  would report a row affected and answer 204 where the contract says 404.
- **The timestamp is supplied by the caller**, not by `softDelete()`. The
  provider reads the clock and passes it in, so both adapters stamp a tombstone
  from the same place. Milestone 7.28 introduces the Core clock port that
  decision N8 chose for auditing; when it lands, this is one seam to replace
  rather than two. Java made the same ordering choice — 6.32 before 6.35.

### Restore distinguishes three cases

The gateway returns false only when **no row carries the identifier**, which the
use case turns into 404. The adapter raises a conflict for the other two:

- the row is **already active** — a refusal, not an absence; answering 404 would
  claim a record that plainly exists does not;
- the unique value it held has been **taken by a new active row** — restoring
  anyway would put two active rows on the same value, which is exactly what soft
  delete released it for.

### A separate tombstone model, and route ordering

`{Entity}Tombstone` is a Core model of its own — business fields plus
`deletedAt` — with its own response and page response. Adding a nullable
`deletedAt` to the ordinary model would put a value on every response that is
always null for every caller not asking about tombstones.

`GET /{entities}/deleted` and `GET /{entities}/deleted/{id}` are declared
**before** `GET /{entities}/{id}`. Nest matches in declaration order, so the
reverse order makes `/deleted` an identifier: the validator would answer 400 for
the literal string. The generated end-to-end suite fails if the order is
inverted, which was verified by inverting it.

## Consequences

- The full-profile example rises from 106 to **127** CREATE operations under the
  default option and from 108 to **129** under `typeorm`. Per module: `core`
  49 → 64, `infra-persistence` 58 → 76, `web-api` 75 → 93, `bootstrap` 90 → 111;
  `build` unchanged at 16.
- `deleteById` is gone from both repositories, replaced by `softDeleteById`,
  `restoreById`, `findAnyById`, `findDeletedById` and `findDeletedPage`. Every
  active-only read now filters on the marker.
- Twenty-one artifacts per entity are new: a tombstone model, three use cases
  with their commands, gateways, interfaces and tests, three tombstone web
  artifacts, and three providers.
- The generated end-to-end suite gains a soft-delete case, and both repository
  suites gain five.
- Authorization is deliberately absent, as in ADR-053: the deleted-only and
  restore routes are administrative in character but are not access-controlled.
  A consumer who needs that adds it outside the generated code.
- Bulk or cascade delete, purge, and retention policy remain out of scope.

## Alternatives considered

- **A boolean `includeDeleted` query parameter.** Rejected, following ADR-053:
  too easy to set accidentally, and it mixes administrative visibility into
  ordinary filters.
- **Exposing `deletedAt` on the ordinary model and response.** Rejected: it
  leaks a persistence concern into every active read.
- **Soft delete only under `persistence=typeorm`.** Rejected; see above. It would
  make the option change the REST contract, which ADR-092 forbids and gates.
- **Porting Java's `deletionScope`.** Rejected: it exists to scope a database
  constraint that this path does not have. Carrying it would add a column with no
  reader.
- **`@SQLDelete`-style interception instead of explicit methods.** Not available
  in this shape; `@DeleteDateColumn` already provides the read-side filtering,
  and the write side is explicit so the timestamp source stays visible.
- **Taking the deletion timestamp from `softDelete()`.** Rejected: the two
  adapters would then stamp from different clocks, and 7.28 would have two seams
  to replace instead of one.

## Validation

Typecheck and build exit 0. `npm test` 59 files / 348 tests. NestJS golden smoke
3/3 over 127 generated paths; boundary smoke 13/13 across both options;
packaging and CI smoke 14/14; persistence-option smoke 8/8;
`CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs` 9/9; and
its TypeORM counterpart 5/5. Two consecutive generations were byte-identical
under both options, and the identifier-only example emits the same counts as the
wallet example under both.

Both generated projects were installed, linted, built and run. The in-memory one
passes **84 generated unit tests and 5 end-to-end tests**; the TypeORM one passes
**87 and 5**, its repository suite driving a real SQL engine. The full contract
was also exercised by hand over HTTP: delete answers 204 and hides the row,
repeated delete 404, `/deleted` and `/deleted/{id}` return the tombstone with its
timestamp, restore answers 204, restoring an active record 409, restoring an
unknown identifier 404, and `/deleted/{id}` on an active record 404.

The new assertions were proven non-vacuous twice: inverting the controller's
route order failed exactly the soft-delete end-to-end case, and replacing the
in-memory soft delete with a physical `splice` failed exactly three repository
cases and the same end-to-end case. Both injections were made in a scratch copy
of the generated project, not in the templates. Goldens were derived by copying
built-CLI output.
