# ADR-090 — NestJS Container Packaging

## Status

Accepted — Milestone 7.24.

## Context

The generated NestJS project could be built and run from a checkout but had no
packaging. The Java Golden Path gained a container capability at milestone 6.45
([ADR-066](ADR-066-generated-docker-capability.md)): a multi-stage `Dockerfile`,
a `.dockerignore`, a `version:`-free Compose file, a non-root runtime and a
`HEALTHCHECK` with a real target.

Gap G5 in the [NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) is
the NestJS counterpart. It depends on milestone 7.22, which is what gave the
project a production environment file for the container to select.

## Decision

The `build` module emits `Dockerfile`, `.dockerignore` and `docker-compose.yml`,
unconditionally.

- **Multi-stage.** The build stage installs everything and runs `npm run build`,
  because the Nest CLI and TypeScript are development dependencies. It then runs
  `npm prune --omit=dev`, and the runtime stage copies the pruned
  `node_modules`, `dist`, `package.json` and `.env.production`.
- **`npm install`, not `npm ci`.** The profile generates no lockfile, so `npm ci`
  would fail. This matches the constraint the generated-project smoke already
  documents.
- **`NODE_ENV=production` in the runtime stage**, so the container starts on
  `.env.production`, whose CORS origin list is empty. An unconfigured container
  rejects cross-origin browser calls rather than accepting all of them.
- **The unprivileged user is `node`, UID/GID 1000**, which `node:alpine` already
  ships. This deliberately differs from Java's 6.45, which creates a `spring`
  user at UID/GID 10001 because its Temurin base image has no unprivileged user
  to inherit. Creating a second user here would be ceremony; the requirement is
  "not root", and both images satisfy it.
- **`HEALTHCHECK` polls `/health-check/ready`**, the readiness endpoint milestone
  7.13 added, using the BusyBox `wget` that `node:alpine` provides.
- The Compose file has no `version:` key, matching 6.45.

### `.env.production` must not be ignored

`.dockerignore` excludes `.env` and `.env*.local` but deliberately **keeps**
`.env.production`, with a comment saying so. If it were ignored, the runtime
`COPY` would fail — or worse, if the copy were also removed, the container would
fall back to development defaults, which include a wildcard CORS origin. A
production container silently accepting every origin is exactly the failure this
milestone must not ship.

## Verification, and its honest limit

**No container runtime was available on the machine where this milestone was
built** — `docker`, `podman`, `nerdctl`, `buildah` and `hadolint` are all absent.
So the image is **not proven to build or run**. That is a real gap, not a
formality, and it is recorded here rather than papered over.

What is proven is the part most likely to rot: that the packaging describes the
application the generator actually emitted. `tests/smoke/nestjs-container.smoke.test.ts`
asserts that

- the port in `EXPOSE`, in the healthcheck URL and in the Compose port mapping
  all equal the `PORT` declared by `.env.production`;
- the healthcheck path is a route the generated health controller declares;
- `.dockerignore` does not ignore `.env.production`, and does ignore `.env`;
- every `COPY --from=build` names either a path the generated project produces or
  one of two explicitly listed build products, so copying anything else has to be
  justified in the test first;
- the runtime stage sets a `USER` that is neither `root` nor `0`;
- the Compose file names the image after the application and omits `version:`.

The gate was confirmed non-vacuous by changing `EXPOSE 3000` to `EXPOSE 8080` and
the health path to `/healthz` in the template, which failed exactly the two
relevant cases; the template was then restored.

**The first real container build should be treated as unverified until it runs.**
ADR-070 set the same precedent for Testcontainers, whose assertions awaited their
first green CI run. Milestone 7.25 generates CI for the project, which is the
natural place for a `docker build` step to close this.

## Consequences

- The full-profile example rises from 102 to 105 CREATE operations, all in
  `build`, which goes from 12 to 15. `core`, `infra-persistence`, `web-api` and
  `bootstrap` are unchanged at 49, 58, 75 and 90.
- No new dependency, generated or otherwise.
- The generated `.dockerignore` is stored dotless in the golden tree as
  `dockerignore`, extending the convention from 7.20 and 7.22 and matching how
  the Java Golden Path already stores its own.
- The Dockerfile hardcodes port 3000 and the health path rather than receiving
  them through a template model, unlike Java's 6.45. That is a deliberate
  trade: the NestJS build templates all share one application-level model, and
  threading a container model through it would be a larger change than the
  coupling test that now guards the duplication.

## Alternatives considered

- **A distroless or `node:22-slim` runtime base.** Rejected: the healthcheck uses
  `wget`, which distroless does not provide, and would then need a Node-based
  health probe script — more generated code to keep correct for no size win worth
  the trade at this stage.
- **`npm ci` with a generated lockfile.** Rejected as a larger decision than this
  milestone: a generated lockfile would have to be regenerated whenever any
  dependency version moves, and would become a golden file of its own.
- **A profile option gating the container artifacts.** Rejected, consistent with
  6.45 and with 7.20: a project that cannot be packaged is not a variant anyone
  asked for.
- **Passing container settings through a template model.** Rejected for now; see
  Consequences. The coupling test makes the duplication safe, and 7.29's
  multi-module variant is the point at which a model becomes worth its cost.

## Validation

Typecheck and build exit 0. `npm test` 57 files / 314 tests. NestJS golden smoke
3/3; boundary smoke 7/7; container smoke 6/6; `CODEGEN_REQUIRE_NPM_SMOKE=true npm
run smoke:generated-project:nestjs` 8/8. Two consecutive generations were
byte-identical, and the identifier-only example emits the same 105 CREATE
operations. Goldens were derived by copying built-CLI output. The container image
itself was not built; see "Verification, and its honest limit" above.
