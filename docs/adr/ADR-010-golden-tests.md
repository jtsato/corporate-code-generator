# ADR-010 — Golden Tests for Generated Artifacts

## Status

Accepted

## Context

Unit tests can verify individual Rules, Transformers and Technology Adapters.

However, the primary observable behavior of Corporate Code Generator is the generated artifact itself.

A small change to:

* a Rule;
* Transformer;
* Technology Adapter;
* Template;
* Profile;
* Module;

may change generated source code even when all individual unit tests continue to pass.

Generated output therefore requires explicit regression testing.

## Decision

Corporate Code Generator will use Golden Tests as a primary mechanism for validating generated artifacts.

A Golden Test compares generated output against an explicitly approved expected artifact.

Conceptually:

```text
Fixture
   │
   ▼
Generator
   │
   ▼
Actual Output
   │
   ▼
Comparison
   │
   ▼
Expected Output
````

Example:

```text
tests/
└── golden/
    └── java-spring-clean/
        └── simple-wallet/
            ├── input/
            │   └── model.yaml
            │
            └── expected/
                └── core/
                    └── src/
                        └── main/
                            └── java/
                                └── ...
                                    └── Wallet.java
```

## Expected Behavior

If generated output differs from the approved Golden artifact, the test fails.

The developer must then determine whether the difference represents:

* a regression; or
* an intentional change to generated behavior.

Intentional changes require explicit review and update of the Golden artifact.

## Scope

Golden Tests may validate:

* individual generated files;
* sets of files;
* complete generated project trees.

As Profiles mature, complete application scaffolds should have Golden coverage.

## Golden Tests vs Generated Project Tests

Golden Tests answer:

> Did we generate exactly what we expected?

Generated Project Tests answer:

> Does what we generated actually work?

Both are required.

For Java, this eventually means:

```text
Golden comparison
        +
./mvnw verify
```

For infrastructure artifacts, examples may include:

```text
helm lint
terraform validate
docker build
```

## Normalization

Golden comparisons should avoid masking meaningful differences.

Normalization may be applied only when explicitly defined and justified.

Examples that may require controlled normalization:

* platform-specific line endings;
* deterministic formatter output.

Volatile generated content should preferably be eliminated rather than ignored.

## Consequences

### Positive

* generated behavior becomes explicit;
* regressions produce readable diffs;
* Template changes are visible;
* Golden Path evolution is reviewable;
* generated artifacts become executable specifications.

### Negative

* expected artifacts must be maintained;
* intentional broad changes may produce large diffs;
* careless snapshot updating could hide regressions.

## Architectural Rule

A change that intentionally modifies generated artifacts must include corresponding Golden Test changes.

Golden artifacts must be reviewed as production behavior, not automatically accepted snapshots.
