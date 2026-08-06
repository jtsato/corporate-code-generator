# REST PATCH Integration Design

**Status:** Proposed for implementation after user review

**Goal:** Add deterministic partial-update support to the Java multi-module Golden Path through `PATCH /<entities>/{id}` while preserving the existing PUT, POST, GET, and DELETE contracts.

## Scope

The generated Java multi-module profile will expose a PATCH operation for every generated entity with an identifier and at least one non-identifier attribute. PATCH is a partial update: omitted properties retain their current values, supplied values replace current values, and explicit `null` clears a nullable attribute.

This change applies only to `java-spring-clean-multimodule`. The single-module profile, Application Model schema shape, persistence technology, and existing HTTP contracts remain unchanged.

## HTTP contract

The generated endpoint is:

```text
PATCH /<collection>/{id}
```

The identifier is taken from the path and is never accepted from the request body.

| Request condition | Response |
| --- | --- |
| One or more valid fields supplied | `200` with the updated response DTO |
| Body has no recognized fields | `400` |
| Malformed JSON, invalid field type, or invalid path identifier | `400` |
| `null` supplied for an attribute with `required: true` | `400` |
| `null` supplied for an attribute with `required: false` | Field is cleared; response is `200` |
| Identifier does not exist | `404` |
| Unexpected failure | `500` |

An omitted field is not changed. An explicit `null` is distinct from omission. Existing Jackson unknown-property behavior is preserved; a payload without any recognized generated attribute is rejected as an empty PATCH.

## Generated REST representation

`Patch<Entity>Request` is a generated mutable request class, not a record. Each non-identifier property has:

- a typed nullable value;
- a presence flag initialized to `false`;
- a Jackson setter that assigns the value and marks the property as supplied, including when the value is `null`.

The request converts to `Patch<Entity>Command` using the path identifier, each typed value, and each presence flag. Jackson remains confined to the REST adapter; Core receives only semantic values and presence flags.

## Core runtime

The generator adds these Core artifacts for each entity:

- `Patch<Entity>Command`;
- `Patch<Entity>UseCase`;
- `Patch<Entity>UseCaseInteractor`;
- `Patch<Entity>UseCaseInteractorTests`.

The command validates:

1. the identifier is present;
2. at least one non-identifier presence flag is `true`;
3. a supplied `null` is rejected for attributes marked `required: true`;
4. a supplied `null` is accepted for attributes marked `required: false`.

The interactor loads the current entity through the existing `findById` gateway contract, constructs a new entity by selecting each supplied command value or the current value when absent, and delegates the merged entity to the existing `update` gateway method. No gateway interface change or Jackson dependency is introduced in Core.

## Generated validation

The configuration module adds one real-H2 HTTP integration test per entity. For the Wallet golden path it covers:

- patching one field while preserving the other fields;
- patching multiple fields;
- rejecting an empty object;
- rejecting `null` for required `balance`;
- returning `404` for an unknown identifier;
- returning `400` for malformed JSON;
- returning `400` for an invalid UUID path;
- persisting and returning the merged result.

Transformer and producer tests use entities with `required: false` attributes to verify that explicit `null` is generated as a clearing operation. The generated runtime contract for optional attributes is therefore tested without changing the Wallet example model solely to manufacture a nullable field.

The generated OpenAPI smoke test verifies `PATCH /<collection>/{id}`, the required path parameter, a request schema with no required individual properties and no identifier property, the `200` response DTO, and `400`/`404`/`500` responses.

## Artifacts and counts

The expected additions are four Core artifacts, one REST request artifact, and one configuration HTTP test artifact:

| Selection | Expected count after PATCH |
| --- | ---: |
| Full multi-module profile | 131 |
| `--module configuration` | 131 |
| `--module core` | 54 |
| `--module entrypoints-rest` | 74 |
| `--module infra-database` | 72 |
| `--module build --module core` | 60 |
| `--module build` | 6 |
| Single-module selections | unchanged |

These counts are acceptance targets and must be confirmed from the built CLI before updating goldens or current-state documentation.

## Documentation and delivery

The implementation adds ADR-051, updates the generated Java reference architecture and capability taxonomy, moves PATCH out of future work, and records Milestone 6.31 as done only after validation. It adds `smoke:http-patch:java-multimodule` to `package.json`, excludes it from the default Vitest and coverage suites, and runs it in CI before the full Maven reactor gate.

No dependency, POM, single-module, security, optimistic-locking, ETag, audit, soft-delete, merge-policy, or deployment changes are part of this design.

## Acceptance criteria

- Identical declared inputs produce deterministic PATCH artifacts.
- Generated Core contains no Spring, JPA, Jackson, or REST dependency.
- Existing GET, POST, PUT, and DELETE generated output and runtime behavior remain unchanged except for the controller's additional PATCH operation and related OpenAPI documentation.
- `npm run typecheck`, `npm run build`, `npm test`, coverage, relevant producer/integration tests, the PATCH smoke, and the full Maven reactor pass.
- Dry-run counts match the expected targets above.
- Golden output is regenerated from the actual CLI and contains only approved PATCH artifacts and changes.
