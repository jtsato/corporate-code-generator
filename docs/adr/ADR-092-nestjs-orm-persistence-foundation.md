# ADR-092 — NestJS ORM Persistence Foundation

## Status

Accepted — Milestone 7.26.

## Context

The generated NestJS project stored everything in an array. Gap G8 in the
[NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) is the pivot of
that plan: it is the one gap that cannot be closed by copying the reference
project, because the reference has no database and no ORM at all, and it is the
gap milestones 7.27 and 7.28 are blocked on. Implementing tombstones or audit
columns against an in-memory array would produce behavior that has to be
rewritten once real storage arrives.

[ADR-084](ADR-084-nestjs-package-i18n-and-in-memory-uniqueness.md) declined to introduce
persistence technology absent from the reference. This milestone reverses that,
which is why it needed the plan's decisions N1, N2 and N3 approved rather than
assumed.

## Decision

### The `persistence` option, and the mechanism it required

[ADR-017](ADR-017-capability-taxonomy-and-profile-options.md) named "technology
options" as a category and left the mechanism to "a future profile-options
milestone". This is that milestone.

A profile may now declare options:

```yaml
options:
  - id: persistence
    values: [memory, typeorm]
    default: memory
```

`OptionResolver` turns the declarations plus the invocation's `--option id=value`
assignments into the complete set of values generation runs with. Every declared
option is present in the result, holding either the selection or the declared
default, so **no producer ever supplies a fallback of its own** — two producers
disagreeing about what "unset" means is precisely how one would emit TypeORM
artifacts while another emitted the in-memory wiring for the same run. Reading an
unresolved option throws.

Unknown ids and disallowed values are rejected with the allowed values in the
message, and every fault is reported at once. The CLI now prints an error's
`issues` as well as its summary, without which `OptionResolutionError` would
reach an operator as "Option resolution failed."

**The default stays `memory`.** Flipping it is a separate decision, because the
default is what `npm test` and the generated-project gate run without a database
or a container runtime.

### The option changes eighteen files and no others

Sixteen files change and two are added. The mapper and all five gateway providers
are **byte-identical between the two options**, which is the ADR-057 mapper
boundary earning its keep: swapping the storage technology reaches the entity and
the repository and stops there.

That claim is enforced rather than asserted. Goldens for the TypeORM variant are
stored as the *difference* from the default generation, and
`tests/smoke/nestjs-typeorm-persistence.smoke.test.ts` asserts that the set of
files the option changes equals exactly the declared set. A template that quietly
began branching on the option fails there instead of drifting unreviewed.

### Portable column types, which are fewer than they look

The entity declares **no `type`** for string, uuid, boolean, date and datetime
columns. This is the milestone's least obvious decision and it is forced:
`timestamp` is rejected by the SQLite driver and `datetime` by the PostgreSQL
one, so **no single spelling of a date column works on both engines**. The only
portable choice is to let each driver normalize the reflected TypeScript type,
which makes `emitDecoratorMetadata` load-bearing rather than incidental.

Where inference is wrong the type is named: `integer` for `int32`, `bigint` for
`int64`, and unconstrained `numeric` for `decimal` — no precision or scale, so a
write never truncates. `bigint` and `numeric` come back from `pg` as **strings**
and from SQLite as numbers, so both carry a transformer that makes the property a
`number` on either engine. Without it a balance would serialize as `125.5` in
tests and `"125.5"` in production, and the SQLite-backed suite would never see
it. The narrowing to float64 is the precision the model's own `number` mapping
already commits to.

### The repository preserves the observable contract, not the implementation

The TypeORM repository exposes the same seven methods as the in-memory one, which
is why the providers do not change. Three places needed deliberate work to keep
the REST contract identical rather than merely similar:

- **`NULLS LAST` in both directions.** SQL orders nulls by dialect; the contract
  puts absent values last however the page is sorted.
- **A total order.** The identifier is appended as a final sort key, because
  without one two requests for the same page can disagree about which rows belong
  to it. It is appended only when the caller did not already sort by the
  identifier: TypeORM keys `ORDER BY` clauses by expression, so appending
  unconditionally *replaces* the caller's direction. The generated test caught
  this — a descending sort by id came back ascending.
- **`CAST(column AS TEXT)` for filters.** Filter values arrive as strings and the
  in-memory adapter compares them as strings. Without the cast PostgreSQL rejects
  `numeric = text` outright, and the two options would disagree about what a
  filter means.

### Property names are allowlisted inside the repository

A filter or sort field reaches SQL as an identifier, which cannot be
parameterized. The generated parsers already reject unknown names with a 400, so
no HTTP request can reach the check — it exists because the repository is a
public class and an allowlist is what stands between a name passed from code and
an injected fragment. Unknown names throw rather than degrading silently.

### SQLite through `sql.js`, not `better-sqlite3`

Decision N2 called for in-memory SQLite. `better-sqlite3` is the usual choice and
was rejected: it has an `install` script that compiles a native binary, and npm
no longer runs install scripts unattended. A generated project must survive
`npm install && npm test` on a machine with no build toolchain, and `sql.js` is
pure WebAssembly with no install script at all. It ships as a **development**
dependency; production talks to PostgreSQL and the runtime image prunes it.

`DATABASE_DRIVER` selects between them, `.env.test` names `sqljs`, and a
`setupFiles` entry sets `NODE_ENV=test` before the end-to-end suite imports
`AppModule` — an assignment inside the suite would run after its imports.

### Synchronizing a production schema is refused

`DATABASE_SYNCHRONIZE=true` with `NODE_ENV=production` fails the boot.
Synchronizing is how a renamed attribute drops the column that still holds its
data. The consequence is real and stated rather than hidden: **this project
generates no migrations, so a production deployment needs a migration step it
does not provide.** Compose therefore runs the image in development mode, which
is honest about what Compose is for here — local work and the CI check, not a
deployment.

## Consequences

- The default profile is unchanged: 106 CREATE operations, byte-identical to the
  goldens 7.25 approved. The TypeORM variant emits 108.
- `GenerationRequest` gains a required `options` map. Every producer for every
  profile receives it; only the NestJS producers read it so far.
- Four new gates, or extensions of existing ones: the persistence-option smoke
  (8 cases), the boundary smoke run against both options (7 → 13 cases), the
  packaging smoke extended with Compose and workflow agreement (10 → 14 cases),
  and a TypeORM generated-project execution gate (4 cases) behind
  `npm run smoke:generated-project-typeorm:nestjs`.
- The generated project gains `typeorm`, `@nestjs/typeorm` and `pg` as
  dependencies and `sql.js` as a development dependency, only under the option.
- **PostgreSQL is configured but has never been connected to.** No container
  runtime and no database server were available on the build machine. Everything
  proven here ran against SQLite. The generated CI workflow now brings up the
  Compose stack, which is where that verification will first happen — in a
  consumer's repository, since that workflow has still never executed.

## Alternatives considered

- **Prisma.** Rejected under N1: its schema file is a second source of truth
  outside the Application Model, and its client puts generated code inside
  generated code.
- **MikroORM.** Rejected under N1: closest to JPA semantics, materially smaller
  ecosystem, no capability gain.
- **Replacing the in-memory adapter instead of adding an option.** Rejected under
  N3. The in-memory adapter is what lets the generated-project gate run with no
  database and no container runtime, which is the only reason this milestone
  could be verified end to end at all.
- **A separate profile, as the Java multi-module path did.** Rejected: this
  changes the implementation inside a capability, not the physical module
  structure, which is exactly the distinction ADR-017 drew between a technology
  option and a profile.
- **Constructor parameter properties on the entity.** Not possible: `@Column` is
  a property decorator and cannot be applied to a constructor parameter. The
  entity declares its properties and assigns them in a constructor the mapper
  uses; TypeORM bypasses that constructor when hydrating.
- **`@CreateDateColumn` and friends now.** Deferred to 7.28, which decision N8
  already settled in favour of a Core clock port.
- **Testcontainers against real PostgreSQL.** Deferred exactly as the Java path
  deferred it to 6.49, and for the same reason: it is its own opt-in milestone.

## Validation

Typecheck and build exit 0. `npm test` 59 files / 348 tests. NestJS golden smoke
3/3; boundary smoke 13/13; packaging and CI smoke 14/14; persistence-option smoke
8/8; `CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs` 8/8;
`CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project-typeorm:nestjs`
4/4. Two consecutive generations were byte-identical under both options, and the
identifier-only example emits the same counts as the wallet example under both.

The TypeORM generated project was installed, linted, built, and run: **78
generated unit tests and 4 generated end-to-end tests pass**, and the compiled
server served the full CRUD, paging, sorting and filtering contract over HTTP
against SQLite.

The new gates were proven non-vacuous by making the mapper branch on the option,
which failed exactly the two cases that assert it does not, and by breaking the
Compose credentials and the `depends_on` condition, which failed exactly the two
cases that assert those agree. Goldens were derived by copying built-CLI output.
