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
npm run smoke:maven-reactor:java-multimodule
```

## Maven policy

Maven-based smokes require a compatible JDK and Maven installation. By default, Maven-dependent smoke tests may skip when Maven is unavailable. To require Maven and turn absence into a failure, set:

```bash
CODEGEN_REQUIRE_MAVEN_SMOKE=true
```

CI uses this environment variable for Maven smoke steps. Local development can use it when validating release readiness or Maven-sensitive changes.

The full generated Java reactor gate is:

```bash
npm run smoke:maven-reactor:java-multimodule
```

It generates the multi-module Golden Path and runs an unfiltered Maven test command against the generated reactor.

## CI workflows

The repository currently contains three GitHub workflows:

- `.github/workflows/continuous-integration.yml`: typecheck, build, coverage, smoke families, Maven smoke families with `CODEGEN_REQUIRE_MAVEN_SMOKE=true`, Maven reactor smoke, and SonarCloud.
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
| CI workflow | Syntax review, `git diff --check`, relevant local equivalent commands where practical | Remote CI result after push/PR. |

Do not run all Maven smoke suites for documentation-only work unless executable files, generated expectations, CI behavior, or validation policy changes require it.
