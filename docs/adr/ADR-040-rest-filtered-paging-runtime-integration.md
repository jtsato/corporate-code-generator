# ADR-040 — REST Filtered Paging Runtime Integration

## Context

REST filtering, paging runtime, and filtered paging runtime already existed
independently. `GET /wallets` still returned `List<WalletResponse>`.

## Decision

- `GET /wallets` always returns a paginated response.
- The controller uses `FindWalletsByFilterPageUseCase`.
- `filter`, `page`, and `size` are accepted together.
- REST defaults are `page=0` and `size=20`.
- `PageRequest.of(...)` remains the source of page and size validation.
- Conversion errors for `page` and `size` are translated by the existing
  `GlobalExceptionHandler` to HTTP 400.
- The REST response uses domain-specific `WalletPageResponse` because
  Springdoc 3.0.3 exposed raw generic `PageResponse<T>.items` as untyped.
  This is the approved fallback for the generic design.
- Sorting over HTTP remains future work.

## Consequences

- The HTTP contract changes from a list to `items` plus paging metadata.
- Filter and paging now use the same runtime path end to end.
- Spring Data types do not leak into REST.
- Existing clients must consume the new envelope.
- The current Wallet profile gains `WalletPageResponse.java` as its single
  new REST artifact.
