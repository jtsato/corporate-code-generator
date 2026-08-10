# ADR-066 — Generated Docker Capability

## Status

Accepted — Milestone 6.45.

## Context

A generated `java-spring-clean-multimodule` project could be built and tested
with Maven, but it could not be containerized without hand-written files. The
gap analysis against the `wallet-service-java` reference recorded `Dockerfile`
and `docker-compose.yml` as present there and absent from generated output, and
recorded `.dockerignore` as absent from both while being required whenever a
`Dockerfile` exists. See
[Wallet Reference Gap Plan](../project/WALLET-REFERENCE-GAP-PLAN.md), Group A.

The reference's own `Dockerfile` is the starting point, not the specification.
It builds `walletservice-starter.jar` with a Maven builder stage, ships it on an
Alpine JRE, creates a non-root user, and declares a `HEALTHCHECK` that polls
`/actuator/health` with `wget`. Two of its properties do not survive contact
with the generated project: the jar name and the server port are
project-specific values the generator already owns, and its `docker-compose.yml`
still declares the obsolete top-level `version:` key.

One dependency was missing outright. The generated `configuration` module did
not depend on `spring-boot-starter-actuator`, so a healthcheck pointing at
`/actuator/health` would have polled a 404 forever and the container would never
have become healthy.

## Decision

### Generated artifacts

The `build` module emits three additional artifacts at the generated project
root: `Dockerfile`, `.dockerignore` and `docker-compose.yml`. All three are
unconditional.

The Wallet Reference Gap Plan proposed this milestone as an "opt-in profile
option". That part is **not executed**: no profile-option mechanism exists in
the Profile schema, the loader, or the CLI, and inventing one to gate three
files would be a larger and separate capability than the Docker artifacts
themselves. Emitting unconditionally follows the precedent
[ADR-058](ADR-058-generated-repository-hygiene.md) set for `.gitignore` and
`README.md`. If profile options are introduced later, moving these three
templates behind one is a mechanical change. This ADR is the record that the
"opt-in" half of the plan entry was deliberately deferred, not overlooked.

### Dockerfile

- Two stages. The `build` stage runs on
  `maven:3.9-eclipse-temurin-{javaVersion}-alpine`; the `runtime` stage runs on
  `eclipse-temurin:{javaVersion}-jre-alpine`. Both references are assembled in
  the adapter from the profile's `technology.languageVersion`, so a profile
  targeting a different Java version moves both images together. Both tags are
  published for `linux/amd64` and `linux/arm64`.
- The build stage copies `pom.xml` and every module POM before the sources, then
  runs `mvn -B dependency:resolve-plugins`, so the plugin layer is reused when
  only sources change. The module POM copy list is derived in the adapter from
  the same `modules` array that renders the parent POM's `<modules>` block; the
  template only iterates it. Full dependency pre-resolution
  (`dependency:go-offline`) is not used because the reactor's own modules are
  dependencies of each other and are not resolvable before the reactor builds.
- The package step is `mvn -B -DskipTests -pl configuration -am package`. Tests
  are skipped in the image build because the generated CI workflow already runs
  `mvn -B clean verify` on every push and pull request; running them twice
  would double CI time for no additional signal.
- The jar the runtime stage copies is
  `/build/configuration/target/{artifactId}-starter.jar`, built from the same
  `executableFinalName` constant that renders the `configuration` module's
  `<finalName>`. The Dockerfile therefore cannot reference a jar name the build
  does not produce. It is renamed to `/app/application.jar` in the image so the
  `ENTRYPOINT` does not vary per application.
- The runtime stage creates the group and user `spring` at GID/UID `10001`,
  copies the jar with `--chown=10001:10001`, and declares `USER 10001:10001`.
  Numeric IDs are used in `USER` so that a Kubernetes
  `runAsNonRoot` admission check can verify the image without resolving names.
  The user gets no home directory and `/sbin/nologin` as its shell.
- `ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"` sizes the
  heap from the container's memory limit rather than from the host's RAM.
- `HEALTHCHECK` polls `http://localhost:{port}/actuator/health` with `wget`,
  which BusyBox provides on the Alpine base image with no extra layer.

### Actuator

- The generated `configuration` module gains a
  `spring-boot-starter-actuator` dependency, version-managed by the Spring Boot
  parent like every other starter.
- Generated `application.yaml` declares the policy explicitly rather than
  relying on framework defaults:
  `management.endpoints.web.exposure.include: health` and
  `management.endpoint.health.show-details: never`. Only the endpoint the
  healthcheck needs is reachable over HTTP, and it reveals no component detail
  (datasource URLs, disk paths) to an unauthenticated caller. Both values match
  current Spring Boot defaults; they are written out because a generated project
  should not silently inherit a security-relevant default that a framework
  upgrade could change.

### Single source of truth for the runtime contract

The server port (`8080`) and the health path (`/actuator/health`) are declared
once, in `spring/SpringRuntimeContract.ts`, and consumed by both the `build`
producer (`EXPOSE`, `HEALTHCHECK`, Compose port mapping, README) and the
`configuration` producer (`application.yaml`, the generated health test). The
port was previously a literal inside `application.yaml.njk`; it is now
interpolated. This is the same reasoning ADR-058 applied to
`toRestCollectionPath`: a container healthcheck that drifts from the port or
path the application actually serves is a defect the generator can make
structurally impossible.

### Generated health test

The `configuration` module gains one generated test per application (not per
entity), `smoke/ActuatorHealthSmokeTests`. It starts the application on a random
port, requests the same health path the Dockerfile polls, and asserts `200`,
`status: UP`, and the absence of a `components` field. This is the smoke gate
matching the capability: without it, a broken healthcheck target would only be
discovered by running a container, which the generator's quality gates cannot
do.

### Compose file

`docker-compose.yml` declares one service that builds the local `Dockerfile`,
tags the image `{artifactId}:{version}`, maps the port one-to-one, and sets
`restart: unless-stopped`. No top-level `version:` key is emitted; it is
obsolete in the Compose Specification and current Docker Compose warns about it.
No `environment:` block is emitted either — the generated application already
runs against in-memory H2 with no configuration, so any value here would be a
default restated in a second place.

### `.dockerignore`

A static template with no model, covering build output, `.git`, the container
files themselves, CI, coverage output, IDE metadata and OS files. Excluding
`target/` matters most: without it, `COPY . .` would ship the host's build
output into the builder stage and invalidate the layer cache on every local
build.

In the golden tree the file is stored as `dockerignore`, without its leading
dot, and both golden harnesses map the target path through a shared
`dotlessGoldenPaths` map. The `.gitignore` mapping that map now also holds
exists because a literal `.gitignore` under `tests/golden/` would act as a live
ignore file over the golden tree; `.dockerignore` joins it so both root ignore
files read alike.

## Alternatives rejected

- **Copying the reference's Dockerfile verbatim**: rejected. Its jar name,
  server port (8081), and user/group names (`ragnarok`, UID 1000/GID 2000) are
  project-specific. UID 1000 in particular is the first ordinary user on most
  base images and can collide with an existing account; 10001 is outside that
  range.
- **A distroless or Ubuntu-based JRE runtime image**: rejected. Neither ships a
  usable HTTP client, so the `HEALTHCHECK` would need either an extra package
  layer or a Java-based probe process started on every interval. Alpine's
  BusyBox `wget` costs nothing.
- **Building the image from a pre-built jar (`COPY target/*.jar`) instead of a
  builder stage**: rejected. It makes the image build depend on undeclared host
  state — whoever runs `docker build` must have run the right Maven command
  first — which contradicts the reproducibility the multi-stage build provides.
- **Running the reactor's tests inside the image build**: rejected as duplicated
  CI work, as described above.
- **Pinning base images by digest rather than tag**: rejected for now. It is the
  logical analogue of the SHA pinning [ADR-065](ADR-065-generated-ci-hardening.md)
  applied to GitHub Actions, but a digest pins a single architecture-specific
  manifest unless the multi-arch index digest is used, and the generator has no
  mechanism to refresh a digest as base images receive security patches. A stale
  digest is a worse default than a floating patch tag for a runtime image. This
  is the one place where this ADR knowingly differs from ADR-065's reasoning.
- **Exposing `management.endpoints.web.exposure.include: "*"`**: rejected. It
  would publish `env`, `configprops`, `beans` and `mappings` unauthenticated on
  the application's own port.
- **Adding Kubernetes liveness/readiness probe groups
  (`management.endpoint.health.probes.enabled`)**: rejected as scope expansion.
  No deployment capability exists yet to consume them.
- **Emitting a Compose service for a database**: rejected. The generated
  application runs on in-memory H2 by default; a Postgres service in Compose
  would imply a datasource configuration the generated project does not have.
- **Making the three files an opt-in profile option**: deferred, with the
  reasoning recorded under "Decision" above.

## Scope boundary

This decision touches the `build` and `configuration` modules of the
`java-spring-clean-multimodule` profile. It does not change the parent or module
POMs beyond the single Actuator dependency, the CI workflow from ADR-065, the
JaCoCo configuration from ADR-060, the Maven dependency governance from
ADR-059, the single-module `java-spring-clean` profile, or the
`nestjs-clean-architecture` profile. It adds no Maven wrapper, no developer run
scripts, and no Kubernetes or Helm artifacts.

## Consequences

- The full-profile dry-run count rises from 156 to 160 CREATE operations, and
  the `build`-module count from 8 to 11. The `configuration` module gains the
  one generated health test.
- A generated project can be built and run as a container with
  `docker compose up --build`, with no hand-written file.
- The generated application now exposes `/actuator/health` in every profile,
  including production. This is intentional and is the healthcheck contract;
  it exposes no detail beyond `UP`/`DOWN`.
- Bumping the Maven builder or JRE base image is a one-line constant change in
  `JavaSpringCleanMultimoduleBuildArtifactProducer`, matching the ADR-059 and
  ADR-065 pattern.
- The generated project's container behavior is **not** verified by any
  automated gate, because no Docker daemon is available in the repository's
  toolchain. What is verified is everything the Dockerfile depends on: the jar
  path matches the module's `finalName`, and the healthcheck path returns
  `200 UP` against the running application. See "Validation".

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing, 48 files).
- `npm run smoke:java-multimodule` (golden byte comparison over all 160
  artifacts, including the three new Docker files and the regenerated
  `README.md`, `configuration/pom.xml` and `application.yaml`).
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:maven-reactor:java-multimodule`.
- `mvn -B test` against a freshly generated `examples/wallet-service` project:
  Reactor `BUILD SUCCESS` across all five modules, `configuration` running 117
  tests with 0 failures, including the new
  `ActuatorHealthSmokeTests.healthEndpointReportsUp`.
- Full-profile dry-run: 160 CREATE.
- Both base image tags were confirmed published for `linux/amd64` and
  `linux/arm64`.
- No `docker build` was run: no Docker daemon is available in this environment.
