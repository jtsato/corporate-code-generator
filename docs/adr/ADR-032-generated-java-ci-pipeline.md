# ADR-032 — Generated Java CI Pipeline

## Context

The generator already validates generated Java projects through specialized Maven smokes. Consumers of the `java-spring-clean-multimodule` Golden Path also need a minimal, self-contained CI pipeline for their generated Maven reactor. The Golden Path uses Java 25.

## Decision

Generate `.github/workflows/java-ci.yml` from the build module. The workflow uses GitHub Actions, `actions/checkout@v4`, `actions/setup-java@v4`, Temurin, the Java version supplied by the profile, Maven cache, `permissions: contents: read`, a 15-minute job timeout, and `mvn -B clean verify`.

The first foundation does not generate local scripts, Maven Wrapper, Sonar, JaCoCo, PIT, Testcontainers, Docker, release/deploy workflows, matrices, or publishing configuration.

## Consequences

Generated projects receive an independent minimal CI pipeline that validates the complete reactor, tests, and Querydsl annotation processing. Consumers can extend the workflow. Advanced quality tools and SHA pinning are deferred to future hardening milestones.
