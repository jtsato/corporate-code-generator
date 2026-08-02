# ADR-034 — REST Filter Contract Foundation

## Context

Core Filter Common exists, while Querydsl mapping and repository integration remain future work. REST must not expose JPA, Querydsl, or database concepts.

## Decision

Generate a passive REST contract using repeatable `filter=<field>:<operator>[:<value>]` query values. Lowercase aliases are parsed into `FilterExpression`; values remain strings and multiple filters form an AND group. Per-entity allowlists map `publicName` to `domainName`. No controller wiring, runtime integration, or OpenAPI documentation is generated.

## Consequences

The contract validates fields and operators before a future mapper. OR, nested groups, comma escaping, Querydsl mapping, and runtime filtering remain future work; `GET /wallets` is unchanged.
