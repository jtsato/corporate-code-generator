# Extended Reference Architecture

## Scope

This document records Milestone 6.0 analysis of
`java-clean-architecture-example.zip`. It is an architectural inventory and a
proposal for later decisions. It does not approve implementation, change the
Application Model or Profile schema, or modify either Java Golden Path.

The labels used throughout this document have precise meanings:

- **REFERENCE FACT**: directly observed in the ZIP.
- **GENERATOR DECISION**: recommended direction for a later decision milestone.
- **REQUIRES VALIDATION**: evidence is incomplete, inconsistent, or needs a
  compatibility/maintenance check before adoption.
- **NOT ADOPTED**: observed but deliberately excluded from the recommendation.
- **OPTIONAL CAPABILITY**: useful only when explicitly enabled.
- **TECHNOLOGY-SPECIFIC**: applies only to a selected technology.

## Source project

**REFERENCE FACT** The inspected ZIP is a Bookstore application. Its root POM
is `io.github.jtsato:bookstore-application:0.0.1-SNAPSHOT`, uses packaging
`pom`, inherits from Spring Boot parent `4.1.0`, and declares Java 21. The ZIP
also contains non-reactor AMQP and MongoDB modules, generated PIT HTML reports,
a Dockerfile, Compose file, README and Windows command script.

**GENERATOR DECISION** The Wallet remains the minimal deterministic model and
validation reference. Bookstore is an advanced reference used to discover
patterns and options. Neither source is a literal template.

**GENERATOR DECISION** Java 25 remains unchanged in the current Golden Paths.
The reference's Java 21 setting does not trigger a version change.

## Analysis methodology

The ZIP was extracted to a temporary analysis directory without modifying the
archive. The analysis covered all seven POMs, all production and test source
trees, runtime and test resources, root operational files, and representative
classes from every architectural concern. Generated PIT HTML was inventoried
but not treated as source architecture. Claims below distinguish files that
are active in the Maven reactor from files merely present in the ZIP.

No Maven build was used as evidence: this milestone analyses structure and
configuration, not whether the reference currently builds. Version freshness
is not inferred from version numbers alone.

## Architectural inventory

```text
bookstore-application/                 Maven parent and aggregator
├── pom.xml
├── core/
│   └── src/{main,test}/java/          domain, actions, ports, validation, paging
├── entrypoints/rest/
│   └── src/{main,test}/java/          controllers, API contracts, DTOs, presenters
├── infra/
│   ├── sql/
│   │   └── src/{main,test}/{java,resources}
│   ├── nosql/                         present, not aggregated
│   │   └── src/{main,test}/{java,resources}
│   └── amqp/                          present, not aggregated; no tests in ZIP
│       └── src/main/java/
├── configuration/
│   ├── src/main/{java,resources}/     bootstrap and cross-cutting configuration
│   └── src/test/{java,resources}/     ArchUnit suite
├── docs/mutation-reports/             committed generated PIT reports
├── Dockerfile
├── docker-compose.yml
├── run.cmd
├── README.MD
└── .gitignore
```

**REFERENCE FACT** Source-set counts, excluding generated mutation reports,
are: core 77 production/17 test Java files; REST 77/16; SQL 32/19; MongoDB
36/20; AMQP 27/0; configuration 13/8. Resources exist under configuration
main/test and both persistence test trees. No CI workflow is included in the
ZIP, although the README links to GitHub Actions badges and describes reusable
Sonar and scheduled mutation workflows.

**GENERATOR DECISION** Preserve conventional module-local source sets:

```text
module/src/main/java
module/src/main/resources
module/src/test/java
module/src/test/resources
```

Common code remains bounded by layer (`core/common`, `entrypoint/rest/common`,
`infra/common`). A global unbounded `common` directory is not recommended.

## Maven reactor

### Modules and parent relationships

| Directory | Artifact ID | Packaging | Parent | Reactor status |
| --- | --- | --- | --- | --- |
| root | `bookstore-application` | `pom` | Spring Boot `4.1.0` | aggregator |
| `core` | `bookstore-core` | `jar` | root | active |
| `infra/sql` | `bookstore-sql` | `jar` | root | active |
| `entrypoints/rest` | `bookstore-rest` | `jar` | root | active |
| `configuration` | `bookstore-configuration` | `jar` | root | active/executable |
| `infra/nosql` | `bookstore-nosql` | `jar` | root | not aggregated |
| `infra/amqp` | `bookstore-amqp` | `jar` | root | not aggregated |

**REFERENCE FACT** The root lists `/infra/sql` and `/entrypoints/rest` with a
leading slash. Maven accepts the project as authored in some environments, but
the convention is inconsistent with `core` and `configuration`.

**NOT ADOPTED** Leading slashes in reactor module paths are not a generator
convention. Generated paths should remain relative and portable.

### Active dependency graph

```text
core
├── entrypoints/rest
├── infra/sql
└── configuration (also directly declares core)
    ├── entrypoints/rest
    └── infra/sql
```

Equivalently, declared internal edges are:

```text
entrypoints/rest -> core
infra/sql        -> core
configuration   -> core, entrypoints/rest, infra/sql
```

No internal cycle was observed. `configuration -> core` is transitively
available through REST and SQL but is reasonable as an explicit composition
dependency because configuration refers to core types directly.

### Build and dependency management observations

**REFERENCE FACT** The root places Surefire, Failsafe, Sonar and PIT directly
under `build/plugins`; it has no `dependencyManagement` and no
`pluginManagement`. Child POMs repeat Surefire, Failsafe and PIT configuration.
SQL alone imports the Testcontainers BOM.

**REFERENCE FACT** Annotation processing differs by module: core configures
Lombok; REST configures Lombok and `proc=full`; SQL configures Lombok,
MapStruct, the Lombok/MapStruct binding and Querydsl APT; MongoDB uses
MapStruct/Lombok plus the older `com.mysema.maven:apt-maven-plugin` and Spring
Data's Mongo annotation processor.

**REQUIRES VALIDATION** The MongoDB annotation-processing stack, its Querydsl
artifacts and its compatibility with the fixed Spring Boot generation require
a dedicated maintenance check. The Mongo POM also declares `querydsl-jpa`,
HikariCP and a `javax.el` implementation; these appear unrelated or from an
older stack and should not be copied without proving necessity.

**REFERENCE FACT** Several test-only libraries have compile/default scope:
Mockito in REST, SQL, MongoDB and AMQP; ArchUnit in configuration; Okta is a
runtime concern but uses default scope. H2 is runtime rather than test scope in
SQL. The root declares JUnit engine for every module.

**GENERATOR DECISION** Future build capabilities should centralize versions
and plugin defaults in the parent, keep module-specific execution where it
belongs, and use the narrowest correct dependency scope.

## Dependency catalog

| Category | Important dependencies observed | Module(s) | Classification and findings |
| --- | --- | --- | --- |
| Spring runtime | Boot parent `4.1.0`, Web MVC, Actuator, AspectJ starter | root, REST | **TECHNOLOGY-SPECIFIC** Spring foundation; Actuator and AOP require separate policy |
| Validation | Jakarta Validation API, Hibernate Validator, Jakarta EL | core; duplicated in SQL/Mongo | **OPTIONAL CAPABILITY** self-validation; implementation in core is a coupling decision |
| Injection | Jakarta Inject API | core | **GENERATOR DECISION** permissible stable API candidate, subject to ADR |
| Security | Spring Security, Okta starter | REST, configuration | **OPTIONAL CAPABILITY**; Okta is **NOT ADOPTED** as preferred provider |
| OAuth2/OIDC | Resource Server/JWT through Okta starter | configuration | split generic resource server from identity provider |
| OpenAPI | `springdoc-openapi-starter-webmvc-ui` `3.0.3` | REST | **OPTIONAL CAPABILITY**, covering spec and UI composition |
| JPA | Boot Data JPA, Jakarta persistence transitively | SQL | **TECHNOLOGY-SPECIFIC** persistence foundation |
| MongoDB | Boot Data MongoDB | MongoDB (non-reactor) | **TECHNOLOGY-SPECIFIC**, requires an explicit persistence selection |
| Querydsl | JPA/apt `5.1.0`; Mongo/JPA/apt without local versions in Mongo POM | SQL, MongoDB | **TECHNOLOGY-SPECIFIC**, Mongo stack **REQUIRES VALIDATION** |
| Entity Graph | Cosium Spring Data JPA Entity Graph `4.0.4` | SQL | advanced JPA capability |
| Mapping | MapStruct `1.6.3` SQL; `1.4.2.Final` Mongo; Lombok | persistence modules and other layers | MapStruct is **OPTIONAL CAPABILITY**; manual mapper remains baseline |
| SQL diagnostics | P6Spy `3.9.1` | SQL/configuration resources | **OPTIONAL CAPABILITY**, profile-bound, not production default |
| Databases | MySQL driver, H2 | SQL | technology/environment-specific; current H2 scope is broader than desired |
| Testcontainers | JUnit Jupiter and MySQL `1.21.3` BOM | SQL tests | important integration capability, partially wired |
| Testing | JUnit 6, AssertJ, Mockito, Boot test slices, ArchUnit | all active modules | foundation, with scope cleanup needed |
| Quality | JaCoCo `0.8.15`, PIT `1.25.8`, Sonar Maven plugin | root and active modules | JaCoCo foundation; PIT heavy capability |
| Utilities | Commons Lang, Collections, IO | core/REST/persistence | adopt only where policy cannot be expressed clearly with JDK APIs |
| Logging/metrics | SLF4J, Log4j API usage, Actuator, custom AOP timer | REST/configuration | logging foundation; custom timer is optional/questionable |
| AMQP | Boot AMQP, Rabbit test | non-reactor AMQP | project/technology-specific and outside proposed 6.x priorities |

No dependency version is changed by this analysis. A version being old or new
is not itself an obsolescence finding.

## Package architecture

**REFERENCE FACT** The reference uses domain-first packages within layers:

```text
core/{author,book,enumerator}/{domain,usecase,action,gateway}
entrypoint/rest/{author,book,enumerator}/{api,controller,domain,mapper}
infra/{author,book}/{domain,mapper,repository,event}
configuration/{configuration,exception/handler}
```

**REFERENCE FACT** Cross-cutting artifacts are layer-local:

| Layer | Common catalog |
| --- | --- |
| core | enumerator utilities, clock abstraction, paging model, validation annotations/validators, `SelfValidating` |
| REST | HTTP status constants/model, request path holder, JSON converter, execution-time annotation/aspect |
| infrastructure | `PageMapper`, `PageRequestHelper`, predicate contracts/base class; SQL also has P6Spy formatting |
| configuration | CORS, locale, message source integration, security, OpenAPI, exception translation |

**GENERATOR DECISION** This layered common organization is preferable to a
global common module. A common artifact set is a documentary grouping of files
generated into their owning layers, not necessarily a new schema entity.

## Core and domain patterns

**REFERENCE FACT** Core contains domain models, use-case interfaces, actions,
gateway ports, parameter objects, exceptions, paging and validation. Actions
depend on gateway interfaces and are annotated with `jakarta.inject.Named`;
core has no Spring imports.

**REFERENCE FACT** Core is Spring-independent but not dependency-free. It uses
Jakarta Inject, Jakarta Validation, Hibernate Validator, Jakarta EL, Lombok and
Apache Commons. `SelfValidating` calls
`Validation.buildDefaultValidatorFactory()` in every instance constructor and
throws Jakarta `ConstraintViolationException`.

**GENERATOR DECISION** "Core without Spring" may allow stable Jakarta APIs,
but only after explicit ADRs. Depending on the Jakarta Validation API is less
coupled than depending on Hibernate Validator; embedding the provider and EL
implementation in core changes runtime and startup behavior and should not be
automatic.

**REQUIRES VALIDATION** A future self-validation design must decide validator
lifecycle, error representation, localization boundary and whether validation
is constructor-driven. Reusing one validator/factory or injecting a port avoids
creating a factory per instance.

**REFERENCE FACT** `GetLocalDateTime` abstracts `now()`, while its `@Named`
implementation uses `Clock.systemDefaultZone()`. The abstraction aids tests,
but the zone is undeclared external state.

**GENERATOR DECISION** Deterministic generated runtime behavior should prefer
an injected `Clock` and an explicit zone policy; the concrete reference
implementation is not copied.

**PROJECT-SPECIFIC** Author, Book, BookDocument, Enumerator, gender rules,
commands and domain error message keys belong to Bookstore.

## REST and web cross-cutting patterns

**REFERENCE FACT** REST separates API method interfaces containing OpenAPI
annotations from controller implementations. Controllers map request DTOs to
core parameters, invoke use cases, and map results through static presenters.
Search controllers accept Spring Data `Pageable`, then pass page, size and a
stringified sort into core.

**GENERATOR DECISION** Controllers depending on use cases and DTO-local/manual
mapping align with the current Golden Path. API-interface separation is useful
only if it materially reduces controller noise or serves contract reuse; it is
not a mandatory wrapper.

**REFERENCE FACT** `entrypoint/rest/common` includes `HttpResponseStatus`,
HTTP constants, mutable `WebRequest`, JSON conversion and an AOP execution-time
logger. Configuration populates request path through a request-scoped bean.

**GENERATOR DECISION** The Java Golden Path will standardize REST error
responses using `ResponseStatus` in `entrypoints-rest/common`. The canonical
body has three required contract fields:

```json
{
  "code": 400,
  "message": "Invalid request.",
  "fields": [{"name": "balance", "message": "Balance is required."}]
}
```

`code` is the numeric HTTP status; `message` is the general error message; and
`fields` is always present, using an empty list for errors without a specific
field. Every invalid request field must be represented in deterministic order.
The initial contract deliberately excludes `version`, `timestamp`, `path`,
`traceId`, `details`, `exception` and `stackTrace`. `ResponseStatus` is an HTTP
contract and must not be placed in core.

**QUESTIONABLE / LEGACY** Logging complete request DTOs as JSON may expose
sensitive values. A custom timing annotation duplicates capabilities available
through Micrometer/observability. A mutable request-path holder adds indirection
where the exception handler can receive the servlet request directly.

**GENERATOR DECISION** Keep generic REST concerns in
`entrypoint/rest/common`; keep domain DTOs and filters under their domain.
Framework wrappers without policy should not be generated.

## Exception handling

**REFERENCE FACT** Core defines `CoreException` with message code and arguments
plus NotFound, invalid parameter/enumerator, uniqueness and parent-constraint
subclasses. Configuration has two `@RestControllerAdvice` classes:

- `BookstoreExceptionHandler` maps core and Jakarta validation exceptions;
- `GlobalExceptionHandler` maps malformed bodies, binding/validation,
  Hibernate constraint violations, access denied and unknown exceptions.

Both return a REST-layer `HttpResponseStatus` containing local timestamp,
status, reason, localized message and path. Unknown exceptions are logged only
with `exception.getMessage()` and return a generic localized message.

**QUESTIONABLE / LEGACY** Hibernate's
`org.hibernate.exception.ConstraintViolationException` is treated separately
from Jakarta's exception but mapped by resolving its raw message as a bundle
key. `InvalidParameterException` bypasses message localization. Uniqueness and
parent conflicts return 400 rather than a considered 409 policy. Validation
errors are concatenated into one string rather than structured field errors.

**GENERATOR DECISION** A minimal corporate foundation should define semantic
exceptions (`ApplicationException`, `NotFoundException`,
`ValidationException`, `ConflictException`) and one translation boundary into
`ResponseStatus`. It should map malformed input/validation to 400,
authentication to 401, authorization to 403, missing resources to 404,
conflicts to 409 and unexpected failures to 500; internal exception details
and stack traces must not be returned.

The future handler flow is:

```text
Core/Application exception -> GlobalExceptionHandler -> ResponseStatus -> HTTP JSON
```

Field-level validation must aggregate all invalid fields into `fields`. The
final status mapping, message resolution and deterministic ordering policy are
implementation decisions for Milestone 6.3.

**GENERATOR DECISION** Unexpected exceptions should be logged with the
exception object and correlation context, while the client receives a stable
code and safe localized text. Persistence/provider exceptions should be
translated into semantic errors before or at the web boundary.

## Locale and internationalization

**REFERENCE FACT** English and `pt_BR` message bundles exist. A custom
`LocaleChangeHeaderInterceptor` subclasses Spring's query-parameter locale
interceptor to read a header named `Accept-Language`. A `CookieLocaleResolver`
persists the selected locale. Invalid locale values are ignored. No explicit
default locale or supported-locale allowlist is configured.

**QUESTIONABLE / LEGACY** Treating `Accept-Language` as a mutable locale-change
command and persisting it in a cookie differs from normal HTTP content
negotiation. It also overloads a query-parameter interceptor abstraction.

**GENERATOR DECISION** The foundation should use standard
`Accept-Language` negotiation with a configured default, supported locales,
fallback bundle and no persistence by default. Cookie or query-parameter
locale changes are optional policies. Validation and exception message codes
should share the same locale resolution.

## CORS and configuration profiles

**REFERENCE FACT** CORS is a servlet `Filter` that hardcodes credentials,
methods, max age, allowed headers and exposed `Location`; it does not emit an
allowed-origin header. It is not integrated with Spring Security's CORS DSL.

**QUESTIONABLE / LEGACY** A credentialed CORS policy without explicit allowed
origins is incomplete. Hardcoded broad methods and custom headers are not a
portable corporate default.

**GENERATOR DECISION** CORS should be property-driven, validated at startup,
and integrated with Spring MVC/Security. Origins, methods, headers, exposed
headers, credentials and max age are explicit profile/environment inputs.
Secure default is disabled or same-origin until configured.

**REFERENCE FACT** `application.yaml` activates `dev` in source. Dev and prod
files duplicate most settings. Dev uses P6Spy/H2 and enables devtools/H2
console; prod embeds MySQL host, database username/password and P6Spy, uses
`ddl-auto: update`, and enables Swagger UI despite the Java configuration's
`!prod` profile. Both contain Okta placeholders/default issuer and a malformed
extra brace on `clientSecret`.

**NOT ADOPTED** A source-controlled default active profile, embedded production
credentials, production schema update, production P6Spy, and conflicting
OpenAPI switches are not generator defaults.

**GENERATOR DECISION** Future convention:

```text
application.yaml         shared safe defaults
application-local.yaml   developer services and diagnostics
application-test.yaml    deterministic test configuration
application-prod.yaml    environment-variable references only
```

Secrets must have no usable source default. Datasource, MongoDB, logging,
security and OpenAPI settings should be conditionally generated from selected
capabilities.

## OpenAPI

**REFERENCE FACT** Springdoc UI is in REST. API method interfaces carry
operation and response annotations. Configuration creates OpenAPI metadata and
a global bearer JWT scheme. A separate `!prod` configuration registers legacy
Swagger UI resource handlers, while YAML enables UI in both dev and prod.

**GENERATOR DECISION** One `openapi` capability should compose specification
generation, metadata, controller/DTO annotations and optional Swagger UI.
Swagger is not a second independent capability. Security schemes are emitted
only when security is enabled. UI exposure is enabled in local/test by default
and requires an explicit production decision.

When implemented, `ResponseStatus` should be an immutable Java record in the
REST common package. OpenAPI annotations document it when the OpenAPI
capability is enabled; the contract itself does not depend on Swagger UI.
`message` and each field message may later be resolved through the i18n policy
defined for Milestone 6.3.

**REQUIRES VALIDATION** The manual resource handlers may be unnecessary with
the Springdoc starter and should be checked against the selected Springdoc
version before any template is designed.

## Security and identity providers

**REFERENCE FACT** REST has Spring Security and uses `@PreAuthorize` authority
checks on controllers. In `uat`/`prod`, configuration authenticates every URL
as an OAuth2 resource server with JWT and calls an Okta-specific helper for 401
responses. In `test`/`dev`, every request is permitted and frame options are
relaxed. There is no provider-neutral JWT converter, scope/role mapping policy,
security test support or Keycloak configuration in the ZIP.

**NOT ADOPTED** Okta is not the preferred provider and must not define the
generic security contract.

**GENERATOR DECISION** Separate:

- `security-foundation`: URL/method policy, CORS interaction, safe 401/403
  responses and authorization model;
- `security-resource-server`: provider-neutral OAuth2 JWT validation;
- `security-keycloak`: issuer/audience and claims mapping for the preferred
  open-source provider;
- `security-test`: JWT authorities and secured endpoint fixtures.

Keycloak remains replaceable; provider selection must not leak into core.

## SQL persistence

**REFERENCE FACT** SQL contains JPA entities, Spring Data repositories,
MapStruct mappers, gateway providers, transactions, Querydsl predicates,
Cosium entity graphs, paging adapters, H2/MySQL configuration and P6Spy.
Read providers use `@Transactional(readOnly=true)` and write providers use
`@Transactional`. No migration tool or migration scripts were observed;
Hibernate `ddl-auto: update` manages schemas in dev/prod.

Classification:

| Concern | Classification |
| --- | --- |
| entities, repositories, providers, manual mapping, explicit transactions | **TECHNOLOGY-SPECIFIC** JPA foundation |
| Querydsl predicates and paging | advanced JPA capability |
| Entity Graph repository extensions/fetch plans | advanced JPA capability |
| Testcontainers MySQL verification | persistence integration capability |
| H2 test context | lightweight test foundation |
| MapStruct | **OPTIONAL CAPABILITY** |
| P6Spy and pretty SQL | **OPTIONAL CAPABILITY** diagnostics |
| MySQL choices and Bookstore relationships | project/technology-specific |
| `ddl-auto: update` in production | **NOT ADOPTED** |

**GENERATOR DECISION** Production persistence requires an explicit datasource
and migration policy; H2 remains test-only. Manual mappers remain the initial
default. N+1 prevention should be expressed by explicit fetch plans, not by
enabling Open Session in View (the reference correctly disables it).

## MongoDB persistence

**REFERENCE FACT** The non-reactor MongoDB module contains documents,
repositories, providers, MapStruct mappers, Querydsl executors/predicates,
Spring Data paging adapters, indexed fields, event listeners and a sequence
generator. Tests use `@DataMongoTest` and an embedded Flapdoodle dependency;
no Testcontainers MongoDB dependency or container setup was found.

**REFERENCE FACT** SQL and MongoDB duplicate `PageMapper`,
`PageRequestHelper`, `PredicateBuilder` and most predicate assembly, with the
base path type differing (`EntityPathBase` for SQL, `BeanPath` for MongoDB).

**REQUIRES VALIDATION** The module is not in the root reactor; it combines
Spring Data MongoDB with Querydsl Mongo/JPA/APT, an older Mysema APT plugin,
`javax.el`, HikariCP and SQL-related test resources. Its Querydsl generation,
current maintenance and compatibility must be proven in isolation before it
is classified as supported. This is not an automatic obsolescence finding.

**GENERATOR DECISION** MongoDB support should be a technology-specific
persistence option with its own document/index/test templates. SQL concepts
must not leak into it.

## Paging and dynamic queries

### Observed flow

```text
core Page<T>, PageImpl<T>, Pageable
        ↓
infra PageMapper + PageRequestHelper
        ↓
Spring Data Page/PageRequest + Querydsl BooleanBuilder
        ↓
JPA repository or MongoRepository/QuerydslPredicateExecutor
```

**REFERENCE FACT** The core paging model has content plus metadata (page,
size, current element count, total elements and total pages). `PageMapper`
maps Spring Data pages to that model. `PageRequestHelper` parses a string
grammar such as `name:asc,createdAt:desc`, defaults to page 0/size 10 and emits
a Spring Data `PageRequest`.

**REFERENCE FACT** `PredicateBuilder<Q>` and
`AbstractPredicateBuilderImpl<P,Q>` combine entity-specific BooleanExpression
lists with AND. Author/Book builders interpret their specific filter parameter
objects, convert dates/enums and address generated Q-types. Providers select
default sorting and connect these pieces to repositories.

### Required separation

**GENERATOR DECISION** Generic common can become a capability before search
operations exist in the Application Model:

```text
core/common/paging/{Page,Pageable,PageImpl}
infra/common/{PageMapper,PageRequestHelper}
infra/common/predicate/{PredicateBuilder,AbstractPredicateBuilderImpl}
```

These artifacts define reusable contracts/adapters and do not require fields,
operators or query methods for a particular entity.

**GENERATOR DECISION** Entity-specific search artifacts require future model
metadata and must be deferred independently:

```text
SearchWalletsUseCase
SearchWalletsParameters
WalletPredicateBuilder
field filters and operators
allowed/default sorting
repository query integration
```

There is therefore no dependency from `core-paging` to a future
`search-operations` model extension. Proposed conceptual capabilities are
`core-paging`, `persistence-paging`, `querydsl-jpa`, `querydsl-mongodb` and
`search-operations`; final names belong to Milestone 6.1.

**REQUIRES VALIDATION** The reference's free-form sort field names need an
allowlist/mapping to prevent invalid persistence-property access. Page bounds,
maximum size, stable default sorting, zero/one-based numbering and error policy
also require explicit decisions.

## Entity Graph

**REFERENCE FACT** SQL repositories extend Cosium
`EntityGraphJpaRepository` and `EntityGraphQuerydslPredicateExecutor`; test
bootstrap selects the corresponding factory bean. Book providers build dynamic
loading graphs containing `author` and pass them to repository operations.

**GENERATOR DECISION** Treat this as advanced JPA. Generic dependency,
repository base and factory configuration can be prepared independently.
Specific graph paths and fetch plans require relationships in the Application
Model and should not be inferred from string names in templates.

## Testing strategy

**REFERENCE FACT** Core has unit tests; REST has controller/presenter tests;
SQL uses `@DataJpaTest` and SQL fixtures; MongoDB uses `@DataMongoTest`; and
configuration hosts the ArchUnit suite. SQL and MongoDB keep fixtures and
profile YAML under module-local `src/test/resources`. PIT reports are committed
under `docs/mutation-reports`.

**GENERATOR DECISION** The advanced reference complements rather than replaces
the Wallet strategy. Preserve deterministic Goldens, TypeScript unit and
integration tests, structural smoke, Maven compile smoke, Spring context smoke,
HTTP runtime smoke, HTTP persistence-read smoke and independent scripts.

Recommended generated-test layers:

1. pure core and adapter unit tests;
2. architecture rules;
3. H2 context/repository smoke;
4. technology-matching Testcontainers integration tests;
5. full HTTP runtime tests;
6. PIT and heavier scans outside every-push feedback.

## ArchUnit

**REFERENCE FACT** Eight classes under configuration test source cover coding
rules, controller call/access allowlists, cycles, frozen rules, interface
naming, layer dependencies, layered architecture and method visibility. Some
cycle rules target example package patterns such as `simplecycle` that do not
represent the Bookstore package graph and appear adapted from ArchUnit samples.

**QUESTIONABLE / LEGACY** Sample rules and broad allowlists should not be
copied. Frozen rules can institutionalize existing violations and require an
explicit baseline policy.

**GENERATOR DECISION** ArchUnit is high priority. Rules for the current
multi-module Golden Path should assert:

- core does not depend on infra or entrypoints;
- entrypoints do not depend on infra;
- infra depends inward on core;
- configuration alone may compose modules;
- controllers depend on use cases, never repositories;
- JPA entities and repositories stay in infra;
- Spring annotations do not appear in core;
- providers implement core gateway ports;
- REST DTOs do not appear in core;
- domain models do not depend on persistence entities;
- module/domain slices have no cycles.

Architecture tests belong in configuration/integration test scope where all
modules are visible; rules purely about core may also live in core tests.

## JaCoCo and PIT

**REFERENCE FACT** Core, REST and SQL use JaCoCo `prepare-agent` and report;
core additionally enforces 100% line and branch coverage at `verify`. MongoDB
and AMQP use older offline instrumentation/restore configuration. No aggregate
reactor report is configured. Sonar properties are split across POMs and often
exclude configuration/handlers/bootstrap.

**REFERENCE FACT** PIT is configured at root and repeated in modules. Core
targets actions, REST targets controllers, SQL/Mongo/AMQP target providers,
and configuration skips PIT. Reports are written per module and generated HTML
is committed in the ZIP. `failWhenNoMutations=false` is universal.

**GENERATOR DECISION** JaCoCo is a quality foundation with per-module reports,
explicit thresholds and a deliberate aggregate/Sonar strategy. Thresholds
must be achievable and should not rely on broad exclusions that hide critical
cross-cutting code.

**GENERATOR DECISION** PIT is important but heavy. Suggested pipeline:

- pull request: compile, unit/integration tests appropriate to the change,
  JaCoCo, ArchUnit and Sonar;
- nightly/manual: PIT, full Testcontainers matrix and heavier security/quality
  scans.

Generated reports should normally be CI artifacts, not committed source.

## Testcontainers

**REFERENCE FACT** SQL imports the Testcontainers BOM plus JUnit/MySQL modules.
One JPA test is annotated `@Testcontainers` but declares no `@Container`.
The inactive `application-mysql.yaml` uses a Testcontainers JDBC URL
`jdbc:p6spy:tc:mysql:5.7://localhost/test`; active test configuration selects
H2. No explicit reuse, dynamic properties, parallel policy or CI Docker setup
is present. MongoDB uses Flapdoodle instead.

**REQUIRES VALIDATION** The MySQL image/tag, P6Spy/JDBC driver composition and
actual profile execution need a dedicated runtime proof. The annotation alone
does not prove container execution.

**GENERATOR DECISION** Use three levels:

1. H2 for fast context/read-path smoke;
2. optional technology-specific Testcontainers verification against the
   production database family;
3. production datasource entirely supplied by environment/secrets.

Testcontainers should be enabled by persistence technology/profile rather than
unconditionally for every generated project.

## Docker and local runtime

**REFERENCE FACT** The Dockerfile is a multi-stage Java 21/Maven 3.9 build. It
builds `configuration` with `-am`, copies `bookstore-starter.jar`, runs as a
non-root UID/GID, sets memory options and port, and health-checks Actuator.
The stage order defines runtime before build but is valid. Compose builds only
the application, maps port 8080 and mounts an anonymous host path; it provides
no SQL, MongoDB, RabbitMQ or identity provider. No `.dockerignore` is present.

**GENERATOR DECISION** A future Docker capability should use a compatible JRE,
reproducible build context, non-root runtime, conditional healthcheck and a
`.dockerignore`. Local composition is conditional:

```text
JPA/PostgreSQL: app + postgres
MongoDB:        app + mongo
Keycloak:       app + database + keycloak
```

Ports, image versions, volumes, credentials and secrets must be configurable.
An application-only Compose file is insufficient for the reference's prod SQL
configuration.

## Optional technologies

### MapStruct

**REFERENCE FACT** SQL and MongoDB define mapper interfaces and obtain generated
instances with `Mappers.getMapper`; SQL includes Lombok/MapStruct binding.

**OPTIONAL CAPABILITY** MapStruct becomes valuable for numerous or nested
mappings and compile-time mapping checks. It adds processor/version/build
complexity. Manual explicit mappers remain the initial default and are easier
to understand for small models.

### P6Spy

**REFERENCE FACT** SQL dependencies, datasource URLs and `spy.properties`
enable P6Spy in test, dev and prod; a custom formatter pretty-prints SQL.

**OPTIONAL CAPABILITY** P6Spy is diagnostics, preferably local/test only. It
changes driver URLs, logging volume and runtime overhead and is not a default.

### Okta

**REFERENCE FACT** Okta supplies a starter, properties and a proprietary 401
helper around otherwise standard OAuth2 Resource Server configuration.

**NOT ADOPTED** No Okta capability is proposed now. Keycloak is the preferred
open-source provider, behind a provider-neutral security foundation.

## Questionable or legacy items

The following are observations to revisit, not automatic defects in the source:

- leading slash reactor paths;
- non-reactor MongoDB and AMQP modules with parent references;
- repeated plugins/properties instead of managed parent configuration;
- compile/default scope for Mockito and ArchUnit;
- H2 runtime scope in SQL;
- MongoDB module's SQL/JPA/Hikari/EL remnants and older APT approach;
- hardcoded CORS filter;
- source-controlled `dev` active profile and production credentials/defaults;
- `ddl-auto: update` and P6Spy in production;
- conflicting Swagger UI profile/YAML behavior and manual resource handlers;
- provider-specific Okta behavior in generic security configuration;
- `SelfValidating` creating a validator factory per instance;
- system-default time zone in core clock implementation and error timestamps;
- generic validation errors collapsed to a message string;
- free-form persistence sort names;
- Testcontainers annotation without a declared container;
- sample-oriented ArchUnit cycle/freeze rules;
- duplicated JaCoCo/PIT configuration and committed generated reports;
- missing `.dockerignore` and incomplete Compose dependencies.

## Comparison with Wallet Golden Path

| Dimension | Wallet Golden Path | Advanced reference | Absorption rule |
| --- | --- | --- | --- |
| Purpose | minimal deterministic generation proof | broad corporate-pattern reference | keep both roles distinct |
| Modules | build, core, REST, database, configuration | same active shape plus non-reactor Mongo/AMQP | do not add physical modules solely from ZIP presence |
| Read path | generated and runtime-smoked | full CRUD/search patterns | add operations only from explicit model metadata |
| Mapping | manual | MapStruct in persistence | manual default, MapStruct optional |
| Persistence tests | H2 context/HTTP read | H2 slices, partial MySQL Testcontainers | preserve H2; add technology integration capability |
| Quality | TS tests, Goldens, independent smokes | ArchUnit, JaCoCo, PIT, Sonar | combine; never replace Wallet validation |
| Cross-cutting | intentionally minimal | errors, i18n, CORS, OpenAPI, security | absorb as separately governed capabilities |
| Determinism | explicit fixture/order/file-plan guarantees | runtime/profile defaults and system clock | preserve generator invariants |

**REFERENCE FACT** At the time of this analysis, the repository integration
test enumerates 20 multi-module artifacts, including the HTTP persistence-read
test. The Milestone brief's count of 19 reflects the preceding state; no
artifact or Golden Path is changed by Milestone 6.0.

## Capability classification

| Element | Classification | Rationale |
| --- | --- | --- |
| module-local source sets and inward dependency direction | generator foundation | portable structural convention |
| ArchUnit and JaCoCo | generator foundation | enforce architecture and measurable quality |
| global error handling and safe error contract | generator foundation | consistent external behavior |
| configuration profiles with environment inputs | generator foundation | safe runtime materialization |
| core paging common | optional/common artifact set | independent of entity searches, useful when paging is selected |
| i18n, CORS, OpenAPI, PIT, Docker, self-validation | optional capabilities | meaningful but not universal |
| JPA paging, Querydsl JPA, Entity Graph | technology-specific capabilities | require JPA/Spring Data |
| MongoDB, Querydsl MongoDB, Mongo indexes | technology-specific capabilities | require MongoDB selection and validation |
| Testcontainers | technology-specific test capability | image/driver depends on persistence choice |
| Resource Server | optional security capability | provider-neutral security layer |
| Keycloak | provider option | preferred open-source implementation, not foundation |
| MapStruct, P6Spy | optional capabilities | complexity/diagnostics trade-offs |
| Okta integration | not adopted | provider-specific and not preferred |
| Bookstore entities, filters, AMQP topology | project-specific | cannot be inferred from generic model |

## Gap analysis

| Capability | Reference project | Generator current | Gap | Priority | Proposed milestone |
| --- | --- | --- | --- | --- | --- |
| exception handling | two advice classes, message bundles | absent | `ResponseStatus` contract, semantic mapping and safe REST translation | high | 6.3 |
| i18n | English/pt-BR, custom header/cookie | absent | standard negotiation/fallback policy | high | 6.3 |
| CORS | hardcoded servlet filter | absent | property-driven MVC/Security integration | high | 6.4 |
| profiles | dev/prod with embedded defaults | H2 test-only in generated test runtime | local/test/prod convention and secrets policy | high | 6.4 |
| OpenAPI | Springdoc, annotations, UI, JWT scheme | absent | cohesive spec/UI capability | high | 6.5 |
| security | Spring Security resource server | absent | provider-neutral foundation | high | 6.12 |
| Keycloak | absent | absent | preferred open-source provider adapter | medium | 6.13 |
| SelfValidating | Jakarta/Hibernate constructor validation | absent | core dependency/lifecycle/error decision | medium | 6.6 |
| paging common | core model and Spring Data adapter | absent | generic common artifacts | high | 6.7 |
| Querydsl JPA | predicates, executors, APT | absent | build/runtime adapter and model metadata | medium | 6.8 |
| Querydsl MongoDB | non-reactor module | absent | compatibility proof and Mongo option | medium | later validation/6.8 scope decision |
| Entity Graph | Cosium repositories and dynamic graphs | absent | advanced JPA base plus relationship metadata | medium | after 6.8 |
| ArchUnit | broad suite | absent | Golden Path-specific architecture rules | highest | 6.2 |
| JaCoCo | per-module, core thresholds | absent in generated Maven project | managed reports/checks/Sonar policy | high | 6.10 |
| PIT | per-module targets, scheduled workflow described | absent | managed heavy quality capability | medium | 6.10 |
| Testcontainers | partial MySQL setup | absent | real database test profile and CI policy | high | 6.9 |
| Docker | multi-stage app image, incomplete Compose | absent | conditional image/local composition | medium | 6.11 |
| MapStruct | SQL/Mongo generated mappers | absent/manual mapping | optional processor/mapping mode | low | after core persistence roadmap |
| P6Spy | dev/prod/test diagnostics | absent | optional local/test diagnostics | low | after profiles/JPA |

## Taxonomy proposal

Milestone 6.1 fixes the initial taxonomy and profile-option decisions in
[Capability Taxonomy and Profile Options](CAPABILITY-TAXONOMY.md). The decisions
include the default/opt-in split, Jakarta-only Core boundary, standard locale
negotiation, zero-based paging with bounded size and sort allowlists, Querydsl
JPA before MongoDB validation, PostgreSQL as the provisional Testcontainers
target, aggregated plus per-module JaCoCo, scheduled PIT, OpenAPI spec by
default with environment-gated UI, provider-neutral security and the
generator/platform Keycloak boundary.

**GENERATOR DECISION** Milestone 6.1 should distinguish without immediately
changing the schema:

| Concept | Meaning | Examples |
| --- | --- | --- |
| physical module | Maven/source ownership and dependency boundary | `core`, `entrypoints-rest`, `infra-database`, `configuration` |
| capability | coherent generated behavior/artifact set | `global-error-handling`, `i18n`, `cors`, `openapi`, `archunit`, `jacoco`, `paging`, `self-validation`, `docker` |
| technology option | implementation choice within a capability/profile | `persistence.type`, `dynamicQueries`, `integrationTests`, `security.provider`, `mapping` |
| common artifact set | related artifacts emitted into their owning layers | core paging plus infra paging adapter |

Illustrative future options, not approved schema:

```text
persistence.type: jpa | mongodb
dynamicQueries: querydsl
integrationTests: testcontainers
security.provider: keycloak
mapping: manual | mapstruct
```

Capabilities compose behavior; they are not aliases for individual templates.
Physical modules remain ownership boundaries.

## Recommended roadmap

The initial sequence is sound. Entity Graph and MongoDB compatibility need
explicit placement; both are kept as follow-up decisions rather than silently
folded into the JPA milestone.

| Milestone | Objective/capabilities | Dependencies and principal artifacts | Model/schema impact | ADR / Golden Path impact | Required validation and risks |
| --- | --- | --- | --- | --- | --- |
| 6.0 | analyse advanced reference | this document and index links | none | no ADR; no Golden change | factual/path review |
| 6.1 | define capability taxonomy/profile options | capability composition contract and option vocabulary | Profile schema likely; Application Model no | ADR required; preserve existing defaults | backward compatibility and capability dependencies |
| 6.2 | ArchUnit foundation | architecture-test POM contribution and Golden Path rules | none | ADR recommended; adds tests only when enabled/defaulted | scan scope, package conventions, false positives |
| 6.3 | global errors and i18n | `ResponseStatus`, field-error model, advice, bundles | possibly error-code conventions; no entity schema | ADR required; optional/default decision | 400/409 policy, safe logging, locale fallback, field ordering |
| 6.4 | profiles and CORS | shared/local/test/prod YAML, typed CORS properties | Profile schema likely | ADR required; changes generated configuration | secret defaults, Security integration |
| 6.5 | OpenAPI foundation | Springdoc dependency, metadata, annotations, optional UI | Profile schema option; operation metadata may later affect model | ADR recommended | production exposure and security schemes |
| 6.6 | core validation/self-validation | Jakarta validation contracts, validator strategy | validation metadata eventually needed for field constraints | ADR required; opt-in until decided | core dependencies, factory lifecycle, error translation |
| 6.7 | core paging common | core Page/Pageable/PageImpl and infra adapter common | no search metadata required; Profile capability option | ADR recommended | naming, page numbering, max size, sort allowlist |
| 6.8 | JPA paging and Querydsl foundation | APT, Q-types, repository executor, generic predicate base | search operations/filters require future Application Model; common does not | ADR required | Querydsl/Spring Boot compatibility and deterministic sorting |
| 6.9 | Testcontainers database verification | database-specific test profile/container fixtures | Profile technology option | ADR recommended; adds heavier opt-in validation | Docker availability, image pinning, parallel CI |
| 6.10 | JaCoCo and PIT quality foundation | managed plugins, thresholds, reports, pipeline split | Profile/build options | ADR required | reactor aggregation, exclusions, execution time |
| 6.11 | Docker/local composition | Dockerfile, `.dockerignore`, conditional Compose | Profile options for runtime services | ADR required | executable module, healthcheck, secrets/images |
| 6.12 | provider-neutral security | SecurityFilterChain, Resource Server, 401/403, tests | Profile schema; authorization metadata may later need model support | ADR required; opt-in | CORS/order, role/scope mapping, testability |
| 6.13 | Keycloak integration | issuer/audience/claim mapping and local composition | provider option | ADR required | realm/bootstrap ownership and secret handling |

Recommended follow-ups after 6.8:

- Entity Graph foundation after relationship metadata is designed;
- MongoDB/Querydsl compatibility spike before promising Mongo generation;
- `search-operations` after the Application Model can declare filters,
  operators and sorting;
- MapStruct and P6Spy only after their parent capabilities are stable.

## Open questions

1. Which capabilities become defaults of `java-spring-clean-multimodule` and
   which require explicit enablement?
2. Should stable Jakarta APIs be allowed in core by policy, and may provider
   implementations such as Hibernate Validator also live there?
3. Is self-validation constructor-driven, service-driven or port-driven?
4. What final status mapping and message-code namespace should accompany the
   `ResponseStatus` contract?
5. What are the supported/default locales and fallback behavior?
6. Is pagination zero-based externally, and what maximum page size/sort
   allowlist is enforced?
7. How will search filters/operators/allowed sorts be represented in the
   Application Model?
8. Is Querydsl JPA the first dynamic-query adapter, and what is the supported
   MongoDB Querydsl stack after validation?
9. Which production database family is the first Testcontainers target?
10. Should JaCoCo reports be per-module, aggregated, or both for Sonar?
11. What PIT mutation threshold and schedule are acceptable?
12. Is OpenAPI specification default while UI remains environment-gated?
13. What authorization abstraction maps model intent to scopes/roles?
14. Who owns Keycloak realm/client bootstrap: generator, deployment capability
    or external platform?
15. Should generated Compose target developer convenience only or also serve
    as an integration-test orchestration artifact?

## Milestone 6.0 conclusion

The reference confirms a reusable inward-dependency module structure and
provides strong candidates for architecture, quality, error, i18n, paging and
technology-specific persistence capabilities. It also contains project-specific
choices, partially wired modules and configuration that should not be promoted
to defaults. The immediate next step is capability taxonomy and option
semantics, not producer or template implementation.
