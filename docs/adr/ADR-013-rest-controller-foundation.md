# ADR-013 — REST Controller Foundation

## Status

Accepted

## Decision

The `java-spring-clean` Profile introduces an `api-rest` module requiring
`application`. Its initial controllers live in the `<base>.api` package and
are structural `@RestController` classes with `@RequestMapping`, without
endpoints or application-service injection.

The Maven build includes `spring-boot-starter-web` only when `api-rest` is
among the resolved modules. Dependency ordering remains deterministic and no
generic build-contribution system is introduced.

REST collection paths use intentionally naive kebab-case plus `s` pluralization
as a temporary convention.

## Scope exclusions

This decision does not introduce DTOs, endpoints, persistence, validation,
security, OpenAPI, Java tests, or other web behavior.
