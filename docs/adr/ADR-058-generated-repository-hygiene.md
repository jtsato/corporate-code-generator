# ADR-058 — Generated Repository Hygiene (`.gitignore` and `README.md`)

## Status

Accepted — Milestone 6.37.

## Context

A generated `java-spring-clean-multimodule` project produced source, tests,
build files and a CI workflow, but nothing that makes the output usable as a
repository. Two consequences followed.

First, the generated tree had no `.gitignore`. A consumer who ran `mvn verify`
and then `git add .` would commit `target/` directories, `*.class` files,
JaCoCo `*.exec` output and IDE metadata. Every generated project would need the
same hand-written file as its first manual commit.

Second, the generated tree had no `README.md`. The module boundaries, the
inward dependency rule, the commands that build and run the project, the HTTP
surface and the configuration profiles were all discoverable only by reading
the generated sources, even though every one of those facts is already known to
the generator at plan time.

The gap analysis against the hand-written `wallet-service-java` reference
recorded both files as present there and absent from generated output. See
[Wallet Reference Gap Plan](../project/WALLET-REFERENCE-GAP-PLAN.md).

## Decision

- The `build` module of the `java-spring-clean-multimodule` profile emits two
  additional artifacts at the generated project root: `.gitignore` and
  `README.md`. Both are unconditional; neither is behind a profile option.
- `.gitignore` is a static template. It covers Java build output, Maven output
  and wrapper artifacts, test and coverage output, IDE metadata for IntelliJ,
  VS Code and Eclipse, and operating-system files. It takes no template model,
  because none of its content varies with the application model.
- `README.md` is rendered from a `JavaProjectReadmeTemplateModel` carrying the
  application name, Maven coordinates, Java and Spring Boot versions, the
  reactor module list, and one entry per entity with its REST collection path.
  The collection path is derived through the existing
  `toRestCollectionPath` naming rule, the same function the REST producer uses
  to render `@RequestMapping`, so the documented paths cannot drift from the
  generated controllers.
- The `README.md` closes by telling the reader that the project is generated
  and that changing the model and regenerating is preferable to editing
  generated files by hand.
- In the golden tree, the generated `.gitignore` is stored as `gitignore`,
  without its leading dot, and both golden harnesses map the target path to
  that name. A literal `.gitignore` committed inside `tests/golden/` would be
  an active ignore file over the golden tree itself, silently hiding any
  future golden whose path matched one of its rules.

## Alternatives rejected

- **Making either file an opt-in profile option**: rejected because neither
  has a plausible "off" case. A repository without a `.gitignore` is not a
  configuration choice, and a project whose structure is documented nowhere is
  not either. Adding an option would add a switch nobody would set to false.
- **Deriving `README.md` content from the reference project's README**:
  rejected because the reference documents a Wallet-plus-Transaction domain
  that the generator cannot produce. The generated README documents only what
  the generator actually emits.
- **Hardcoding the REST paths in the README template**: rejected because it
  would create a second source of truth for a value the naming rule already
  owns. Reusing `toRestCollectionPath` means a change to the routing
  convention updates the controller and the documentation together.
- **Storing the golden as a literal `.gitignore`**: rejected for the
  ignore-file hazard described above. The mapping is one line in each harness
  and is commented at its definition.
- **Emitting `.gitattributes`, `.editorconfig` or a `CONTRIBUTING.md`**:
  rejected as scope expansion beyond the approved milestone.

## Scope boundary

This decision does not add a Maven wrapper, a `Dockerfile`, a `.dockerignore`,
developer run scripts, an HTTP request collection, or architecture diagrams.
Docker and developer scripts are separately scheduled; C4 diagram sources were
explicitly not adopted. The single-module `java-spring-clean` profile and the
`nestjs-clean-architecture` profile are unchanged.

## Consequences

- A generated project can be committed to a fresh repository without a manual
  first-commit cleanup.
- The full-profile dry-run count rises from 148 to 150 CREATE operations, and
  the `build`-module count from 6 to 8.
- The README grows one section per entity in the application model, so a
  multi-entity model produces a proportionally longer HTTP API section.

## Validation

- `npm run typecheck`, `npm run build`, `npm test`.
- `npm run smoke:java-multimodule` (golden byte comparison).
- Dry-run counts measured against `examples/wallet-service`: full profile 150,
  `build` 8, `core` 65, `entrypoints-rest` 87, `infra-database` 83,
  `configuration` 150, `build`+`core` 73, `build`+`configuration` 150.
