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
npm run smoke:generated-project:nestjs
```

`smoke:nestjs` requires no external toolchain and is included in the default `npm test` run. It generates the profile through the built CLI, compares every generated artifact against `tests/golden/nestjs-clean-architecture/`, and asserts that the generated Core module contains no framework imports.

`smoke:boundaries:nestjs` is the module boundary gate ([ADR-086](../adr/ADR-086-nestjs-module-boundary-validation.md)). It requires no external toolchain and is included in the default `npm test` run. For every module the profile declares it generates that selection alone and resolves every relative import in the produced TypeScript against the files that selection actually produces, which is the check that would have caught the ADR-081 defect; it also asserts the full profile's inward dependency direction, and asserts its own module list equals the one the profile declares so a new module cannot silently skip the gate.

`smoke:container:nestjs` is the packaging and CI gate ([ADR-090](../adr/ADR-090-nestjs-container-packaging.md), [ADR-091](../adr/ADR-091-nestjs-generated-continuous-integration.md)). It requires no container runtime and is included in the default `npm test` run. It does **not** build the image; it asserts that the generated packaging describes the application the generator emitted: the port agrees across `EXPOSE`, the healthcheck URL, the Compose mapping and the CI workflow with the `PORT` in `.env.production`; the healthcheck path is a route the generated health controller declares; `.dockerignore` keeps `.env.production` while ignoring `.env`; every `COPY --from=build` names a generated path or a listed build product; the runtime stage runs as a user that is neither `root` nor `0`; the generated workflow parses as YAML; every workflow `uses:` is pinned by 40-character commit SHA with its tag in a trailing comment; every npm script the workflow runs is declared by the generated `package.json`; and the workflow builds, runs and logs the container. Building and running the image locally remains unverified for want of a container runtime; the generated workflow's container steps are where that happens, and that workflow has itself never executed because it is generated into consumer repositories rather than this one.

`smoke:generated-project:nestjs` is the generated-project execution gate ([ADR-073](../adr/ADR-073-nestjs-generated-project-quality-gate.md), [ADR-075](../adr/ADR-075-nestjs-generated-core-test-support.md), [ADR-076](../adr/ADR-076-nestjs-http-response-envelopes.md), [ADR-077](../adr/ADR-077-nestjs-pagination-and-filter-foundation.md), [ADR-078](../adr/ADR-078-nestjs-health-checks.md), [ADR-079](../adr/ADR-079-nestjs-basic-i18n-error-messages.md), [ADR-080](../adr/ADR-080-nestjs-generated-e2e-tests.md), [ADR-082](../adr/ADR-082-nestjs-crud-integration.md), [ADR-083](../adr/ADR-083-nestjs-sorting.md), [ADR-084](../adr/ADR-084-nestjs-package-i18n-and-in-memory-uniqueness.md)). It generates the profile into a temporary directory, runs `npm install`, runs the generated project's own `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e`, starts `node dist/main.js` on a reserved ephemeral port, and asserts the full CRUD lifecycle: create, collection/by-id reads, full replacement PUT, presence-based PATCH including empty-patch validation, physical DELETE with an empty 204 response, and repeated read/delete 404 behavior. It also asserts pagination/filtering, collection sorting in ascending and descending order, repeated sort precedence, filter-plus-sort-plus-pagination composition, invalid/malformed/whitespace/unknown sort values through the structured HTTP 400 contract, health checks, package-backed localized validation, Portuguese uniqueness conflict with HTTP 409, request-validation, and OpenAPI behavior before shutting the server down and removing the tree. It also asserts that the generated ESLint layer rule is not vacuous, by prepending a `core` to `infra` import to a generated model and requiring the lint to fail with the boundary message before restoring the file. It also asserts the CORS preflight the selected environment file declares, which is the only gate that catches a CORS policy that is present in configuration but absent from the response headers. It asserts language negotiation by quality weight (`de;q=1.0, pt;q=0.1` answering in Portuguese), which is the case that distinguishes the generated negotiation policy from a resolver that forwards the client's top tag. It requires npm registry access, is excluded from `npm test` and `npm run test:coverage`, and runs as its own CI step.

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

## CI workflows

The repository currently contains three GitHub workflows:

- `.github/workflows/continuous-integration.yml`: typecheck, build, coverage, smoke families, Maven smoke families with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`, Maven reactor smoke, the NestJS golden smoke, the NestJS generated-project smoke with `CODEGEN_REQUIRE_NPM_SMOKE=true`, and SonarCloud.
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
| CI workflow | Syntax review, `git diff --check`, relevant local equivalent commands where practical | Remote CI result after push/PR. |

Do not run all Maven smoke suites for documentation-only work unless executable files, generated expectations, CI behavior, or validation policy changes require it.
