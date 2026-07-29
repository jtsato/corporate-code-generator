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

> **GENERATOR DECISION** The multi-module Golden Path contains `build`, `core`,
> `entrypoints-rest`, `infra-database`, and `configuration`. The infrastructure
> module depends on core; configuration composes REST and infrastructure.
> Persistence technology is deferred.

> **GENERATOR DECISION** The `build` capability generates Maven Reactor POMs.
> `core` generates domain models, gateway ports, and structural find use cases
> with interactors. The interactor is deliberately unannotated: it depends only
> on the core gateway interface and is not a Spring bean until infrastructure
> and wiring exist. `entrypoints-rest` generates provisional controllers and
> responses under `<base>.entrypoint.rest.domains.<domain>`. `infra-database`
> generates an unannotated structural gateway provider that returns `List.of()`;
> it has no JPA, repository, persistence entity, or mapper. Configuration
> contributes the root Spring Boot application class and domain-specific
> `@Configuration` classes. Those classes explicitly register gateway and use
> case beans, while core and infrastructure remain unannotated plain Java.
> Configuration depends on the infrastructure module, so the complete
> multi-module profile is generable. The structural smoke compares all fifteen
> artifacts; Maven compile validation remains active. Configuration also
> generates a minimal `@SpringBootTest` context test in the application root
> package. The dedicated Spring context smoke generates the complete profile
> and runs `mvn test`, validating basic Spring wiring only; it does not test an
> HTTP endpoint, start a server manually, use Actuator, or provide a health
> check. REST controllers delegate to the generated find
> use case and map domain entities through the local `Response.from(entity)`
> factory. Mapping remains manual and local to the DTO: MapStruct and a
> dedicated mapper layer are not introduced. The infrastructure provider still
> returns `List.of()`. Infrastructure now generates structural JPA persistence
> entities backed only by `jakarta.persistence-api`; they are not yet used by
> the provider. There is no Spring Data, repository, EntityManager, DataSource,
> H2, or persistence runtime configuration.
> A manual persistence mapper is also generated for each domain, converting the
> persistence entity and domain model in both directions. It is not yet used by
> the provider; MapStruct is not introduced.

> **GENERATOR DECISION** `smoke:java-multimodule` remains structural, while
> `smoke:maven:java-multimodule` generates the complete profile and runs
> `mvn compile`. Maven absence skips by default and fails only when
> `CODEGEN_REQUIRE_MAVEN_SMOKE=true`.

> **GENERATOR DECISION** `smoke:spring-context:java-multimodule` generates the
> complete profile and runs `mvn test` to load the generated Spring context.
> It follows the same Maven availability policy as the compile smoke.

## Recommended first multi-module MVP

```text
parent POM and module POMs
core domain artifact(s)
entrypoints/rest structural controller and response artifact(s)
infra/database structural gateway provider(s)
configuration Spring Boot application
```

This MVP is intended to compile without JPA entities, repositories, mappers,
Spring wiring, or database configuration. Its infrastructure provider is a
structural implementation only.

## Roadmap 5.x

1. 5.1 — Multi-module Profile and Template Pack Skeleton.
2. 5.2 — Maven Reactor Foundation (build capability; structural smoke only).
3. 5.3 — Core Module Migration.
4. 5.4 — Configuration Module Foundation.
5. 5.5 — REST Entrypoint Module Foundation.
6. 5.6 — Multi-module Maven Compile Smoke.
7. 5.7 — Core Use Cases and Ports.
8. 5.8 — Database Infrastructure Foundation.
9. 5.9 — Spring Wiring Foundation.
10. 5.10 — REST Delegation and Runtime Validation.
11. 5.11 — Spring Context Smoke Foundation.

## Open questions and non-adopted reference details

* Whether selected partial modules must independently form a compilable Maven
  project remains undecided.
* The future build capability may generate several POM files, but no generic
  build-contribution abstraction is introduced yet.
* Lombok, MapStruct, Querydsl, JPA Entity Graph, security, OpenAPI, Docker,
  Maven Wrapper, and quality tooling require independent adoption decisions.
