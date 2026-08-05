# Reference Architecture

## Configuration profiles and CORS

The multi-module Java configuration capability generates base, local, test, and production YAML files without a global active profile. Spring tests explicitly select `test`. CORS is bound through `CorsProperties` and applied by `CorsWebConfiguration`; production requires `APPLICATION_CORS_ALLOWED_ORIGINS`, while Security integration remains out of scope.

## Core validation

The multi-module Golden Path has 110 artifacts (build 6, Core 42, entrypoints-rest 59, Infra 60, and Configuration 110). Because `entrypoints-rest` and `infra-database` require `core`, their selection counts include Core transitively; their own production remains 17 and 18. Its build module generates a minimal GitHub Actions Java CI workflow using Java 25, Maven cache, and `mvn -B clean verify`. Core Filter Common provides validated filter operators, conditions, groups, and expressions. The REST Filter Contract Foundation in `entrypoint.rest.common.filter`, with per-domain definitions in `entrypoint.rest.domains.<domain>.filter`, parses the HTTP contract into `FilterExpression`. The REST Sort Contract Foundation in `entrypoint.rest.common.sort`, with per-domain definitions in `entrypoint.rest.domains.<domain>.sort`, parses strict repeatable sort expressions into `SortOrder`. Infra also generates entity-aware Querydsl filter definitions and sort property mappings from each entity's actual attributes and Java types.

Querydsl filtering is wired to the persistence runtime. The generated flow is `FilterExpression -> QuerydslFilterMapper -> ListQuerydslPredicateExecutor -> repository -> gateway -> Find<Entity>ByFilterUseCase`. Each core gateway exposes `findByFilter(FilterExpression)` next to the untouched `findAll()`; each repository extends `ListQuerydslPredicateExecutor` alongside `JpaRepository`; the provider applies the predicate and falls back to `repository.findAll()` when the expression is empty. Null rejection lives in the interactor as a `ValidationException` keyed `common.filter.expression.required`, while the provider states only an `Objects.requireNonNull` precondition. Configuration registers the filtered use case as an explicit third bean, and `ArchitectureTests` forbids `com.querydsl..` inside `core..`. The executor choice was proven by Maven compile, Spring context, and H2 persistence gates rather than assumed; see [ADR-036](../adr/ADR-036-querydsl-filter-runtime-integration.md).

REST query parameters now reach the combined runtime: `HTTP query params -> RestFilterParser + RestSortParser + PageRequest -> FilterExpression + PageRequest -> Find<Entity>ByFilterPageUseCase -> QuerydslFilterMapper + SpringDataPageRequestMapper(sortPropertyMapping) -> JPA/H2 -> WalletPageResponse`. `WalletController` binds repeatable `filter` and `sort`, optional `page`, and optional `size`; defaults are 0 and 20. `RestFilterWebConfiguration` preserves commas inside a single `in` value. Filter, sort, page, and size validation errors become HTTP 400 through the existing `GlobalExceptionHandler`. The response uses domain-specific `WalletPageResponse` because Springdoc 3.0.3 does not resolve the generic `PageResponse<T>` item schema; see [ADR-040](../adr/ADR-040-rest-filtered-paging-runtime-integration.md) and [ADR-041](../adr/ADR-041-rest-sorting-runtime-integration.md). OR/nested REST syntax and advanced sorting remain future work.

Individual reads are available through `GET /wallets/{id}`. `FindWalletByIdUseCase` validates a non-null identifier, delegates to the Core gateway, and keeps persistence absence outside the Core contract. The provider maps `JpaRepository.findById` absence to `NotFoundException`; `GlobalExceptionHandler` translates it to HTTP 404, while malformed UUID path values return HTTP 400. The endpoint is documented in OpenAPI and validated through the Core, H2 persistence, and real HTTP smoke paths; see [ADR-042](../adr/ADR-042-find-by-id-runtime-and-rest-integration.md).

Create runtime is implemented without HTTP. `Create<Entity>Command` supplies
the identifier, `Create<Entity>UseCase` constructs the domain entity, and
`<Entity>Gateway.create` reaches `JpaRepository.existsById` and then `save`
through the persistence provider and mapper. The command and domain validate
required values. Duplicate IDs raise the Core `ConflictException` before save
in the normal runtime path; the database primary key remains the final physical
barrier. The `existsById` plus `save` sequence is not fully atomic under
concurrency. See [ADR-043](../adr/ADR-043-create-runtime-integration.md) and
[ADR-044](../adr/ADR-044-create-conflict-runtime-integration.md).

## Core paging

`core.common.paging` provides Spring-free `PageRequest`, `PageResult`, `SortDirection`, and `SortOrder`. Paging and sorting validation use `ValidationException`; HTTP sorting is translated by `RestSortParser` and applied by `SpringDataPageRequestMapper` through generated property mappings.

## Filtered paging runtime

Milestone 6.17 composes the existing filter and paging runtimes without HTTP or OpenAPI exposure. The generated flow is `FilterExpression + PageRequest -> Find<Entity>ByFilterPageUseCase -> <Entity>Gateway.findByFilterPage -> QuerydslFilterMapper + SpringDataPageRequestMapper -> ListQuerydslPredicateExecutor.findAll(predicate, pageable) -> SpringDataPageResultMapper -> PageResult<Entity>`. An empty filter uses `findAll(pageable)`. The repository contract remains unchanged, and configuration registers the combined use case explicitly. See [ADR-039](../adr/ADR-039-filtered-paging-runtime-integration.md).

This document describes the minimal Wallet reference and the decisions derived
from it. The broader Bookstore analysis is documented in
[Extended Reference Architecture](EXTENDED-REFERENCE-ARCHITECTURE.md).

Wallet remains the minimal generation and deterministic-validation reference.
`java-clean-architecture-example` is an advanced architectural reference used
to identify optional and technology-specific capabilities. Neither project is
to be copied literally.

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
> generates an annotation-free gateway provider, a JPA persistence entity, a
> manual mapper, and a Spring Data repository. The provider delegates `findAll`
> to the repository and maps persistence entities back to domain models. Configuration
> contributes the root Spring Boot application class and domain-specific
> `@Configuration` classes. Those classes explicitly register gateway and use
> case beans, while core and infrastructure remain unannotated plain Java.
> Configuration depends on the infrastructure module, so the complete
> multi-module profile is generable. The structural smoke compares all sixty-three
> artifacts; Maven compile validation remains active. Configuration also
> generates a minimal `@SpringBootTest` context test in the application root
> package and one HTTP runtime smoke test per entity. The HTTP test starts the
> application with `RANDOM_PORT`, calls the generated collection endpoint with
> the JDK `java.net.http.HttpClient`, and validates status `200`, body `[]`, and
> a JSON content type. The context smoke covers Spring context, JPA bootstrap,
> repository discovery, and explicit wiring. The HTTP runtime smoke extends
> that proof through Spring MVC, the use case, gateway, Spring Data repository,
> and the empty H2 test database. Configuration also generates one HTTP
> persistence read test per entity. That test uses the Spring Data repository
> only to arrange a known persistence entity, flushes it to H2, and verifies
> exclusively through real HTTP that the values traverse the provider,
> persistence mapper, domain model, response DTO, and JSON serialization.
> Deterministic test fixtures are prepared by a Java adapter resolver from
> semantic primitive types and occurrence indexes; Java types and imports
> remain the responsibility of `JavaTypeResolver` and `JavaImportCollector`.
> Optional attributes receive non-null fixtures, and attribute order is
> preserved in constants, entity construction, and exact expected JSON.
> `TestRestTemplate` is not introduced. REST controllers
> delegate to the generated find
> use case and map domain entities through the local `Response.from(entity)`
> factory. Mapping remains manual and local to the DTO: MapStruct and a
> dedicated REST mapper layer are not introduced. Infrastructure generates JPA
> persistence entities backed by `spring-boot-starter-data-jpa`; each repository
> operates on its persistence entity. H2 exists
> only on the `configuration` test runtime classpath; there is no production
> DataSource, EntityManager usage, or persistence runtime configuration.
> A manual persistence mapper is also generated for each domain, converting the
> persistence entity and domain model in both directions. The provider uses its
> repository and mapper for the read path and remains annotation-free;
> configuration injects the discovered repository explicitly. MapStruct is not
> introduced. The endpoint can reach a configured database for reads, but there
> is no production DataSource, migration strategy, or complete CRUD. The
> create runtime is exercised only through the Core and H2 persistence test
> path; REST remains read-only.

> **GENERATOR DECISION** `smoke:java-multimodule` remains structural, while
> `smoke:maven:java-multimodule` generates the complete profile and runs
> `mvn compile`. Maven absence skips by default and fails only when
> `CODEGEN_REQUIRE_MAVEN_SMOKE=true`.

> **GENERATOR DECISION** `smoke:spring-context:java-multimodule` generates the
> complete profile and runs only `*ApplicationTests` to load the generated
> Spring context. `smoke:http:java-multimodule` separately runs only
> `*HttpSmokeTests`, exercising the generated empty-list endpoint over a real
> HTTP server on a random port.
> `smoke:http-persistence-read:java-multimodule` runs only
> `*HttpPersistenceReadTests`, persists a known entity in the test-only H2
> database, and validates its exact representation through the full HTTP read
> path. The three smokes follow the same Maven availability policy as the
> compile smoke. They do not add Actuator, a healthcheck, a production write
> path, global seed data, or full CRUD.

> **GENERATOR DECISION** The multi-module Golden Path generates
> `configuration/src/test/java/<base>/architecture/ArchitectureTests.java` and
> adds ArchUnit as a test dependency of `configuration`. The test imports only
> production classes, excluding tests, and validates that core has no outward
> dependencies or Spring dependency, entrypoint has no infra dependency,
> controllers have no repository dependency, JPA entities reside in infra
> entity packages, and repositories reside in infra repository packages.
> `smoke:archunit:java-multimodule` executes only this test separately after
> compilation and before runtime smokes.

> **GENERATOR DECISION** The multi-module Golden Path exposes `ResponseStatus`
> as its REST error contract. Core exceptions remain HTTP-free and are
> translated in `configuration` by `GlobalExceptionHandler`, using message
> bundles and Accept-Language. Validation, not-found and unexpected errors map
> to 400, 404 and 500; fields are deterministic and no sensitive error details
> are included. `smoke:error-handling:java-multimodule` validates the foundation.

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
