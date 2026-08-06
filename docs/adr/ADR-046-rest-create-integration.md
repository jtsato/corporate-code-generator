# ADR-046 — REST Create Integration

## Status

Accepted.

## Context

The `java-spring-clean-multimodule` Golden Path already provides collection
reads, filtered paging, sorting, `GET /<entities>/{id}`, and a Core/JPA create
runtime with duplicate-ID conflict detection. It did not expose creation over
HTTP.

## Decision

Expose `POST /<entities>` through a generated REST request DTO,
`Create<Entity>Request`, which converts to `Create<Entity>Command` through
`toCommand()`. Keep functional validation in the Core command and do not add
Jakarta Validation annotations or `@Valid` to the REST DTO.

Successful creation returns HTTP `201 Created`, a relative `Location` header
pointing to `/<entities>/{id}`, and the generated `<Entity>Response` body.
`ConflictException` maps to HTTP 409 through the existing
`GlobalExceptionHandler`. `HttpMessageNotReadableException` maps to HTTP 400
using the existing `common.error.invalid-request` message.

The identifier remains supplied by the client. Server-side ID generation,
update/delete operations, idempotency, advanced transactions, retry, and
robust concurrent constraint translation remain future capabilities.

## Consequences

- Clients can create and then read a resource through the generated API.
- The request DTO is REST-specific and does not expose the domain entity.
- H2-backed HTTP tests verify persistence and the complete request path.
- Duplicate-ID behavior is visible as a stable HTTP 409 contract.
- The `existsById` plus `save` sequence remains non-atomic under concurrency.
- The full Wallet profile grows from 110 to 112 generated artifacts.
