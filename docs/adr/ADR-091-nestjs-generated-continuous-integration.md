# ADR-091 — NestJS Generated Continuous Integration

## Status

Accepted — Milestone 7.25.

## Context

The generated NestJS project had no CI. The Java Golden Path gained a hardened
workflow at milestone 6.44 ([ADR-065](ADR-065-generated-ci-hardening.md)):
SHA-pinned actions with version comments, `fetch-depth: 0`, `workflow_dispatch`,
an explicit profile, and a secret-guarded analysis step.

Gap G6 in the [NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) is
the NestJS counterpart. Unlike most gaps in that plan, the reference project
*does* have CI — with Stryker mutation testing and a SonarCloud quality gate —
but ADR-057 already classified those as that project's own authoring choices
rather than requirements for generated output, and this milestone does not adopt
them.

This milestone also carries a debt from 7.24. [ADR-090](ADR-090-nestjs-container-packaging.md)
shipped a `Dockerfile` that was never built, because no container runtime existed
on the build machine, and named this milestone as the place to close that.

## Decision

The `build` module emits `.github/workflows/node-ci.yml`, triggered on pushes to
`main`, on pull requests, and through `workflow_dispatch`, with
`permissions: contents: read` and a 15-minute timeout.

Steps: checkout with `fetch-depth: 0`, set up Node, install, `lint`, `build`,
`test`, `test:e2e`, then build the container image and start it.

### The container is started, not merely built

```yaml
- name: Build container image
  run: docker build -t <app>:ci .

- name: Verify the container serves its readiness endpoint
  run: |
    docker run --rm -d --name <app>-ci -p 3000:3000 <app>:ci
    ...poll /health-check/ready for 60 seconds...
    docker logs <app>-ci || true
```

This is the step that closes ADR-090's open verification. Building an image
proves less than serving from one: an image can build cleanly and still fail to
start — a missing runtime file, a wrong `CMD`, a `.env.production` that the
`.dockerignore` swallowed. The step polls for 60 seconds and, on failure, prints
the container logs before failing the run, because "did not become ready" without
logs is an unactionable CI failure.

### No dependency cache, and `npm install` rather than `npm ci`

The profile generates no lockfile. `npm ci` fails outright without one, and
`actions/setup-node`'s `cache: npm` has nothing to hash and errors rather than
silently skipping. Caching against `package.json` alone would key on version
*ranges* rather than resolutions and could serve a stale tree.

**This deviates from the plan's 7.25 scope, which named an npm cache.** The
deviation is recorded here rather than quietly dropped: caching returns if and
when the profile generates a lockfile, which is its own decision with its own
cost — a generated lockfile becomes a golden file that must be regenerated
whenever any dependency version moves.

### Action pinning

`actions/checkout` and `actions/setup-node` are pinned by 40-character commit SHA
with the tag in a trailing comment. Both SHAs were **verified against their tags
through the GitHub API** rather than copied from documentation. The checkout pin
is the same one the Java workflow already uses.

## The duplication this milestone removed

7.24 hardcoded the container port and health path in the `Dockerfile` and Compose
file, and ADR-090 recorded that as a deliberate trade guarded by a coupling test.
The CI workflow needs the same two values, which would have made three copies.

Instead, `containerPort`, `healthPath` and `nodeVersion` are now declared once in
the build producer and passed to the three packaging templates. The refactor is
behavior-preserving: the regenerated `Dockerfile` and `docker-compose.yml` are
**byte-identical** to the goldens 7.24 approved, which is how it was verified.

## Consequences

- The full-profile example rises from 105 to 106 CREATE operations, in `build`,
  which goes from 15 to 16. `core`, `infra-persistence`, `web-api` and
  `bootstrap` are unchanged at 49, 58, 75 and 90.
- The packaging gate grew from 6 to 10 cases. It now also asserts that the
  workflow parses as YAML; that every `uses:` is SHA-pinned with a version
  comment; that every npm script the workflow runs is declared by the generated
  `package.json`; and that the workflow builds, runs and logs the container.
- The port assertion now spans four files: `.env.production`, the `Dockerfile`,
  the Compose file and the workflow.
- **The workflow itself has never run.** It is generated into projects, not into
  this repository, so its first execution happens in a consumer's repository. The
  YAML parses, the pins resolve, and every script it invokes exists — but "the
  steps pass" is not yet established, and the container verification it carries
  is exactly what remains unproven from 7.24 until then.

## Alternatives considered

- **Adopting the reference project's Stryker and SonarCloud steps.** Rejected,
  consistent with ADR-057 and ADR-073: those are that project's authoring
  choices. SonarCloud in particular needs organization-specific coordinates,
  which the Java path handles with a secret-guarded step and which has no
  equivalent value here until someone asks for it.
- **`actions/cache` keyed on `package.json`.** Rejected; see above.
- **Generating a lockfile so `npm ci` and caching work.** Rejected as a separate
  decision with its own maintenance cost, noted for whenever it is wanted.
- **Keeping the container steps out and closing ADR-090 separately.** Rejected:
  the debt was explicitly assigned to this milestone, and a workflow that builds
  the project but ignores the artifact it ships would be an odd thing to generate.

## Validation

Typecheck and build exit 0. `npm test` 57 files / 318 tests. NestJS golden smoke
3/3; boundary smoke 7/7; packaging and CI smoke 10/10;
`CODEGEN_REQUIRE_NPM_SMOKE=true npm run smoke:generated-project:nestjs` 8/8. Two
consecutive generations were byte-identical, and the identifier-only example
emits the same 106 CREATE operations.

The new assertions were proven non-vacuous by pointing a workflow step at an
undeclared npm script and unpinning `actions/setup-node` to a tag, which failed
exactly the two relevant cases; the template was then restored. Goldens were
derived by copying built-CLI output.
