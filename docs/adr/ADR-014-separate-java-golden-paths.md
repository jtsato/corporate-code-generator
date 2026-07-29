# ADR-014 — Separate Java Golden Paths

## Status

Accepted

## Context

The existing `java-spring-clean` Golden Path generates a single-module Maven
project. The extracted Wallet Service reference architecture is Maven
multi-module and separates core business code, REST entrypoints, configuration,
and database infrastructure.

The reference is an architectural input. Its Java version, Spring Boot
version, and selected libraries are observed historical facts rather than
implicit generator requirements.

## Decision

`java-spring-clean` remains the supported Java single-module Golden Path.

`java-spring-clean-multimodule` is introduced as an independent Java Golden
Path. Each profile has its own Template Pack and physical layout. The new
profile does not migrate, replace, or silently alter the existing profile.

The reference architecture guides responsibilities and structure. It does not
automatically fix Java or Spring Boot versions, nor does it require Lombok,
MapStruct, Querydsl, or JPA Entity Graph. Java 22, Spring Boot 3.4.2, and those
libraries are facts observed in the reference project only.

## Consequences

* Future Golden Tests and smoke tests are separated by Java Golden Path.
* The CLI may keep explicit profile composition until a concrete need for a
  registry exists.
* The single-module profile remains supported and behaviorally unchanged.
* The multi-module profile can evolve without coupling its Maven layout or
  templates to the single-module Template Pack.
