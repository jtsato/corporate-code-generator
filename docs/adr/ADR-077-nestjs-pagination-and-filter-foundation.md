# ADR-077: NestJS Pagination and Filter Foundation

* Status: Accepted
* Date: 2026-08-11
* Milestone: 7.12

## Context

The generated NestJS API had collection creation and individual reads but no reusable collection-query contract. The Java Golden Path already establishes page metadata and filter expressions as semantic concepts.

## Decision

Generate technology-neutral `PageRequest`, `PageResult`, and `FilterExpression` concepts in Core. Expose collection reads as zero-based pages with defaults `page=0`, `size=20`, a maximum size of 100, and `filter=field:operator:value`. The initial operators are `eq` and `ne`; repeated filters are combined with AND. Parsing remains in the web module and persistence applies the expression through the gateway.

## Consequences

Generated APIs now return `items`, `page`, `size`, `totalItems`, and `totalPages`. Sorting, advanced operators, and database-specific query translation remain separate capabilities.
