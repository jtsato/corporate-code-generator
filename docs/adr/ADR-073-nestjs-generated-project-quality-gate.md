# ADR-073 — NestJS Generated-Project Quality Gate

## Status

Accepted — Milestone 7.7. Fulfils the generated-project gate deferred by
[ADR-057](ADR-057-nestjs-as-second-golden-path.md).

## Context

Before this milestone the NestJS Golden Path was validated only by
`tests/smoke/nestjs-clean-architecture.smoke.test.ts`, which compares all 28
generated artifacts against approved goldens and asserts that generated Core
carries no framework import. That is a gate on the *shape* of the output. It
proves the generator renders what was reviewed, and it cannot detect a project
that renders perfectly and then fails `npm install`, fails to compile, or
crashes on boot.

The Java Golden Path closed the same gap through Maven: `mvn compile`, then
feature-scoped `mvn test` smokes, and finally the unfiltered reactor gate of
[ADR-045](ADR-045-full-maven-reactor-quality-gate.md). ADR-057 recorded that
an equivalent gate for NestJS was required before that Golden Path could be
considered release-ready, and scoped it as its own milestone. Until now,
execution of the generated NestJS project had been verified manually only.

## Decision

Add `tests/smoke/nestjs-generated-project.smoke.test.ts`, exposed as
`npm run smoke:generated-project:nestjs` and backed by a new shared helper
`tests/smoke/support/NpmSmokeSupport.ts`. The gate generates the profile with
the built CLI into a temporary directory, runs `npm install`, runs the
generated project's own `npm run build` (`nest build`), starts
`node dist/main.js` on a reserved ephemeral port, and asserts:

- `POST /wallets` returns 201 with the created representation;
- `GET /wallets/{id}` returns 200 with that same representation;
- `GET /wallets/{unknown-uuid}` returns 404 with `statusCode` 404;
- a malformed identifier returns 400, exercising the global validation pipe
  that `main.ts` installs;
- `/swagger-ui` returns 200, exercising the generated OpenAPI mount.

The server is torn down unconditionally and the temporary tree removed.

The gate is excluded from `npm test` and `npm run test:coverage`, because it
requires network access and takes tens of seconds, and therefore runs as its
own CI step. The previously implicit `npm run smoke:nestjs` was given an
explicit CI step at the same time; it had been reaching CI only as a side
effect of not being on the coverage exclude list.

## Skip and require policy

`CODEGEN_REQUIRE_NPM_SMOKE=true` turns an unavailable registry from a skip
into a failure, mirroring `CODEGEN_REQUIRE_MAVEN_SMOKE` and
`CODEGEN_REQUIRE_DOCKER_SMOKE`. CI sets it.

## Why the availability probe is registry reachability, not tool presence

The Maven smokes ask whether `mvn` exists, because on many machines it does
not. That question is meaningless here: `npm` is always present, since this
repository runs on it. The honest question for an npm-based gate is whether
the configured registry can actually serve packages from the generated
project directory.

The probe is `npm view @nestjs/core version`, run with the working directory
set to the generated project, requiring exit zero and a semver-shaped answer.

- A raw HTTP request to the public registry would be dishonest: it ignores
  `.npmrc`, corporate mirrors, proxies, certificate settings, and auth
  tokens, so it can report success on a machine where the install will fail
  and failure on a mirror where it would have succeeded.
- `npm ping` is the canonical probe but hits `/-/ping`, which many mirrors do
  not implement. It fails closed, producing false skips.
- `npm view` exercises the same configuration and network path the install
  needs. Requiring a semver-shaped answer additionally catches a captive
  portal that answers 200 with an HTML page.

The working directory matters: npm discovers `.npmrc` by walking up from it,
and the repository root and a temporary directory can resolve different
registries. Probing where the install will run forces the ordering
generate, probe, install. Generation is offline and cheap, so nothing is
wasted when the probe decides to skip.

Reachability of one package's metadata does not prove the whole tree
installs. A partial outage or a missing token for a scoped package fails the
gate rather than skipping it. That is the correct bias: the probe exists to
separate "no network" from "the generated project is broken", and when in
doubt it must fail.

## Why the parent npm environment is filtered, and why by denylist

When the suite is invoked through `npm run`, the parent npm injects its own
configuration into the environment, which a nested npm would otherwise
inherit. Three cases were demonstrated to break this gate:

- `NODE_ENV=production` and an inherited `npm_config_omit` each reduce the
  generated project's install from 325 packages to 116, removing the
  `@nestjs/cli` and `typescript` that `nest build` requires;
- `npm_config_allow_scripts` is rejected outright by a project-scoped
  install, failing the run with `EALLOWSCRIPTS`.

Filtering is by denylist rather than by discarding every `npm_config_*`
variable. Registry, proxy, certificate, and authentication settings travel
under the same prefix, and discarding them would silently redirect an
operator's mirror to the public registry — the same dishonesty the
availability probe is designed to avoid.

Key comparison is case-insensitive. Windows delivers these variables to a
test worker upper-cased while `process.env` lookups remain case-insensitive,
so a case-sensitive prefix test silently keeps every variable it claims to
remove. This was observed during implementation: the first version of the
helper looked correct, read back the expected values, and filtered nothing.

## Why `npm install` and not `npm ci`

The profile generates no lockfile, and `npm ci` fails without one. The
accepted consequence is that this gate is not hermetic across time: a
floating `^` range can break it with no change in this repository.

That is a property of the validation toolchain, not a breach of the
generation determinism invariant, which governs generation inputs and
outputs. Generating a lockfile is deliberately out of scope; it would need
regenerating whenever any dependency range moved.

## Why the server is started directly rather than through an npm script

`node dist/main.js` is spawned directly, so the recorded process id is the
server itself rather than an npm shim wrapping it. Teardown depends on that:
on Windows the process tree is terminated through `taskkill`, and on other
platforms the child leads its own process group and is signalled as a group.

## Why readiness is an answered request rather than a log line

The framework's startup banner is a logger message whose text, level, and
presence are configurable and version-dependent, and it is emitted around
rather than strictly after the listener opens. An answered HTTP request is
the contract actually under test. The readiness path is `/`, which the
framework answers with its built-in 404 — a valid response proving the
listener and router are live without depending on the OpenAPI mount.

## One smoke file rather than the Java-style split

The Java Golden Path splits across many smoke files because the Maven local
repository is a machine-global cache: once one smoke resolves the dependency
tree, each additional file costs seconds and buys real diagnostic isolation
against a different generated test class.

Neither premise holds here. Installed dependencies live inside the generated
project, so a second file means a second full install — a marginal cost near
100 percent rather than near 5. And the NestJS profile generates no tests, so
there is no equivalent of a test-selector axis to partition across files. The
only axes are "did it compile" and "does it serve", and the second subsumes
the first. Diagnostic separation is bought with test boundaries inside one
file instead, which costs nothing. This should be revisited if a second
example model or generated NestJS tests are added.

## Alternatives rejected

- In-process testing through the framework's own testing module: it would
  validate a hand-assembled module graph rather than the artifact the build
  produced, and would exercise neither `main.ts`'s global pipe and filter nor
  the real listener.
- Generating tests into the NestJS project and delegating to them, the way
  the Java smokes delegate to Maven: this requires a generated-test
  capability that does not exist yet.
- Building a container image of the generated project: no NestJS container
  capability exists.

## Consequences

- The generated NestJS project is now proven to install, compile, and serve,
  rather than only proven well-shaped.
- CI gains two steps. On the implementation machine a cold install resolved
  325 packages in 18 seconds, `nest build` completed in 2 seconds, and the
  server answered its first request 817 milliseconds after spawn; the whole
  gate ran in roughly 18 to 26 seconds.
- The first CI run after this lands performs a cold dependency fetch, because
  the Node setup action keys its cache on this repository's lockfile.
  Subsequent runs reuse the warmed cache.
- Registry outages and floating dependency ranges can fail the gate for
  reasons outside this repository.
- No generated artifact changed. The profile still emits 28 files.

## What this gate does not verify

The development-mode start path, container packaging, generated tests,
architecture linting, and any capability the profile does not yet generate.
Persistence is in-memory, so durability across restarts is out of scope by
construction.

## Validation

Run on the implementation machine, Windows, Node 26.5.1 and npm 11.18.0,
against the `nestjs-clean-architecture` profile and
`examples/nestjs-wallet-service/model.yaml`:

- `npm run smoke:generated-project:nestjs` with
  `CODEGEN_REQUIRE_NPM_SMOKE=true` — passed, 3 tests.
- The same command with the registry pointed at an unreachable host and the
  variable unset — skipped with the documented message, exit code 0.
- The same command with the registry unreachable and the variable set to
  `true` — failed with the documented message, exit code 1.
- After each run, no orphaned server process and no leftover temporary tree
  remained.

Measured figures are recorded in
[Current State](../project/CURRENT-STATE.md); this ADR is not the place for
volatile counts.
