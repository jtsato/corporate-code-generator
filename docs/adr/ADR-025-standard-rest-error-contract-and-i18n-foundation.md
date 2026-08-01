# ADR-025 — Standard REST Error Contract and i18n Foundation

## Status

Accepted

## Decision

`ResponseStatus` is the REST error contract in `entrypoints-rest`. Core
exceptions contain a message key and default message but no HTTP concerns.
`GlobalExceptionHandler` in `configuration` translates them through Spring's
`MessageSource` and the default Accept-Language resolution. Validation,
not-found and unexpected errors map to 400, 404 and 500 respectively.

The initial body contains only `code`, `message` and deterministic `fields`.
It excludes timestamps, paths, trace identifiers, exception details and stack
traces. No validation dependency or `ConstraintViolationException` handling is
introduced.
