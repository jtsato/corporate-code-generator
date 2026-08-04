# ADR-042 — Find By ID Runtime and REST Integration

## Context

The multi-module Golden Path already supports filtered, paginated and sorted collection reads, but it did not provide an individual read operation. `NotFoundException` and the REST error translation foundation already exist.

## Decision

Generate `Find<Entity>ByIdUseCase` and its interactor for every entity with exactly one identifier. The Core gateway gains `findById(identifier)` and remains free of `Optional`, Spring Data, JPA and REST types. The interactor rejects a null identifier with `ValidationException` using `common.identifier.required`.

The persistence provider calls `JpaRepository.findById`, maps a present persistence entity to the domain entity and translates absence to `NotFoundException`. Configuration wires the use case explicitly. The REST controller exposes `GET /<entities>/{id}` and documents 200, 400, 404 and 500 in OpenAPI. Invalid UUID path values reuse the existing type-mismatch handler and return 400.

## Consequences

- The generated API supports individual read operations with 200/400/404 behavior.
- Gateway fakes must evolve with the new Core contract.
- Core, H2 persistence and real HTTP tests verify the complete flow.
- POST, PUT, PATCH, DELETE, request DTOs, optimistic locking, events, authorization, ownership checks and soft delete remain outside this milestone.
