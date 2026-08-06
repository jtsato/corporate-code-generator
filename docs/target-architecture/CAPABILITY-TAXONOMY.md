# Capability Taxonomy and Profile Options

Configuration profiles and properties-driven CORS are implemented default capabilities of `java-spring-clean-multimodule`.

Core self-validation is an implemented default capability: required attributes map to Jakarta Validation `@NotNull` and `SelfValidating<T>`. The Core is Jakarta-aware but Spring-free; provider dependencies remain runtime/test infrastructure. Its dedicated quality gate is `smoke:validation:java-multimodule`, while REST DTO validation remains future work. Find-by-id runtime integration is implemented through a Core use case, a Core gateway method, a persistence provider and a REST endpoint. Create runtime integration is implemented through a Core command/use case, a Core gateway method, a persistence provider, H2 persistence tests, and REST create integration; REST DTOs translate to Core commands without duplicating validation.

Core Paging Common, Core Filter Common, the REST Filter Contract Foundation, the REST Sort Contract Foundation, the Spring Data Paging Adapter, the entity-aware Querydsl filter mapper foundation, the Querydsl filter runtime integration, the REST filter runtime integration, the paging runtime integration, the filtered paging runtime integration, the REST filtered paging runtime integration, REST sorting runtime integration, and the Generated Java CI Pipeline are implemented. REST Filter Contract is an `entrypoints-rest` default foundation: it parses lowercase REST aliases into the Core expression model using a per-entity public-to-domain field allowlist. REST Sort Contract parses strict repeatable `<field>:<direction>` expressions into allowlisted `SortOrder` values. Milestone 6.18 connects `filter`, `page`, and `size` to `Find<Entity>ByFilterPageUseCase` and returns a domain-specific page response with `items` and paging metadata. Milestone 6.19 adds `sort` and generated domain-to-persistence property mappings. The generic response design was replaced by the approved domain-specific fallback because Springdoc 3.0.3 emitted untyped generic items. OR/nested REST parsing, REST type conversion beyond string values, comma escaping, and advanced HTTP sorting remain future capabilities.

Filtered paging runtime integration (Milestone 6.17) is implemented without HTTP/OpenAPI exposure. It combines `FilterExpression` and `PageRequest` in `Find<Entity>ByFilterPageUseCase`, reaches `<Entity>Gateway.findByFilterPage`, maps both with the existing Querydsl and Spring Data adapters, and calls `ListQuerydslPredicateExecutor.findAll(predicate, pageable)`. Empty filters use `findAll(pageable)`; repository contracts remain unchanged. Milestone 6.18 exposes this flow through REST with `WalletPageResponse`.

## Status and scope

This document records the initial Milestone 6.1 taxonomy and the implemented
Milestone 6.2 ArchUnit foundation. It does not change the Application Model or
Profile schema.

The normative taxonomy decision is recorded in [ADR-017](../adr/ADR-017-capability-taxonomy-and-profile-options.md).
The evidence base is [Extended Reference Architecture](EXTENDED-REFERENCE-ARCHITECTURE.md).

Decision states used here:

- **Baseline**: approved direction for future capability composition.
- **Pending validation**: direction is preferred but requires a technical
  proof or a later capability ADR.
- **Opt-in**: never enabled implicitly by a profile.
- **Not adopted**: explicitly excluded from the corporate default.

## Core mental model

The generator distinguishes five concepts:

| Concept | Meaning | Examples |
| --- | --- | --- |
| Physical module | Maven/source ownership and dependency boundary | `core`, `entrypoints-rest`, `infra-database`, `configuration` |
| Capability | Coherent generated behavior and artifact set | `archunit`, `openapi`, `global-error-handling`, `paging` |
| Technology option | Implementation selected inside a capability | `persistence.type: jpa`, `security.provider: keycloak` |
| Environment option | Runtime exposure/configuration by environment | `openapi.ui.enabled`, CORS origins, datasource variables |
| Quality capability | Build/test verification behavior | `jacoco`, `pit`, `archunit`, `testcontainers` |

A capability is not an alias for a template and a physical module is not a
capability. A capability may emit artifacts into several physical modules. A
technology option may constrain which capabilities are valid.

The term **common artifact set** is documentary: it groups related artifacts
that belong to existing layers. It does not introduce a new schema entity.

## Golden Path defaults

The default rule is: enable only architecture or contract foundations that do
not require external infrastructure or undeclared domain intent.

### Baseline defaults

The implemented `java-spring-clean-multimodule` profile baseline before Milestone 6.20 was 99 artifacts (build 6, Core 34, entrypoints-rest 51, Infra 52, Configuration 99). After Milestone 6.20 it was 104 artifacts (build 6, Core 37, entrypoints-rest 54, Infra 55, Configuration 104). After Milestone 6.21 it was 109 artifacts (build 6, Core 41, entrypoints-rest 58, Infra 59, Configuration 109). After Milestone 6.22 it is 110 artifacts (build 6, Core 42, entrypoints-rest 59, Infra 60, Configuration 110). After Milestone 6.25 it is 112 artifacts (build 6, Core 42, entrypoints-rest 60, Infra 60, Configuration 112). After Milestone 6.26 it is 117 artifacts (build 6, Core 46, entrypoints-rest 64, Infra 64, Configuration 117). The build+core selection is 52 artifacts and build+configuration is 117. Selection counts for `entrypoints-rest` and `infra-database` include Core transitively, since both declare `requires: [core]`. Its baseline capabilities are:

- `archunit`;
- `jacoco`;
- `global-error-handling`;
- basic `i18n`;
- property-driven `cors`;
- OpenAPI specification (not necessarily UI);
- configuration profiles;
- `core-paging` common artifacts.
- `core-filter` common artifacts.
- entity-aware Querydsl filter definition and mapper foundation.
- Querydsl filter runtime integration through a filtered use case.
- REST filter runtime integration (`filter` query parameter wired to the filtered use case and documented in OpenAPI).
- paging runtime integration through a separate paginated use case (`Find<Entity>PageUseCase`, no HTTP exposure, no sorting).
- individual read runtime integration through `Find<Entity>ByIdUseCase` and `GET /<entities>/{id}`.
- create runtime integration through `Create<Entity>Command`, `Create<Entity>UseCase`, persistence conflict detection and `save`, plus REST create integration through `POST /<entities>`.
- update runtime integration through `Update<Entity>Command`, `Update<Entity>UseCase`, and gateway `update(...)` with existence checking before `save` (no HTTP exposure yet).

`archunit` is implemented as the default architecture guardrail of
`java-spring-clean-multimodule`: it generates production-only architecture
tests in `configuration`. The remaining entries are future baseline decisions.

`global-error-handling` and basic `i18n` are implemented defaults of the
multi-module Golden Path. They provide a REST error contract, core exceptions,
message bundles and Accept-Language message resolution.

`self-validation` is **pending validation** for Milestone 6.6. Jakarta API
policy is decided below, but the constructor-driven domain style and generated
validation artifacts require a separate ADR before becoming a default.

These defaults must preserve existing generation behavior when the capability
is not materially relevant to a selected module. They do not authorize adding
implementation in 6.1.

### Explicit opt-in capabilities

The following require explicit profile selection or environment configuration:

- Swagger UI, enabled by default only in local/dev/test environments;
- PIT mutation testing;
- Docker and Compose;
- Testcontainers;
- security;
- Keycloak;
- Querydsl JPA;
- Querydsl MongoDB;
- Entity Graph;
- MapStruct;
- P6Spy.

Security is split into a provider-neutral capability and provider options;
Keycloak is never implied merely because security is enabled.

## Core dependency boundary

**Baseline decision:** core may use stable Jakarta APIs but must not depend on
Spring packages.

Allowed candidates:

- `jakarta.validation` API;
- `jakarta.inject` API where injection semantics are needed.

Not allowed in core:

- `org.springframework.*`;
- direct design dependence on `org.hibernate.validator.*`;
- persistence, web, security-provider or framework annotations.

Hibernate Validator and EL may be supplied by runtime/test composition, but the
core contract depends on Jakarta API types. This boundary requires
`ADR-018` when SelfValidating is implemented.

## Self-validation policy

The proposed styles are intentionally tiered:

| Validation context | Preferred style | Status |
| --- | --- | --- |
| Simple immutable domain object | constructor-driven validation | pending ADR-018 |
| Validation requiring service/configuration dependencies | factory/service-driven | baseline design guidance |
| Validation requiring persistence or external infrastructure | port-driven | baseline design guidance |

The illustrative constructor pattern is:

```java
public final class Wallet extends SelfValidating<Wallet> {
    public Wallet(...) {
        // assign state
        validateSelf();
    }
}
```

This is not a template contract yet. The implementation milestone must decide
validator lifecycle, error mapping, factory reuse and whether validation runs
on every construction.

## Error response contract

**Baseline decision:** the Java Golden Path uses `ResponseStatus` as its
canonical REST error body. It has three required contract fields:

```json
{
  "code": 400,
  "message": "Invalid request.",
  "fields": [{"name": "balance", "message": "Balance is required."}]
}
```

`code` is the numeric HTTP status. `message` is the general response message.
`fields` is always present and is an empty list for errors without a specific
field. When multiple request fields are invalid, every field error must appear
in `fields` in deterministic order.

The initial contract excludes `version`, `timestamp`, `path`, `traceId`,
`details`, `exception` and `stackTrace`. Those may be evaluated later but are
not part of the baseline contract. `ResponseStatus` belongs to
`entrypoints-rest/common`; it is an HTTP representation and must not be placed
in core.

The future global handler maps core/application exceptions to this body. Error
code/message-key naming, status mapping and i18n resolution remain Milestone
6.3 decisions.

When implemented, prefer an immutable Java record with a defensive copy of
`fields`. The record belongs in `entrypoints-rest/common`, not in core. OpenAPI
annotations are conditional on the OpenAPI capability; the `ResponseStatus`
contract does not depend on Swagger UI. `message` and `Field.message` may later
be localized using the locale policy in Milestone 6.3.

## Locale policy

Baseline locales:

- default: `en`;
- supported: `en`, `pt-BR`;
- input: standard `Accept-Language`.

Fallback order:

1. exact requested locale;
2. base language where applicable;
3. default `en`.

Cookie persistence and custom header/query locale mutation are not defaults.
They may be added as explicit environment options later.

## Paging and search boundary

The common paging capability does not imply search operations.

Baseline external paging policy:

- zero-based page numbering;
- default page `0`;
- default size `20`;
- maximum size `100`;
- mandatory sort allowlist.

Example contract:

```http
GET /wallets?page=0&size=20&sort=balance,asc
```

The common artifact set may be generated independently:

```text
core/common/paging/Page
core/common/paging/Pageable
core/common/paging/PageImpl
infra/common/PageMapper
infra/common/PageRequestHelper
infra/common/predicate/PredicateBuilder
infra/common/predicate/AbstractPredicateBuilderImpl
```

Entity-specific search requires explicit Application Model intent and is not
generated from attributes alone. A future model shape may resemble:

```yaml
entities:
  - name: Wallet
    operations:
      search:
        enabled: true
        pagination:
          enabled: true
          defaultSize: 20
          maxSize: 100
        sorting:
          allowed: [balance, createdAt]
        filters:
          - attribute: id
            operators: [equals, in]
          - attribute: balance
            operators: [equals, greaterThan, lessThan]
```

This YAML is illustrative only and does not alter the current schema.

## Persistence technology options

The first dynamic query adapter is **Querydsl JPA** because JPA is already in
the current multi-module Golden Path. Querydsl MongoDB remains
`REQUIRES VALIDATION`: MongoDB was not active in the analyzed reactor and its
reference stack needs an independent compatibility proof.

Conceptual options:

```text
persistence.type: jpa | mongodb
dynamicQueries: querydsl
integrationTests: testcontainers
```

Entity Graph is an opt-in advanced JPA capability. Relationship-specific fetch
plans cannot be generated until relationships are represented in the
Application Model.

The first Testcontainers target is provisionally **PostgreSQL**, with MySQL as
an optional follow-up. This is a recommendation for a future validation
milestone, not a change to the current H2-based Golden Path.

## Quality options

JaCoCo is a baseline quality capability with both per-module reports and an
aggregated report as the primary CI/Sonar view.

PIT is opt-in and does not gate every pull request initially:

- initial mutation score target: 60%;
- execution: manual, nightly and before releases;
- future target after maturity: 70–80% subject to measured cost.

ArchUnit is baseline for the corporate multi-module architecture. Its rules
must be Golden Path-specific rather than copied from reference sample rules.

Testcontainers is technology-specific and opt-in. Compose is for local
developer convenience; automated integration tests should prefer Testcontainers
and should not make Compose the CI orchestration primitive.

## OpenAPI, UI and environment options

OpenAPI specification generation is baseline. Swagger UI is environment-gated:

- local/dev/test: enabled by explicit local configuration;
- production: disabled by default or protected by security policy.

Illustrative configuration:

```yaml
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: ${OPENAPI_UI_ENABLED:false}
```

The final exposure and security scheme policy belongs to Milestone 6.5 and
`ADR-020`.

## Security and authorization options

Security is split into:

- `security-foundation`;
- `security-resource-server`;
- `security-keycloak`;
- `security-test`.

Authorization intent should not be hardcoded as arbitrary controller strings.
A future model may declare:

```yaml
operations:
  - name: findWallets
    authorization:
      required: true
      scopes: [wallet:read]
```

The technology adapter may translate this into a provider-specific authority,
for example `SCOPE_wallet:read`, without exposing provider details to core.
The exact Application Model shape is deferred.

Keycloak boundary:

- generator may provide optional local/dev Compose, realm export and client
  configuration documentation;
- platform/deployment owns real production realms, clients and secrets.

Keycloak is a provider option, not the security foundation and not an exclusive
generator owner of production identity configuration. `ADR-021` belongs to the
security milestone.

## Profile option vocabulary

The following vocabulary is approved conceptually but is not yet schema:

```text
capabilities:
  archunit: enabled
  jacoco: enabled
  global-error-handling: enabled
  i18n: basic
  cors: configured
  openapi.spec: enabled
  openapi.ui: local-only
  core-paging: enabled

options:
  persistence.type: jpa
  dynamicQueries: none | querydsl
  integrationTests: h2 | testcontainers
  security.provider: none | keycloak
  mapping: manual | mapstruct
  sqlDiagnostics: disabled | p6spy

environment:
  local: openapi.ui, docker-compose
  test: h2, archunit
  prod: environment-supplied datasource/secrets
```

The schema work must define validation for incompatible combinations, for
example `security.provider: keycloak` without the security capability or
`dynamicQueries: querydsl` with `persistence.type: none`.

## Decisions deferred to later ADRs

Only taxonomy and option boundaries are decided by 6.1. The following ADRs are
planned, not created by this milestone:

- ADR-018 — Jakarta APIs and SelfValidating in core;
- ADR-019 — error response contract and i18n policy;
- ADR-020 — OpenAPI exposure policy;
- ADR-021 — security capability and Keycloak boundary;
- ADR-022 — JaCoCo, ArchUnit and PIT quality gates;
- ADR-023 — Testcontainers versus Docker Compose.

## Compatibility and non-regression rules

1. `java-spring-clean` remains intact.
2. Existing `java-spring-clean-multimodule` defaults remain behaviorally
   compatible until a later implementation milestone explicitly changes them.
3. No capability is inferred merely from a library appearing in a reference
   project.
4. No capability may force undeclared domain intent into templates.
5. Physical module boundaries remain explicit and inward-facing.
6. Technology options remain outside the technology-agnostic Core model.
7. Every implemented capability later requires tests and, where output changes,
   Golden updates.

## 6.1 conclusion

Milestone 6.1 fixes the generator's composition language: physical modules own
code, capabilities own behavior, technology options select implementations,
environment options control exposure, and quality capabilities verify output.
The next milestone may implement ArchUnit from this taxonomy; it must not
silently introduce all listed options at once.
