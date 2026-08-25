# ADR-087 — NestJS Environment Configuration and CORS

## Status

Accepted — Milestone 7.22.

## Context

The generated NestJS project read exactly one environment variable, `PORT`, directly
from `process.env` in `main.ts`. It had no configuration files, no validation, and no
CORS policy. The Java Golden Path settled both at milestone 6.4
([ADR-026](ADR-026-configuration-profiles-and-cors-policy.md)) with profile-specific
`application-{local,test,prod}.yaml` and property-driven CORS.

The local reference project has `@nestjs/config` with a single `.env` file and no
per-environment split, and no CORS configuration at all. Gaps G3 and G4 in the
[NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) therefore adopt the
reference's library while going beyond it on structure, which decisions N4 and N5
approved.

## Decision

### Environment files

- The `build` module emits `.env.example`, `.env.development`, `.env.test` and
  `.env.production`. `ConfigModule.forRoot` loads `['.env', '.env.${NODE_ENV}']`,
  and `@nestjs/config` gives precedence to the earlier entry, so an uncommitted
  `.env` overrides the committed per-environment default.
- **The plan named these files `.env.{local,test,production}`; the shipped names are
  `.env.{development,test,production}`.** Two reasons. The `.local` suffix is
  reserved by strong convention (Vite, Next.js) for the *uncommitted* override,
  so a committed `.env.local` inverts what every reader expects. And milestone
  7.20's generated `.gitignore` ignored `.env.*`, which would have left all three
  files untracked in the consumer's repository — a generated file nobody can commit.
  That ignore rule is narrowed here to `.env` and `.env*.local`.
- The committed files hold no secrets. `.env.production` ships with an **empty**
  origin list rather than a permissive one, so an unconfigured production
  deployment rejects cross-origin browser calls instead of accepting all of them.
  `.env.development` allows `*`, which is legal only because credentials are off.

### Validation

- `src/config/environment.ts` exports a pure, framework-free `validateEnvironment()`
  that turns raw strings into a typed `Environment`, or throws an
  `EnvironmentValidationError` carrying **every** problem found — fixing one variable
  per restart is a poor loop.
- It rejects values that are *wrong*, not values that are merely unset: absent
  variables fall back to a documented default. No variable is currently mandatory,
  because nothing in the generated application is yet a secret or an external
  address. Milestone 7.26 introduces the first genuinely required key, and the
  accumulating shape is already there for it.
- The wildcard-plus-credentials combination is rejected at boot, mirroring the same
  check in the Java `CorsProperties` record. Browsers reject that pairing anyway, so
  a deployment that sets it has CORS that silently never works.
- Validation is not wired through `ConfigModule`'s `validate` option. The validated
  object is provided under `EnvironmentSymbol` by an eagerly instantiated factory in
  the composition root, so failure still happens inside `NestFactory.create`, before
  the server listens. See the first trap below for why.

## Two traps this milestone hit, and why they are recorded

Both produced a *working, silent* misconfiguration rather than an error, and neither
was caught by build, unit tests, or the generated end-to-end suite. Only an HTTP
assertion against a running generated project found them.

1. **`ConfigService.get('cors')` returns a JSON string, not an object.**
   `@nestjs/config` publishes a `validate` result by writing
   `JSON.stringify(value)` into `process.env` for every non-string value. Reading
   `cors` back gave a string whose `.enabled` was `undefined`, so CORS was never
   enabled and nothing anywhere reported a fault. Structured configuration is
   therefore provided through a DI symbol, and `ConfigService` is used for nothing.
2. **`origin: ['*']` is not a wildcard.** The `cors` package compares an array
   entry literally against the request's `Origin`, so a wildcard inside an array
   matches nothing. The response then carried `Vary`, `Access-Control-Allow-Methods`,
   `-Headers`, `-Max-Age` and `-Expose-Headers` — everything except
   `Access-Control-Allow-Origin`, which is the one header that matters. The server
   looked correctly configured in every log and header dump except the decisive one.
   `main.ts` now passes the bare string when the allowlist contains `*`.

## Consequences

- The full-profile example rises from 93 to 99 CREATE operations: `build` from 8 to
  12, `bootstrap` from 85 to 87. `core`, `infra-persistence` and `web-api` are
  unchanged at 49, 58 and 72.
- Generated runtime dependencies grow by one: `@nestjs/config`.
- The generated `.env.*` files are stored in the golden tree without their leading
  dot, extending the convention milestone 7.20 established for `.gitignore`. Here
  the reason is sharper than tidiness: this repository's own `.gitignore` excludes
  `.env.*`, so dotted goldens could never have been committed at all.
- `src/config` is a new composition-root folder. It is outside every ESLint layer
  zone, which is correct — the composition root is the layer allowed to see
  everything — and the README's layer table now names it.
- The generated-project smoke gained a CORS preflight assertion. It is the only gate
  that would have caught either trap above.

## Alternatives considered

- **Joi or zod for validation.** Rejected under N4: both are generated dependencies
  for a validation surface small enough to express directly, and a hand-written
  function can accumulate every fault and phrase each message in terms of the
  variable a reader will actually edit.
- **`ConfigModule`'s `validate` option as the single entry point.** Rejected after
  trap 1: it validates correctly, but the only supported way to read the result back
  mangles structured values.
- **A single `.env` file, as the reference project has.** Rejected under N4: the Java
  Golden Path's per-environment split is the behavior parity is measured against,
  and a single file cannot express "permissive in development, closed in production"
  without a human editing it on every deploy.
- **CORS enabled with an empty allowlist instead of disabled.** Rejected: the two
  differ in what the browser sees on a failed request, and "no policy" is the
  honest description of an unconfigured deployment.

## Validation

Typecheck and build exit 0. `npm test` 56 files / 308 tests. NestJS golden smoke
3/3; boundary smoke 7/7; `CODEGEN_REQUIRE_NPM_SMOKE=true npm run
smoke:generated-project:nestjs` 7/7, including the CORS preflight assertion and the
generated project's own `validateEnvironment` unit tests. Two consecutive generations
were byte-identical, and the identifier-only example emits the same 99 CREATE
operations. The wildcard fix was additionally confirmed by hand against a running
generated project: `Access-Control-Allow-Origin: *` absent before, present after.
Goldens were derived by copying built-CLI output.
