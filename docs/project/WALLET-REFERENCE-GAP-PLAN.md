# Wallet Reference Gap Plan

## Purpose

This document compares the current generated output of the
`java-spring-clean-multimodule` Golden Path (`generated/`, produced from
[examples/wallet-service/model.yaml](../../examples/wallet-service/model.yaml))
against the hand-written reference project `C:\Dev\77-challenge\wallet-service-java`,
and proposes an action plan focused on the artifacts the generator does not
produce yet.

It is an analysis and a proposal. It does not approve implementation, change the
Application Model or Profile schema, or modify either Java Golden Path. Each
milestone proposed here still requires its own ADR, Golden coverage and quality
gates per [ADR-010](../adr/ADR-010-golden-tests.md) and
[Quality Gates](QUALITY-GATES.md).

Labels reused from [Extended Reference Architecture](../target-architecture/EXTENDED-REFERENCE-ARCHITECTURE.md):
**REFERENCE FACT**, **GENERATOR DECISION**, **NOT ADOPTED**, **OPTIONAL CAPABILITY**,
**REQUIRES VALIDATION**.

## Comparison baseline and what it is not

**REFERENCE FACT** The two projects do not share a domain. `wallet-service-java`
implements a Wallet plus a Transaction domain (deposit, withdraw, transfer,
history, balance, historical balance). `generated/` implements a single Wallet
entity with generic CRUD.

**GENERATOR DECISION** Business classes of the reference
(`DepositUseCaseImpl`, `TransferProvider`, `Type`, `Transaction`, balance rules)
are **PROJECT-SPECIFIC** and are not gaps. They can only be generated from
Application Model metadata that does not exist yet (multi-entity aggregates,
domain operations beyond CRUD). Comparing them file-by-file would be misleading.

The comparison below is therefore **structural and capability-level only**.

**REFERENCE FACT** The generated project is ahead of the reference in several
capabilities the reference does not have at all: declarative filtering
(`FilterExpression`, `RestFilterParser`, `QuerydslFilterMapper`), sort
allowlists (`RestSortParser`), a technology-neutral paging contract
(`PageRequest`/`PageResult`), soft delete with tombstones, restore and
deleted-only queries, PATCH with explicit presence tracking, composite unique
groups, auditing, a property-driven CORS policy, and a structured
`ResponseStatus` error contract. None of that is at risk in this plan.

## Gap inventory

### Group A — Root operational files

**REFERENCE FACT** The generated project root contains only `pom.xml` and
`.github/workflows/java-ci.yml`. The reference root additionally contains:

| Artifact | Reference | Generated | Classification |
| --- | --- | --- | --- |
| `.gitignore` | present | absent | generator foundation |
| `README.md` | present, 8.3 KB | absent | generator foundation |
| `Dockerfile` | multi-stage temurin 25, non-root, healthcheck | absent | **OPTIONAL CAPABILITY** |
| `.dockerignore` | absent | absent | required with Docker |
| `docker-compose.yml` | present, app-only | absent | **OPTIONAL CAPABILITY** |
| `mvnw`, `mvnw.cmd` | present | absent | **REQUIRES VALIDATION** (`.mvn/wrapper` is missing in the reference, so its wrapper is incomplete) |
| `run.cmd`, `run-app.cmd`, `run-test.cmd`, `run-mutation.cmd` | present | absent | **OPTIONAL CAPABILITY** |
| `Smoke.http` | present | absent | **OPTIONAL CAPABILITY** |
| `docs/c4-model/*.puml`, `docs/diagrams/*.png` | present | absent | **NOT ADOPTED** (decision D11) |
| `.vscode/settings.json` | present | absent | **NOT ADOPTED** (editor-local) |
| `lombok.config` per module | present | absent | **NOT ADOPTED** (see decision D10) |
| `META-INF/maven/plugin.xml` | present | absent | **NOT ADOPTED** (build residue) |

### Group B — Maven build governance

**REFERENCE FACT** The generated parent POM declares only `modules` and five
properties. It has no `dependencyManagement`, no `pluginManagement`, no shared
test dependencies, no coverage plugin, no mutation plugin, no analysis plugin,
and no executable-jar `finalName`.

**REFERENCE FACT** The reference parent declares Surefire, Failsafe and PIT
under `build/plugins`, a Sonar `pluginManagement` entry, shared JUnit/Mockito/
AssertJ dependencies, and Sonar coordinates as properties. `core/pom.xml`
additionally configures JaCoCo `prepare-agent`, `report` and a `check` execution
enforcing 100% line coverage at `verify`, plus PIT `targetClasses`
`...core.*.usecase.*UseCaseImpl`.

Gaps, in order of value:

1. no coverage measurement or threshold in the generated Maven project;
2. no centralized dependency/plugin version management in the generated parent;
3. no mutation-testing capability;
4. no static-analysis integration;
5. no `finalName` for the executable artifact (the reference produces
   `walletservice-starter.jar`, which its Dockerfile depends on).

### Group C — CI workflow

**REFERENCE FACT** The generated `java-ci.yml` has three steps (checkout, setup
Java, `mvn -B clean verify`) and uses floating major tags (`@v4`). The reference
workflow pins actions by commit SHA, sets `fetch-depth: 0`, caches `~/.m2` and
`~/.sonar/cache`, adds `workflow_dispatch`, runs `verify` with an explicit
active profile, and runs a Sonar scan guarded by secret presence. It also ships
a second workflow that regenerates C4 diagrams.

### Group D — `core` module

| Reference artifact | Generated equivalent | Verdict |
| --- | --- | --- |
| `common/paging/{Page,PageImpl,Pageable}` | `common/paging/{PageRequest,PageResult,SortDirection,SortOrder}` | no gap; generated model is richer |
| `common/validation/SelfValidating` | present | no gap |
| `common/{GetLocalDateTime,GetLocalDateTimeImpl}` | template exists, emitted only when auditing is enabled | no gap; capability-gated |
| `common/{GetLocalDate,GetLocalDateImpl}` | absent | low value; fold into the clock port if a date-only port is ever needed |
| `common/validation/LocalDate(Time)Constraint` + validators | absent | **OPTIONAL CAPABILITY**: string-to-temporal validation, only relevant if the model ever declares string dates |
| `common/EnumeratorUtils` | absent | **PROJECT-SPECIFIC**; blocked on enum support in the Application Model |
| `exception/{CoreException,NotFoundException,...}` | `common/exception/{ApplicationException,ConflictException,NotFoundException,ValidationException,FieldViolation}` | no gap; generated hierarchy is the ADR-025 design |
| `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` | absent | needed only if generated tests mock final classes |

**GENERATOR DECISION** `core` is essentially at parity. It is the lowest
priority group.

### Group E — `entrypoints/rest` module

**REFERENCE FACT** The reference REST module owns its own tests: six controller
tests, a `JsonConverterTest`, a `ControllerTestFixture`, a test-scoped
`WalletsServiceApplication` bootstrap class, `logback-test.xml`, and test
message bundles.

**REFERENCE FACT** The generated REST module has four test classes, all pure
unit tests of the filter/sort parsers and definitions. It contains **no
controller test**. All HTTP coverage lives in `configuration/src/test`.

| Reference artifact | Generated | Classification |
| --- | --- | --- |
| `*ApiMethod` interfaces holding OpenAPI annotations | annotations inline in `WalletController` (53 occurrences) | decision D6 |
| `*Presenter` static mappers | mapping inline in the controller/response records | decision D7 |
| controller tests + `ControllerTestFixture` | absent from the module | decision D2, milestone gap |
| `src/test/resources/logback-test.xml` | absent | small, ships with controller tests |
| `common/JsonConverter` | absent | **NOT ADOPTED** (logs full request DTOs) |
| `common/ControllerLogger` | absent | **NOT ADOPTED** |
| `common/metric/LogExecutionTime` + AOP impl | absent | **NOT ADOPTED** (Micrometer supersedes it) |
| `common/WebRequest`, `WebRequestResponse` | absent | **NOT ADOPTED** (mutable request holder) |
| `common/{HttpResponseStatus,HttpStatusConstants}` | `common/ResponseStatus` | no gap; ADR-025 contract is the successor |
| duplicated `exception/handler/*` inside the REST module | absent | **NOT ADOPTED** (reference duplicates its handlers in two modules) |

### Group F — `infra/database` module

**REFERENCE FACT** The reference persistence module owns seven `@DataJpaTest`
provider tests, six per-test `.sql` fixtures under
`src/test/resources/<package>/<TestName>.sql`, `application-h2.yaml`,
`application.yaml` and a test-scoped bootstrap application class.

**REFERENCE FACT** The generated persistence module has six test classes, all
pure unit tests (filter mapper, value converter, paging mappers, filter
definition, predicate builder). It has **no persistence slice test and no test
resources**. All persistence coverage lives in `configuration/src/test`.

| Reference artifact | Generated | Classification |
| --- | --- | --- |
| `@DataJpaTest` provider tests + `.sql` fixtures + `application-h2.yaml` | absent from the module | decision D2, milestone gap |
| test-scoped bootstrap application class | absent | required by D2 |
| `common/{PageMapper,PageRequestHelper,ListMapper}` | `database/common/paging/SpringDataPage*Mapper` | no gap |
| `common/predicate/{PredicateBuilder,AbstractPredicateBuilderImpl}` | `database/domains/wallet/query/WalletPredicateBuilder` + `database/common/filter/*` | no gap; generated design is model-driven |
| `common/PrettySqlFormat` + `spy.properties` | absent | **NOT ADOPTED** (P6Spy diagnostics) |
| `common/GetLocalDateTimeMockImpl` | absent | superseded by clock-port injection in tests |
| `configuration/src/main/resources/import.sql` | absent | **OPTIONAL CAPABILITY** (seed data) |

### Group G — `configuration` module

| Reference artifact | Generated | Classification |
| --- | --- | --- |
| `MessageSourceConfiguration`, `LocaleWebMvcConfigurer`, `LocaleChangeHeaderInterceptor` | bundles exist (`messages.properties`, `messages_pt_BR.properties`) and are consumed by `GlobalExceptionHandler`, but no explicit locale policy is generated | partial gap: default locale, supported-locale allowlist and fallback are implicit Spring Boot defaults |
| `ByPassSecurityConfiguration`, `ProductionSecurityConfiguration` | absent | **OPTIONAL CAPABILITY**, already scheduled as provider-neutral security work |
| `SwaggerConfiguration`, `MvcConfiguration` | `openapi/OpenApiConfiguration`, `web/CorsWebConfiguration`, `web/RestFilterWebConfiguration` | no gap |
| `WebRequestStubConfiguration` | absent | **NOT ADOPTED** (pairs with the rejected `WebRequest`) |
| two `@RestControllerAdvice` classes | one `GlobalExceptionHandler` | no gap; single translation boundary is the ADR-025 decision |
| five ArchUnit test classes + `archunit_store` + `archunit.properties` | one `ArchitectureTests` | decision D12 |
| `application-{test,uat}.yml` | `application{,-local,-prod,-test}.yaml` | no gap; ADR-026 convention is stricter |

### Group H — test placement

**REFERENCE FACT** `configuration/src/test` in the generated project holds 24
test classes in a single flat package `io.github.jtsato.walletservice`, mixing
HTTP runtime tests, persistence tests, OpenAPI/CORS smokes and the application
context test. The reference keeps only five ArchUnit classes there, in an
`archunit` sub-package.

This is the largest structural divergence and is addressed by decisions D2 and D3.

## Structural decisions required

Each decision below changes where generated classes live. None can be settled by
the reference alone, because parts of the reference are explicitly classified as
legacy. Recommendation is given for each; the decision itself is pending.

| ID | Question | Reference | Generated today | Recommendation |
| --- | --- | --- | --- | --- |
| D1 | Package root inside `infra/database` | `infra.domains.*` only | split between `infra.database.common.*`/`infra.database.domains.*` and `infra.domains.wallet.*` | unify under `infra.database.*`; the current split is an inconsistency, not a design |
| D2 | Which module owns integration tests | controller tests in REST, provider tests in persistence, ArchUnit in configuration | everything in `configuration` | distribute: controller tests to REST, `@DataJpaTest` to persistence, keep only end-to-end HTTP + ArchUnit + context in configuration; requires a test-scoped bootstrap class per module |
| D3 | Test package layout in `configuration` | `…/archunit/` | 24 classes flat in the root package | sub-packages (`architecture`, `http`, `persistence`, `smoke`) |
| D4 | Use-case implementation suffix | `…UseCaseImpl` | `…UseCaseInteractor` | keep `Interactor`; note that PIT/Sonar patterns must target it |
| D5 | Gateway port granularity | one port per operation, plus `xcutting` shared ports | one `WalletGateway` per entity | keep the single port; per-operation ports only if an ISP capability is requested |
| D6 | OpenAPI annotation placement | separate `*ApiMethod` interface | 53 annotation usages inline in `WalletController` | extract to a generated `*ApiMethod` interface; the controller is already annotation-dominated |
| D7 | Domain-to-response mapping | separate `*Presenter` classes | inline in controller/response records | keep inline while one entity maps to one response; revisit with relationships |
| D8 | Config resource extension and profiles | `.yml`, `test`/`uat` | `.yaml`, `local`/`test`/`prod` | keep generated (ADR-026) |
| D9 | Exception handler location | duplicated in REST and configuration | configuration only | keep generated |
| D10 | Lombok | used in every module, with `lombok.config` | not used; records and explicit constructors | keep Lombok out |
| D11 | Generated project documentation | `README.md`, C4 `.puml`, rendered PNGs | none | **DECIDED**: generate `README.md` only. C4 `.puml` sources and rendered diagrams are **NOT ADOPTED** |
| D12 | ArchUnit suite shape | five rule classes + frozen-rule store | one `ArchitectureTests` | split by rule family; **NOT ADOPTED**: frozen rules, which institutionalize violations |

## Proposed milestones

Sequenced by value/cost. Each is a Phase 6 continuation of the Java Golden Path
and follows the existing workflow: ADR, producer/template change, Golden update,
unit tests, and the smoke gate matching the capability.

| ID | Title | Scope | Depends on |
| --- | --- | --- | --- |
| 6.37 | Generated repository hygiene | `.gitignore` and `README.md` for the generated project | — |
| 6.38 | Maven build governance | `dependencyManagement`/`pluginManagement` in the generated parent, shared test dependencies, Surefire/Failsafe declarations, executable `finalName` | — |
| 6.39 | Generated coverage gate | JaCoCo `prepare-agent`/`report` per module and a `check` threshold at `verify`; threshold value is an ADR decision | 6.38 |
| 6.40 | Module-local test ownership | executes D1, D2 and D3; no new capability, pure relocation plus test-scoped bootstrap classes | D1, D2, D3 |
| 6.41 | Generated REST module tests | MockMvc controller tests, `ControllerTestFixture`, `logback-test.xml`, test bundles inside `entrypoints/rest` | 6.40 |
| 6.42 | Generated persistence slice tests | `@DataJpaTest` provider tests, per-test `.sql` fixtures, `application-h2.yaml` inside `infra/database` | 6.40 |
| 6.43 | OpenAPI contract interface | executes D6: generated `*ApiMethod` interface carrying the operation/response annotations | D6 |
| 6.44 | Generated CI hardening | SHA-pinned actions, Maven cache, `workflow_dispatch`, explicit profile, optional analysis step guarded by secret presence | 6.39 |
| 6.45 | Docker capability | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, non-root runtime, Actuator healthcheck; opt-in profile option | 6.38 |
| 6.46 | i18n policy completion | explicit default locale, supported-locale allowlist, fallback, and a generated locale-negotiation test | — |
| 6.47 | ArchUnit suite split | executes D12 | — |
| 6.48 | Mutation testing capability | PIT with `targetClasses` aligned to the `Interactor` suffix; opt-in, excluded from every-push CI | 6.39 |
| 6.49 | Testcontainers verification | opt-in database integration profile | 6.42 |
| 6.50 | Developer run scripts and `Smoke.http` | opt-in convenience artifacts | 6.37 |

Deferred and unchanged by this plan: provider-neutral security, Keycloak,
MapStruct, P6Spy, Maven wrapper, MongoDB. Static-analysis (Sonar) coordinates
are organization-specific and belong to a profile option, not to a default.

## Decision record

All twelve structural decisions were approved as recommended, with one
amendment: under D11 the generated project receives a `README.md` only, and C4
`.puml` sources are **NOT ADOPTED**. The diagram milestone was therefore removed
and the remaining milestones renumbered.

## Explicitly not adopted

`JsonConverter` request logging, `ControllerLogger`, `LogExecutionTime` AOP
timing, mutable `WebRequest`/`WebRequestStubConfiguration`, duplicated exception
handlers in the REST module, P6Spy and `spy.properties`, Lombok and
`lombok.config`, ArchUnit frozen-rule stores, `.vscode/settings.json`,
`META-INF/maven/plugin.xml`, C4 `.puml` sources and committed binary diagrams,
leading-slash reactor module paths, and provider-specific security helpers.
