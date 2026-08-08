# ADR-016 — Spring Data Repository Foundation in Infra Database

## Status

Accepted. Partially superseded by ADR-056 — the H2 scope and the deferred production DataSource decision were revised.

## Context

The multi-module `infra-database` capability already generates a JPA entity
and a manual persistence mapper. It now needs a real repository abstraction,
while the generated Spring context must continue to start successfully.

## Decision

Generate Spring Data `JpaRepository` interfaces in `infra-database`. Replace
the direct `jakarta.persistence-api` dependency with
`spring-boot-starter-data-jpa`. Add H2 only to the test runtime of the
`configuration` module so its `@SpringBootTest` can bootstrap JPA and the
repositories. Keep the gateway provider independent of the repository in this
milestone.

## Consequences

* The context smoke validates JPA and repository bootstrap against a test DataSource.
* H2 is not a production runtime dependency.
* Provider integration with repository and mapper remains future work.
* Persistence still does not affect the generated HTTP endpoint.
* Production DataSource and migration decisions remain deferred.
