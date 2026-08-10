# wallet-service

Spring Boot multi-module service generated from an application model with a
clean-architecture Golden Path. The Maven coordinates are
`io.github.jtsato:wallet-service:0.1.0-SNAPSHOT`, targeting Java 25
and Spring Boot 4.1.0.

## Modules

| Module | Responsibility | Depends on |
| --- | --- | --- |
| `core` | Domain models, use cases, commands, gateway ports, paging, filtering and validation. Framework-free. | nothing |
| `entrypoints/rest` | REST controllers, request/response representations, filter and sort parsing. | `core` |
| `infra/database` | JPA entities, Spring Data repositories, Querydsl predicates and gateway providers. | `core` |
| `configuration` | Composition root, Spring wiring, cross-cutting configuration and the executable application. | `core`, `entrypoints/rest`, `infra/database` |

Dependencies point inward. `core` never depends on Spring, JPA or HTTP types,
and `entrypoints/rest` never depends on `infra/database`. These rules are
enforced by the generated architecture tests.

## Requirements

- JDK 25
- Maven 3.9 or newer

## Build and test

```bash
mvn clean verify
```

Run a single module with `-pl`, adding `-am` to also build what it depends on:

```bash
mvn test -pl core
mvn test -pl infra/database -am
```

## Run

```bash
mvn spring-boot:run -pl configuration -am
```

The application starts on port 8080 with an in-memory H2 database, so it needs
no external services. The OpenAPI specification is served at
`/v3/api-docs` and Swagger UI at `/swagger-ui.html`.

## HTTP API

### Wallet

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/wallets` | List, filter, sort and page active records |
| `GET` | `/wallets/{id}` | Read one active record |
| `POST` | `/wallets` | Create a record |
| `PUT` | `/wallets/{id}` | Replace a record |
| `PATCH` | `/wallets/{id}` | Partially update a record |
| `DELETE` | `/wallets/{id}` | Soft delete a record |
| `POST` | `/wallets/{id}/restore` | Restore a soft-deleted record |
| `GET` | `/wallets/deleted` | List soft-deleted records |
| `GET` | `/wallets/deleted/{id}` | Read one soft-deleted record |

Errors use a single contract: a numeric `code`, a localized `message`, and a
`fields` array that is always present and lists every invalid field.

## Configuration profiles

| Profile | Purpose |
| --- | --- |
| default | Shared safe defaults, including the in-memory datasource |
| `local` | Developer diagnostics |
| `test` | Deterministic test configuration |
| `prod` | Environment-variable references only; no usable secret defaults |

Select one with `-Dspring.profiles.active=<profile>`.

## Regenerating

This project is generated. Prefer changing the application model and
regenerating over editing generated files by hand, so that manual edits are not
lost on the next generation.
