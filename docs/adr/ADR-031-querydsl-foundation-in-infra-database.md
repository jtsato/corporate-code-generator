# ADR-031 — Querydsl Foundation in Infra Database

Querydsl 5.1.0 with the Jakarta classifier is configured only in Infra Database. Maven annotation processing generates Q-types under `target/generated-sources/annotations`; they are not versioned. The spike generated `QWalletEntity` and compiled predicate-builder tests. `WalletPredicateBuilder` is the first executable use case. Core Filter Common, REST filters, QuerydslPredicateExecutor and runtime repository changes remain out of scope.
