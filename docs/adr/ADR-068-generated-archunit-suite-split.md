# ADR-068 — Generated ArchUnit Suite Split

## Status

Accepted — Milestone 6.47.

## Context

The generated `java-spring-clean-multimodule` configuration module emitted one
`ArchitectureTests` class containing eight ArchUnit rules. Its
`JavaClasses` importer was an instance field, so JUnit's per-method lifecycle
re-imported the generated production classpath for every test method.

The suite also needed to remain compatible with the existing Maven smoke
selector, `-Dtest=*ArchitectureTests`, which selects generated test classes by
their `ArchitectureTests` suffix.

## Decision

Split the generated suite into three classes in the existing
`<namespace>.architecture` package:

- `LayerDependencyArchitectureTests` contains the three layer-dependency rules.
- `FrameworkIsolationArchitectureTests` contains the three framework-isolation rules.
- `PackageStructureArchitectureTests` contains the two package-structure rules.

Each class keeps the `ArchitectureTests` suffix and declares one
`private static final JavaClasses IMPORTED_CLASSES` importer. The rule bodies
are relocated without adding, removing, or rewording a rule. Each template
imports only the ArchUnit constructs required by its own rules; JPA `Entity`
and the `classes()` DSL are used only by the package-structure template.

The existing `JavaArchUnitTestTemplateModel` is reused for all three classes.
The manifest and configuration artifact producer emit three artifacts in the
same configuration-module slot, raising the full-profile count from 162 to
164.

## Alternatives rejected

- **Adopting ArchUnit's `@AnalyzeClasses`/`@ArchTest` JUnit-5 engine:** rejected
  because introducing a second test engine could put the Surefire `-Dtest`
  selector at risk. It would also be an engine capability change rather than
  a suite split.
- **Frozen-rule stores:** rejected. Decision D12 remains **NOT ADOPTED**; the
  generated rules stay ordinary explicit JUnit test methods.
- **Keeping one class or changing the suffix:** rejected because either keeps
  the repeated importer cost or risks silently excluding the suite from the
  existing architecture smoke selector.

## Scope boundary

This decision changes only the generated multi-module ArchUnit suite, its
manifest/producer composition, associated generated goldens, count assertions,
and smoke validation. It does not add architecture rules, change rule logic,
adopt frozen-rule storage, change the single-module or NestJS profiles, or
implement Milestone 6.48 mutation testing.

## Consequences

- The full generated project has two additional test artifacts and emits three
  independently named architecture classes.
- The existing `-Dtest=*ArchitectureTests` selector continues to select the
  complete suite.
- Classpath import work decreases from one import per test method to one import
  per split class.
- Rule-family ownership is visible in generated source files, while the
  generator keeps one shared template model and deterministic output.

## Validation

- `npm run typecheck`, `npm run build`, and the complete `npm test` suite pass.
- `npm run smoke:java-multimodule` passes the generated/golden byte comparison.
- `CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:archunit:java-multimodule`
  passes and confirms all three Surefire reports.
- A fresh CLI run produces 164 CREATE operations and the three named
  architecture classes; each replacement golden matches its generated source
  by SHA-256.
- `mvn -B clean verify` passes against the freshly generated wallet project.
