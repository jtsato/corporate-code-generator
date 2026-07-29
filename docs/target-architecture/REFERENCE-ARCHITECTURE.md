# Reference Architecture

## Scope and terminology

This document records the architecture observed in
`wallet-service-springboot.zip` and distinguishes it from decisions made for
Corporate Code Generator.

> **REFERENCE FACT** describes an artifact or behavior observed in the ZIP.
>
> **GENERATOR DECISION** describes an approved direction for this repository.

The reference informs a future Java multi-module Golden Path. It is not copied
as an unqualified template.

## Reference facts

### Maven modules

> **REFERENCE FACT** The root Maven project has artifact id
> `walletservice-application`, packaging `pom`, and Spring Boot parent
> `3.4.2`. It aggregates four modules:

```text
configuration
core
entrypoints/rest
infra/database
```

| Directory | Artifact id | Packaging | Declared parent |
| --- | --- | --- | --- |
| root | `walletservice-application` | `pom` | `spring-boot-starter-parent:3.4.2` |
| `configuration` | `walletservice-configuration` | `jar` | root project |
| `core` | `walletservice-core` | `jar` | none |
| `entrypoints/rest` | `walletservice-rest` | `jar` | root project |
| `infra/database` | `walletservice-database` | `jar` | root project |

> **REFERENCE FACT** The root `modules` list uses leading slashes for
> `entrypoints/rest` and `infra/database`. This is recorded, not adopted as a
> layout convention.

### Dependency graph

> **REFERENCE FACT** The declared internal dependencies are:

```text
core
entrypoints-rest -> core
infra-database -> core
configuration -> core, entrypoints-rest, infra-database
```

No dependency from REST to database, from database to REST, or internal cycle
was observed.

### Packages and responsibilities

> **REFERENCE FACT** `core` contains domain records/models, commands, use-case
interfaces and implementations, gateway interfaces, common utilities,
validation, paging, and business exceptions.

```text
io.github.jtsato.walletservice.core.domains.*.model
io.github.jtsato.walletservice.core.domains.*.usecase
io.github.jtsato.walletservice.core.domains.*.xcutting
io.github.jtsato.walletservice.core.common
io.github.jtsato.walletservice.core.exception
```

> **REFERENCE FACT** `entrypoints/rest` contains HTTP controllers, API method
interfaces, request/response DTOs, presenters, and web-related helpers.

```text
io.github.jtsato.walletservice.entrypoint.rest.domains.*
io.github.jtsato.walletservice.entrypoint.rest.common
io.github.jtsato.walletservice.entrypoint.rest.common.metric
```

> **REFERENCE FACT** `infra/database` contains gateway implementations
(providers), JPA entities, repositories, mappers, query helpers, and database
utilities.

```text
io.github.jtsato.walletservice.infra.domains.*
io.github.jtsato.walletservice.infra.common
io.github.jtsato.walletservice.infra.common.predicate
```

> **REFERENCE FACT** `configuration` contains the Spring Boot main class,
JPA repository enablement, MVC/CORS/locale/message configuration, Swagger,
security configurations, and REST exception handlers.

### Artifact catalog

> **REFERENCE FACT** The ZIP contains domain models, use-case commands,
interfaces and implementations, gateway interfaces, REST controllers, API
method interfaces, request/response DTOs, presenters, JPA entities, Spring
Data repositories, providers, mappers, Spring configuration classes, exception
handlers, unit/integration tests, ArchUnit tests, and SQL resources.

> **REFERENCE FACT** It also contains Dockerfile, Docker Compose, Maven Wrapper,
README, C4 diagrams, `Smoke.http`, Lombok configuration, and scripts.

### Runtime, configuration, quality and operations

> **REFERENCE FACT** The reference declares Java 22 and Spring Boot 3.4.2. It
uses Lombok, MapStruct, Querydsl, JPA Entity Graph, H2, Springdoc, ArchUnit,
JaCoCo, PIT, and Maven-based tests.

> **REFERENCE FACT** The `core` POM has no Maven parent even though it is an
aggregated module. The component diagram labels use cases as `@Service`, while
the inspected use-case implementation uses `@Named`.

> **REFERENCE FACT** The Dockerfile comment refers to OpenJDK 22, while its
base image is `openjdk:17-alpine`. This conflict is recorded and is not a
generator standard.

## Comparison with the current generator

The current `java-spring-clean` profile produces a single Maven project with
`domain`, `application`, `bootstrap`, and `api-rest` capabilities. The
reference separates the analogous concerns into `core`, `entrypoints/rest`,
and `configuration`, and adds database infrastructure.

The existing File Plan and Template Pack contracts already support multiple
relative output paths. The future work is therefore profile-, producer-, and
template-specific; it does not require the Core to know Maven module layout.

## Generator decisions

> **GENERATOR DECISION** Preserve `java-spring-clean` unchanged and add
> `java-spring-clean-multimodule` as an independent Golden Path with an
> independent Template Pack.

> **GENERATOR DECISION** Do not implicitly copy reference Java/Spring versions
> or libraries.

> **GENERATOR DECISION** The first multi-module MVP contains `build`, `core`,
> `entrypoints-rest`, and `configuration`. Persistence is deferred.

> **GENERATOR DECISION** The `build` capability generates Maven Reactor POMs,
> `core` generates domain models, and `entrypoints-rest` generates provisional
> controllers and responses under
> `<base>.core.domains.<domain>.model`. Complete multi-module generation is not
> available until configuration has a concrete producer. REST controllers return
> `List.of()` and do not yet use use cases, ports, persistence, or mappers.

## Recommended first multi-module MVP

```text
parent POM and module POMs
core domain artifact(s)
entrypoints/rest structural controller and response artifact(s)
configuration Spring Boot application
```

This MVP is intended to compile without `infra/database`, JPA entities,
repositories, providers, or database configuration.

## Roadmap 5.x

1. 5.1 — Multi-module Profile and Template Pack Skeleton.
2. 5.2 — Maven Reactor Foundation (build capability; structural smoke only).
3. 5.3 — Core Module Migration.
4. 5.4 — Configuration Module Foundation.
5. 5.5 — REST Entrypoint Module Foundation.
6. 5.6 — Multi-module Maven Compile Smoke.
7. 5.7 — Core Use Cases and Ports.
8. 5.8 — Database Infrastructure Foundation.
9. 5.9 — Operational and Quality Alignment.

## Open questions and non-adopted reference details

* Whether selected partial modules must independently form a compilable Maven
  project remains undecided.
* The future build capability may generate several POM files, but no generic
  build-contribution abstraction is introduced yet.
* Lombok, MapStruct, Querydsl, JPA Entity Graph, security, OpenAPI, Docker,
  Maven Wrapper, and quality tooling require independent adoption decisions.
