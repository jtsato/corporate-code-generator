# ADR-059 — Generated Maven Build Governance

## Status

Accepted — Milestone 6.38.

## Context

The generated parent POM declared only `modules` and five properties. Every
third-party version and every internal module version lived in the module POMs
that consumed them:

- `springdoc-openapi-starter-webmvc-ui` carried `${springdoc-openapi.version}`
  in `entrypoints/rest`;
- `archunit-junit5` carried `${archunit.version}` in `configuration`;
- `querydsl-jpa` carried a hardcoded `5.1.0` in `infra/database`, and the
  Querydsl APT `annotationProcessorPaths` block hardcoded `5.1.0`, `3.2.0` and
  `3.0.0` again in the same file;
- each of the four modules repeated `org.junit.jupiter:junit-jupiter` with
  `test` scope;
- each internal dependency repeated `<version>${project.version}</version>`.

The `querydsl-jpa` runtime dependency and the `querydsl-apt` processor could
therefore drift to different versions without any build failure, which is the
specific class of defect a parent POM exists to prevent.

The generated `configuration` module also produced
`wallet-service-configuration-0.1.0-SNAPSHOT.jar`. A version-bearing artifact
name means anything downstream that references the jar — a container image
build, a deployment script — has to be edited on every version bump.

## Decision

- The generated parent POM gains a `<dependencyManagement>` block that pins the
  three internal module artifacts at `${project.version}` and the three
  versioned third-party artifacts (`springdoc-openapi-starter-webmvc-ui`,
  `querydsl-jpa` with its `jakarta` classifier, and `archunit-junit5`). Module
  POMs declare these dependencies by coordinates and scope only, with no
  `<version>`.
- The generated parent POM gains a `<dependencies>` block holding
  `org.junit.jupiter:junit-jupiter` at `test` scope, inherited by all four
  modules. The per-module declarations are removed. Every generated module has
  tests, so there is no module for which this inheritance is unwanted.
- Querydsl and Jakarta annotation-processor versions move into parent
  properties `querydsl.version`, `jakarta-persistence.version` and
  `jakarta-annotation.version`. The `infra/database` APT configuration
  references those properties, so the Querydsl runtime dependency and the
  Querydsl processor now resolve from one property.
- The parent POM gains `<name>` and `project.reporting.outputEncoding`.
- The generated `configuration` module sets
  `<finalName>{{ artifactId }}-starter</finalName>`, producing a stable,
  version-free `wallet-service-starter.jar`.
- Shared test libraries beyond JUnit are **not** added. The generated tests use
  JUnit Jupiter assertions only; adding AssertJ or Mockito to the parent would
  ship dependencies no generated code imports.

## Alternatives rejected

- **A `<pluginManagement>` block pinning compiler, Surefire and Failsafe
  versions**: rejected because the generated parent already inherits from
  `spring-boot-starter-parent`, which manages those plugin versions. Restating
  them would override Boot's tested combination with a second, independently
  drifting source of truth, and would need manual maintenance at every Boot
  upgrade for no gain.
- **Copying the reference's parent-level shared dependencies (Mockito,
  AssertJ, the core module at compile scope)**: rejected because the generated
  code imports none of them, and putting a specific module in the parent's
  `<dependencies>` would make every module — including `core` itself — depend
  on `core`.
- **Leaving Querydsl versions hardcoded in the APT block**: rejected because
  it is the exact drift risk described above; the runtime artifact and the
  annotation processor must move together.
- **Naming the executable jar after the application rather than
  `<artifactId>-starter`**: rejected because `wallet-service.jar` inside
  `configuration/target/` gives no signal about which module produced it; the
  `-starter` suffix names the role, matching the reference's convention.
- **Adding JaCoCo, PIT or Sonar in this milestone**: rejected as scope
  expansion. Coverage is Milestone 6.39, mutation testing is 6.48, and
  static-analysis coordinates are organization-specific.

## Scope boundary

This decision does not add coverage, mutation, or analysis plugins, does not
change the Spring Boot version, does not change which dependencies the
generated modules use, and does not touch the `java-spring-clean` or
`nestjs-clean-architecture` profiles.

## Consequences

- A version change for Querydsl, Springdoc or ArchUnit is a one-line edit in
  the generated parent POM.
- Module POMs shrink and read as statements of what a module needs rather than
  where versions come from.
- The executable artifact has a stable path,
  `configuration/target/{{ artifactId }}-starter.jar`, which the future Docker
  capability can reference without knowing the project version.
- Artifact counts are unchanged; this milestone rewrites five existing POMs and
  adds no files.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison).
- `mvn -B clean test` against a freshly generated `examples/wallet-service`
  project: BUILD SUCCESS, 54 core tests, 14 REST tests, 17 infra-database
  tests, and the full `configuration` suite.
- `mvn -B clean verify -DskipTests` against the same project: BUILD SUCCESS,
  producing `configuration/target/wallet-service-starter.jar`.
