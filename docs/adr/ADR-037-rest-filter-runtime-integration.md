# ADR-037 — REST Filter Runtime Integration

## Status

Accepted — Milestone 6.15.

## Context

The REST Filter Contract Foundation ([ADR-034](ADR-034-rest-filter-contract-foundation.md))
parses a future HTTP contract into a `FilterExpression`, and the Querydsl
Filter Runtime Integration ([ADR-036](ADR-036-querydsl-filter-runtime-integration.md))
connects a `FilterExpression` to the database through `Find<Entity>ByFilterUseCase`,
`QuerydslFilterMapper` and `ListQuerydslPredicateExecutor`. Both were correct
in isolation, but nothing generated consumed the parser's output over HTTP:
`WalletController` still called `FindWalletsUseCase.execute()` with no query
parameter, and OpenAPI documented no `filter` parameter.

## Decision

`WalletController` now binds a repeatable `filter` query parameter and
orchestrates the two existing foundations without duplicating any of their
rules.

* The controller injects `Find<Entity>ByFilterUseCase` instead of
  `Find<Entity>UseCase`. The untouched use case and interactor remain
  generated and registered as a Spring bean in `<Entity>Configuration`
  (Milestone 6.14 wiring), simply no longer injected into the controller.
* The HTTP signature is
  `@GetMapping public List<<Entity>Response> findAll(@RequestParam(name = "filter", required = false) List<String> filter)`.
  A missing parameter yields `filter == null`.
* The method body is pure orchestration:
  `FilterExpression expression = RestFilterParser.parse(filter, <Entity>RestFilterDefinition.create());`
  followed by `findByFilterUseCase.execute(expression)`. No field, alias,
  operator, or value rule is re-implemented in the controller.
* `RestFilterParser.parse(null, definition)` already returns
  `FilterExpression.empty()` (proven by `RestFilterParserTests`), which the
  Milestone 6.14 gateway provider already converts to `repository.findAll()`.
  No branch for "no filter" was added to the controller.
* The `filter` parameter is documented with `@Parameter` (name, description,
  example) and `@ArraySchema(schema = @Schema(type = "string"))` for the
  repeated-query-parameter shape, plus a new `400` entry in `@ApiResponses`.
  No DTO was introduced for documentation purposes.
* Both `RestFilterParser` and `QuerydslFilterMapper`/`QuerydslFilterValueConverter`
  already throw the shared `ValidationException`. The existing
  `GlobalExceptionHandler.handleValidationException` converts it to HTTP 400
  unchanged — no new exception type or handler was introduced.

### A real defect found only by running Maven: comma-splitting

Real Maven execution of the generated `*HttpFilterTests` (not merely a
compile) surfaced a genuine Spring MVC binding defect that no amount of
design review would have caught: when a `filter` query parameter appears
**exactly once** in the request, Spring's default `ConversionService` treats
it as a single `String` and converts it to `List<String>` by **splitting on
commas** (`StringToCollectionConverter`, the same mechanism `@ConfigurationProperties`
relies on for CSV-style binding). Repeated occurrences of `filter` are
unaffected, because they already arrive as a `String[]` and convert
element-wise.

This directly collides with the REST filter contract's own comma-separated
`in` value syntax (`filter=id:in:<uuid1>,<uuid2>`): a single occurrence was
incorrectly split into two list elements, and `RestFilterParser` correctly
rejected the second fragment as a malformed filter (HTTP 400 instead of the
expected 200).

Two fixes were evaluated against real output:

* `@org.springframework.boot.convert.Delimiter(Delimiter.NONE)` on the
  parameter — this annotation only affects Spring Boot's relaxed
  `@ConfigurationProperties` binder, not the `WebDataBinder`/`ConversionService`
  path used by `@RequestParam`. Verified ineffective by direct Maven
  execution; not used.
* A `PropertyEditor` registered via `@InitBinder("filter")` — this
  intercepts the single-occurrence case correctly, but Spring's
  `TypeConverterDelegate` joins an already-split `String[]` (the repeated-
  parameter, AND case) into a single comma-delimited string *before* handing
  it to a text-based `PropertyEditor`, which broke the AND scenario instead.
  Verified by direct Maven execution; not used.

**Decision: a scoped `Converter<String, List<String>>`.** A new generated
class, `RestFilterWebConfiguration` (`configuration.web`, `@Configuration`
implementing `WebMvcConfigurer`), registers exactly one converter through
`addFormatters(FormatterRegistry)`:

```java
registry.addConverter(new Converter<String, List<String>>() {
    public List<String> convert(String source) { return List.of(source); }
});
```

Because Spring's conversion service dispatches on the *source* type, this
converter only intercepts the single-`String`-source case (wrapping it as a
one-element list, preserving any commas), while the existing
`ArrayToCollectionConverter` still handles the `String[]` (repeated
parameter) case unchanged. Verified correct for all three shapes — absent,
single occurrence with a comma, and two repeated occurrences — by direct
Maven execution before being folded into the generated golden output.

This is a one-artifact, minimal-footprint fix: it does not change the
`@RequestParam` signature mandated for `WalletController`, does not touch
`RestFilterParser` or `QuerydslFilterMapper`, and does not introduce
escaping, a DTO, or a new exception path.

### HTTP smoke test

`<Entity>HttpFilterTests` is generated per entity in the `configuration` test
source set, next to the existing HTTP smokes. It reuses the same driver-
attribute selection as `<Entity>QuerydslFilterPersistenceTests` (Milestone
6.14) — and therefore the same three deterministic fixtures — but drives the
scenarios through real HTTP query parameters and a `java.net.http.HttpClient`
instead of constructing `FilterExpression` values directly. It uses
`@SpringBootTest(webEnvironment = RANDOM_PORT)`, `@ActiveProfiles("test")`
(real H2), and the repository for arrange/cleanup — no mocks. Positive
scenarios compare response identifiers as a set (`containsExactlyInAnyOrder`),
extracted from the JSON body via `ObjectMapper`/`JsonNode`, never by raw body
string equality. Negative scenarios assert only the HTTP status code.

### OpenAPI smoke

`<Entity>OpenApiSmokeTests` gained a second test,
`documentsTheFilterQueryParameter`, which parses `/v3/api-docs` with
`ObjectMapper` and asserts pointed facts — the parameter exists, is in
`query`, is not required, its description contains the
`<field>:<operator>[:<value>]` syntax fragment, its schema type is `array`,
and a `400` response is documented — rather than a full-document snapshot or
a raw substring match, which would be too fragile to formatting changes.

## Consequences

* Filters are reachable end to end:
  `HTTP query params -> RestFilterParser -> FilterExpression -> Find<Entity>ByFilterUseCase -> QuerydslFilterMapper -> ListQuerydslPredicateExecutor -> JPA/H2 -> <Entity>Response`.
* `GET /wallets` without a filter is unchanged: HTTP 200, same response
  shape, same empty-expression-to-`findAll()` fallback.
* `Find<Entity>UseCase` and its interactor remain generated and registered
  but are no longer reachable from the controller; nothing else references
  them at the HTTP layer.
* One additional generated production artifact,
  `RestFilterWebConfiguration`, was required beyond the three artifacts
  anticipated by the pre-implementation design (`WalletController`,
  `WalletHttpFilterTests`, `WalletOpenApiSmokeTests`) — a divergence found
  only by executing the generated project with Maven, not by design review
  or `tsc`/`vitest`.
* Pagination, sorting, `PageResult` over HTTP, OR/nested REST syntax,
  escaping, case-insensitive matching, and a filter DTO remain future work.
* Core, Infra, the single-module profile, and every POM are unchanged.

## Artifact counts

Measured with real `--dry-run` output, reading the `Operations:` summary
line.

| Selection | Before (6.14) | After (6.15) |
| --- | ---: | ---: |
| `build` | 6 | 6 |
| `core` | 28 | 28 |
| `entrypoints-rest` | 38 | 38 |
| `infra-database` | 46 | 46 |
| `configuration` | 82 | 84 |
| `build` + `core` | 34 | 34 |
| `build` + `configuration` | 82 | 84 |
| full profile | 82 | 84 |

`configuration` gains two artifacts: `WalletHttpFilterTests.java` (new test)
and `RestFilterWebConfiguration.java` (new production class, see above). No
other module's own production changed, so `build`, `core`,
`entrypoints-rest`, `infra-database`, and `build+core` are unchanged.
