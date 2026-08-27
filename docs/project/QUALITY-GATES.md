# Quality Gates

This document centralizes validation commands and policies. It describes available gates; it does not claim that a command passed unless a task report explicitly says it was run.

## Core repository gates

| Gate | Command | Purpose |
| --- | --- | --- |
| TypeScript typecheck | `npm run typecheck` | Validate TypeScript project references. |
| Build | `npm run build` | Compile all TypeScript project references. |
| Default tests | `npm test` | Run the Vitest suite while excluding Maven-dependent smoke suites declared in `package.json`. |
| Coverage | `npm run test:coverage` | Run Vitest with V8 coverage while excluding Maven-dependent smoke suites declared in `package.json`. |
| Whitespace diff check | `git diff --check` | Detect trailing whitespace and whitespace errors in the diff. |

There is no declared ESLint, Prettier, or end-to-end script. Do not invent those gates.

## Smoke command families

General smoke commands:

```bash
npm run smoke
npm run smoke:maven
```

Java multi-module smoke commands declared in `package.json` include:

```bash
npm run smoke:java-multimodule
npm run smoke:maven:java-multimodule
npm run smoke:archunit:java-multimodule
npm run smoke:mutation:java-multimodule
npm run smoke:testcontainers:java-multimodule
npm run smoke:validation:java-multimodule
npm run smoke:paging:java-multimodule
npm run smoke:paging-runtime:java-multimodule
npm run smoke:querydsl-filter-paging-runtime:java-multimodule
npm run smoke:filter:java-multimodule
npm run smoke:rest-filter:java-multimodule
npm run smoke:jpa-paging:java-multimodule
npm run smoke:querydsl:java-multimodule
npm run smoke:querydsl-filter:java-multimodule
npm run smoke:querydsl-filter-runtime:java-multimodule
npm run smoke:error-handling:java-multimodule
npm run smoke:cors:java-multimodule
npm run smoke:openapi:java-multimodule
npm run smoke:spring-context:java-multimodule
npm run smoke:http:java-multimodule
npm run smoke:http-persistence-read:java-multimodule
npm run smoke:http-filter:java-multimodule
npm run smoke:find-by-id:java-multimodule
npm run smoke:create-runtime:java-multimodule
npm run smoke:http-create:java-multimodule
npm run smoke:http-update:java-multimodule
npm run smoke:update-runtime:java-multimodule
npm run smoke:delete-runtime:java-multimodule
npm run smoke:http-delete:java-multimodule
npm run smoke:maven-reactor:java-multimodule
```

## Maven policy

Maven-based smokes require a compatible JDK and Maven installation. By default, Maven-dependent smoke tests may skip when Maven is unavailable. To require Maven and turn absence into a failure, set:

```bash
CODEGEN_REQUIRE_MAVEN_SMOKE=true
```

CI uses this environment variable for Maven smoke steps. Local development can use it when validating release readiness or Maven-sensitive changes.

The generated Testcontainers verification additionally requires a reachable Docker endpoint. It follows the same policy under its own variable:

```bash
CODEGEN_REQUIRE_DOCKER_SMOKE=true
```

## npm registry policy

`npm` is always present in this repository, so the NestJS generated-project gate cannot gate on tool presence. It gates instead on whether the configured registry can serve packages from the generated project directory, probed with `npm view @nestjs/core version`. By default the gate skips when the registry is unreachable. To require it and turn unreachability into a failure, set:

```bash
CODEGEN_REQUIRE_NPM_SMOKE=true
```

CI uses this environment variable for the NestJS generated-project smoke step.

The full generated Java reactor gate is:

```bash
npm run smoke:maven-reactor:java-multimodule
```

It generates the multi-module Golden Path and runs an unfiltered Maven test command against the generated reactor.

## NestJS Golden Path smokes

```bash
npm run smoke:nestjs
npm run smoke:boundaries:nestjs
npm run smoke:container:nestjs
npm run smoke:persistence:nestjs
npm run smoke:auditing:nestjs
npm run smoke:generated-project:nestjs
npm run smoke:generated-project-typeorm:nestjs
```

`smoke:nestjs` requires no external toolchain and is included in the default `npm test` run. It generates the profile through the built CLI, compares every generated artifact against `tests/golden/nestjs-clean-architecture/`, and asserts that the generated Core module contains no framework imports.

`smoke:boundaries:nestjs` is the module boundary gate ([ADR-086](../adr/ADR-086-nestjs-module-boundary-validation.md)). It requires no external toolchain and is included in the default `npm test` run. For every module the profile declares it generates that selection alone and resolves every relative import in the produced TypeScript against the files that selection actually produces, which is the check that would have caught the ADR-081 defect; it also asserts the full profile's inward dependency direction, and asserts its own module list equals the one the profile declares so a new module cannot silently skip the gate. Since milestone 7.26 every case runs under both values of the `persistence` option, because that option swaps artifacts inside `infra-persistence` and adds imports to `bootstrap`; checking only the default would leave the variant's boundaries enforced by nothing.

`smoke:container:nestjs` is the packaging and CI gate ([ADR-090](../adr/ADR-090-nestjs-container-packaging.md), [ADR-091](../adr/ADR-091-nestjs-generated-continuous-integration.md)). It requires no container runtime and is included in the default `npm test` run. It does **not** build the image; it asserts that the generated packaging describes the application the generator emitted: the port agrees across `EXPOSE`, the healthcheck URL, the Compose mapping and the CI workflow with the `PORT` in `.env.production`; the healthcheck path is a route the generated health controller declares; `.dockerignore` keeps `.env.production` while ignoring `.env`; every `COPY --from=build` names a generated path or a listed build product; the runtime stage runs as a user that is neither `root` nor `0`; the generated workflow parses as YAML; every workflow `uses:` is pinned by 40-character commit SHA with its tag in a trailing comment; every npm script the workflow runs is declared by the generated `package.json`; and the workflow builds, runs and logs the container. Building and running the image locally remains unverified for want of a container runtime; the generated workflow's container steps are where that happens, and that workflow has itself never executed because it is generated into consumer repositories rather than this one. Since milestone 7.26 it additionally covers the TypeORM variant, whose packaging has to start a database as well as an application: that the Compose file declares a PostgreSQL service with a healthcheck and that the application waits on `service_healthy` rather than `service_started`; that the credentials the application service is given are the ones the database service was created with, which are restated in two places and which nothing else makes agree; and that the workflow verifies through `docker compose` rather than a lone `docker run` that would have no database to reach.

`smoke:persistence:nestjs` is the persistence-option gate ([ADR-092](../adr/ADR-092-nestjs-orm-persistence-foundation.md)). It requires no external toolchain and is included in the default `npm test` run. Goldens for the TypeORM variant are stored as the *difference* from the default generation rather than as a second full tree, and this gate is what makes that safe: it asserts that the files the option adds and the files it changes are exactly the declared sets, so a template that quietly began branching on the option fails here rather than drifting unreviewed. It states separately that the mapper and all five gateway providers are byte-identical between the options, which is ADR-057's boundary claim rather than a bookkeeping detail; that the generated Core mentions no ORM; that the variant renders for an identifier-only entity; and that an undeclared option or value is rejected with the allowed values named.

`smoke:auditing:nestjs` is the auditing gate ([ADR-094](../adr/ADR-094-nestjs-auditing.md)). It requires no external toolchain and is included in the default `npm test` run. `audited: true` is a per-entity opt-in, so the property it protects is not only that auditing works but that it costs nothing when absent: `examples/nestjs-audited-wallet-service` is identical to `examples/nestjs-wallet-service` apart from the flag, the golden is stored as the difference between the two generations, and this gate asserts the difference is exactly three added files and fifteen changed ones. It also asserts that no request model mentions either timestamp, since both are server-generated; that the clock is a framework-free Core port injected into the use cases rather than a direct `new Date()`; that creation takes exactly one clock reading while update and patch supply none; that the update provider is the one place a creation timestamp is preserved; and that the TypeORM entity uses plain columns rather than the ORM's own date columns.

`smoke:generated-project:nestjs` is the generated-project execution gate ([ADR-073](../adr/ADR-073-nestjs-generated-project-quality-gate.md), [ADR-075](../adr/ADR-075-nestjs-generated-core-test-support.md), [ADR-076](../adr/ADR-076-nestjs-http-response-envelopes.md), [ADR-077](../adr/ADR-077-nestjs-pagination-and-filter-foundation.md), [ADR-078](../adr/ADR-078-nestjs-health-checks.md), [ADR-079](../adr/ADR-079-nestjs-basic-i18n-error-messages.md), [ADR-080](../adr/ADR-080-nestjs-generated-e2e-tests.md), [ADR-082](../adr/ADR-082-nestjs-crud-integration.md), [ADR-083](../adr/ADR-083-nestjs-sorting.md), [ADR-084](../adr/ADR-084-nestjs-package-i18n-and-in-memory-uniqueness.md)). It generates the profile into a temporary directory, runs `npm install`, runs the generated project's own `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e`, starts `node dist/main.js` on a reserved ephemeral port, and asserts the full CRUD lifecycle: create, collection/by-id reads, full replacement PUT, presence-based PATCH including empty-patch validation, physical DELETE with an empty 204 response, and repeated read/delete 404 behavior. It also asserts pagination/filtering, collection sorting in ascending and descending order, repeated sort precedence, filter-plus-sort-plus-pagination composition, invalid/malformed/whitespace/unknown sort values through the structured HTTP 400 contract, health checks, package-backed localized validation, Portuguese uniqueness conflict with HTTP 409, request-validation, and OpenAPI behavior before shutting the server down and removing the tree. It also asserts that the generated ESLint layer rule is not vacuous, by prepending a `core` to `infra` import to a generated model and requiring the lint to fail with the boundary message before restoring the file. It also asserts the soft-delete contract end to end: that a deleted record is retained rather than removed, that it is reachable through `GET /{entities}/deleted` and `GET /{entities}/deleted/{id}` with its deletion timestamp, that its unique value is released while it is deleted and restoring is then refused with 409, that restoring after the value is freed answers 204, and that restoring an active record is 409 while restoring an unknown identifier is 404. It also asserts the CORS preflight the selected environment file declares, which is the only gate that catches a CORS policy that is present in configuration but absent from the response headers. It asserts language negotiation by quality weight (`de;q=1.0, pt;q=0.1` answering in Portuguese), which is the case that distinguishes the generated negotiation policy from a resolver that forwards the client's top tag. It requires npm registry access, is excluded from `npm test` and `npm run test:coverage`, and runs as its own CI step.

`smoke:generated-project-typeorm:nestjs` is the same gate for the TypeORM option ([ADR-092](../adr/ADR-092-nestjs-orm-persistence-foundation.md)). It generates with `--option persistence=typeorm`, installs, lints, builds, and runs the generated project's own unit and end-to-end suites — which is where the generated repository suite drives TypeORM against SQLite rather than against a mock — then starts the compiled server with `NODE_ENV=test` and asserts the CRUD lifecycle, sorting in both directions including by the identifier the repository appends as a tiebreaker, filter-plus-sort-plus-pagination composition, pages that do not repeat a row, and a rejected injection-shaped filter field. It runs the same model as the in-memory gate, so the two are directly comparable, and carries the same soft-delete assertions — which is how the claim that the persistence option does not change the REST contract is checked against behavior rather than against file lists. It also asserts that `sql.js` is a development dependency and that `better-sqlite3` is absent, because a native driver would need an install script npm no longer runs unattended and `npm install && npm test` would fail on a machine with no toolchain. **PostgreSQL is the configured runtime and nothing in this gate connects to one**; the entity and repository are written to the subset both engines accept precisely because this gate cannot see where they differ. It requires npm registry access, is excluded from `npm test` and `npm run test:coverage`, and runs as its own CI step.

For milestone 7.17, the authorized command `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 3 tests, including generated dependencies installed and generated build/Jest/e2e/HTTP CRUD checks.

For milestone 7.18, coordinator-verified final evidence after the UUID v4 fixture fix
is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with
55 files and 300 tests; `npm run test:coverage` passed with 55 files and 300 tests at
92.78% statements, 81.52% branches, 97.04% functions, and 93.58% lines;
`npm run smoke:nestjs` passed with 1 file and 3 tests after an elevated rerun following
sandbox `spawn EPERM`; `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run
smoke:generated-project:nestjs` passed with 1 file and 5 tests; and the Java and Maven
smokes each passed with 1 file and 1 test. `git diff --check` exited 0 with only
LF/CRLF warnings. These are final-gate results, not pending claims.

For milestone 7.19, final evidence is complete: `npm run typecheck` and `npm run build`
exited 0; `npm test` passed with 55 files and 301 tests; `npm run test:coverage` passed
with 92.92% statements, 82.05% branches, 97.08% functions, and 93.72% lines;
`npm run smoke:nestjs` passed with 1 file and 3 tests over 90 generated paths;
and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs`
passed with 1 file and 5 tests, including generated package installation, JSON catalog
asset copying, localized Portuguese validation, HTTP 409 uniqueness conflict, generated
Jest/e2e, and CRUD/sorting behavior. Identifier-only and composite-unique generated
projects passed their native build, Jest, and e2e checks. Two full-profile generations
were byte-identical, and `git diff --check` exited 0 with only LF/CRLF warnings.

For milestones 7.20 and 7.21, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 56 files and 308 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 93 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 7 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 6 tests, including the generated `npm run lint` and the deliberate boundary-violation rejection. Two full-profile generations were byte-identical, the identifier-only example emitted the same 93 CREATE operations, and `git diff --check` exited 0 with only LF/CRLF warnings. The boundary gate was additionally proven non-vacuous by reassigning `bootstrap-entity-module` to `web-api`, which reintroduced the ADR-081 defect and failed two cases; the manifest was restored afterwards.

For milestone 7.22, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 56 files and 308 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 99 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 7 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 7 tests, including the generated `validateEnvironment` unit tests and a CORS preflight assertion. Two full-profile generations were byte-identical, the identifier-only example emitted the same 99 CREATE operations, and `git diff --check` exited 0 with only LF/CRLF warnings. Two defects were found by the preflight assertion alone and fixed before sign-off: `ConfigService.get` returning structured values JSON-stringified, and `origin: ['*']` being compared literally by the `cors` package.

For milestone 7.23, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 56 files and 308 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 102 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 7 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 8 tests, including the generated project's own 18 negotiation unit assertions, its three end-to-end locale cases, and the weight-over-order assertion over HTTP. Two full-profile generations were byte-identical, the identifier-only example emitted the same 102 CREATE operations, and `git diff --check` exited 0 with only LF/CRLF warnings.

For milestone 7.24, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 57 files and 314 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 105 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 7 tests; `npm run smoke:container:nestjs` passed with 1 file and 6 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 8 tests. Two full-profile generations were byte-identical, the identifier-only example emitted the same 105 CREATE operations, and `git diff --check` exited 0 with only LF/CRLF warnings. The container gate was proven non-vacuous by drifting the exposed port and the health path in the template, which failed exactly the two relevant cases. **The container image was not built: no container runtime was available on the build machine.**

For milestone 7.25, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 57 files and 318 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 106 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 7 tests; `npm run smoke:container:nestjs` passed with 1 file and 10 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 8 tests. Two full-profile generations were byte-identical, the identifier-only example emitted the same 106 CREATE operations, and `git diff --check` exited 0 with only LF/CRLF warnings. The new CI assertions were proven non-vacuous by pointing a workflow step at an undeclared npm script and unpinning `actions/setup-node` to a tag, which failed exactly the two relevant cases. The port/health-path refactor was verified behavior-preserving by the regenerated `Dockerfile` and Compose file being byte-identical to their existing goldens.

For milestone 7.26, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 59 files and 348 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 106 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 13 tests, covering both persistence options; `npm run smoke:container:nestjs` passed with 1 file and 14 tests; `npm run smoke:persistence:nestjs` passed with 1 file and 8 tests; `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 8 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project-typeorm:nestjs` passed with 1 file and 4 tests, in which the generated TypeORM project's own 78 unit tests and 4 end-to-end tests passed and the compiled server served the full CRUD, paging, sorting and filtering contract over HTTP against SQLite. Two generations were byte-identical under both options, the identifier-only example emitted the same counts as the wallet example under both, and `git diff --check` exited 0 with only LF/CRLF warnings. The default variant's goldens came out byte-identical to the ones 7.25 approved, which is what shows the option mechanism did not disturb the existing profile.

The new gates were proven non-vacuous by making the mapper template branch on the option, which failed exactly the two cases asserting the option does not reach it, and by breaking the Compose credentials and the `depends_on` condition, which failed exactly the two cases asserting those agree. The generated repository suite caught a real defect during the milestone: appending the identifier as a sort tiebreaker *replaced* a caller's own sort direction on that column, because TypeORM keys `ORDER BY` clauses by expression.

**PostgreSQL was never connected to.** No container runtime and no database server were available on the build machine, so every TypeORM assertion above ran against the in-process SQLite engine. The generated CI workflow's Compose steps are where that verification would first happen, and that workflow has still never executed.

While updating the Java multi-module golden smoke's surroundings, that suite was given an explicit 60-second timeout like every other smoke suite here. It had been relying on Vitest's 5-second default while spawning the CLI and comparing 130 files, and began failing once the suite grew enough to contend for the machine; the default was never sized for that work.

For milestone 7.27, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 59 files and 348 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 127 generated paths; `npm run smoke:boundaries:nestjs` passed with 1 file and 13 tests across both persistence options; `npm run smoke:container:nestjs` passed with 1 file and 14 tests; `npm run smoke:persistence:nestjs` passed with 1 file and 8 tests; `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` passed with 1 file and 9 tests; and `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project-typeorm:nestjs` passed with 1 file and 5 tests. Both generated projects were installed, linted, built and run: the in-memory one passes 84 generated unit tests and 5 end-to-end tests, the TypeORM one 87 and 5. Two generations were byte-identical under both options, the identifier-only example emitted the same counts as the wallet example under both, and `git diff --check` exited 0 with only LF/CRLF warnings.

The soft-delete assertions were proven non-vacuous twice, both by injecting the defect into a scratch copy of the generated project rather than into the templates. Inverting the controller's route order so `/deleted` fell after `/:id` failed exactly the soft-delete end-to-end case, which is the defect the declaration-order comment warns about. Replacing the in-memory soft delete with a physical `splice` failed exactly three repository cases and the same end-to-end case, and nothing else — a gate that could not tell retention from removal would be worthless for this milestone.

For milestone 7.28, final evidence is complete: `npm run typecheck` and `npm run build` exited 0; `npm test` passed with 60 files and 357 tests; `npm run smoke:nestjs` passed with 1 file and 3 tests over 127 generated paths; `npm run smoke:boundaries:nestjs` 13 tests; `npm run smoke:container:nestjs` 14 tests; `npm run smoke:persistence:nestjs` 8 tests; `npm run smoke:auditing:nestjs` 7 tests; `$env:CODEGEN_REQUIRE_NPM_SMOKE='true'; npm run smoke:generated-project:nestjs` 9 tests; and its TypeORM counterpart 5 tests. All four combinations of model and persistence option generated byte-identically across two runs, and the identifier-only example was unchanged at 127 and 129. Both audited projects were installed, linted, built and run, passing 83 unit plus 5 end-to-end tests in memory and 91 plus 5 under TypeORM.

The auditing assertions were proven non-vacuous by deleting the single line in `Update{Entity}Provider` that preserves the creation timestamp, in a scratch copy of the generated project; that failed exactly the CRUD end-to-end case and nothing else. The same approach found a real defect rather than merely confirming one: running the audited end-to-end suite against the TypeORM option surfaced a 7.27 bug in which creating over a tombstoned identifier answered 201 while the row stayed invisible, which is fixed in this milestone.

## CI workflows

The repository currently contains three GitHub workflows:

- `.github/workflows/continuous-integration.yml`: typecheck, build, coverage, smoke families, Maven smoke families with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`, Maven reactor smoke, the NestJS golden smoke, the NestJS generated-project smoke with `CODEGEN_REQUIRE_NPM_SMOKE=true`, and SonarCloud. The TypeORM generated-project smoke added by milestone 7.26 is not yet a step there; it runs locally through `npm run smoke:generated-project-typeorm:nestjs`.
- `.github/workflows/java-multimodule-maven-smoke.yml`: focused generated Java multi-module Maven smoke with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`.
- `.github/workflows/mutation-testing.yml`: scheduled and manual mutation testing.

## Change-type validation matrix

| Change type | Minimum relevant gates | Additional gates |
| --- | --- | --- |
| Documentation only | UTF-8/final-newline check, practical Markdown link check, `git diff --check` | Typecheck/build/tests only if docs generation or executable examples changed. |
| TypeScript logic | `npm run typecheck`, `npm run build`, focused tests, `npm test`, `git diff --check` | Coverage when requested or when risk is broad. |
| Model schema or IR | Typecheck, build, focused validation tests, integration tests, default tests | Golden tests when output changes. |
| Technology adapter | Typecheck, build, adapter tests, focused integration tests, default tests | Generated-output smoke for affected profile. |
| Rule or transformer | Typecheck, build, focused rule/transformer tests, golden tests, default tests | Relevant smoke for affected generated behavior. |
| Template or producer | Typecheck, build, golden tests, focused integration tests, default tests | Relevant smoke; Maven smoke when generated Java compile/runtime behavior changes. |
| Profile or module manifest | Typecheck, build, integration tests, dry-run verification, default tests | Relevant smoke and Maven smoke for generated Java profile changes. |
| Generated Java runtime behavior | Typecheck, build, golden tests, relevant smoke, Maven smoke | Full reactor smoke for cross-module runtime or release-readiness changes. |
| Generated TypeScript/NestJS output | Typecheck, build, golden tests, `npm run smoke:nestjs`, `npm run smoke:boundaries:nestjs` | `npm run smoke:generated-project:nestjs` with `CODEGEN_REQUIRE_NPM_SMOKE=true` when generated NestJS build or runtime behavior changes. |
| Profile option (`--option`) | Typecheck, build, `npm run smoke:persistence:nestjs`, `npm run smoke:nestjs`, `npm run smoke:boundaries:nestjs`, `npm run smoke:container:nestjs` | `npm run smoke:generated-project-typeorm:nestjs` with `CODEGEN_REQUIRE_NPM_SMOKE=true` when the non-default variant's build or runtime behavior changes. The default variant's goldens must come out byte-identical, which is what shows the option did not disturb it. |
| CI workflow | Syntax review, `git diff --check`, relevant local equivalent commands where practical | Remote CI result after push/PR. |

Do not run all Maven smoke suites for documentation-only work unless executable files, generated expectations, CI behavior, or validation policy changes require it.
