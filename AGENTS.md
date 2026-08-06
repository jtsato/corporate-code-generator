# Corporate Code Generator - Agent Instructions

## Required project documents

Read these documents when they are relevant to the task:

- [README.md](README.md) for project entry points and quick start.
- [CONTRIBUTING.md](CONTRIBUTING.md) for human contribution workflow.
- [ROADMAP.md](ROADMAP.md) for releases, phases, milestones, and status.
- [docs/project/CURRENT-STATE.md](docs/project/CURRENT-STATE.md) for measured current facts.
- [docs/project/QUALITY-GATES.md](docs/project/QUALITY-GATES.md) for validation commands and CI policy.
- [docs/SOLUTION-SPECIFICATION.md](docs/SOLUTION-SPECIFICATION.md) for the normative product and architecture contract.
- [docs/target-architecture/REFERENCE-ARCHITECTURE.md](docs/target-architecture/REFERENCE-ARCHITECTURE.md) for generated Java application architecture.
- [docs/target-architecture/CAPABILITY-TAXONOMY.md](docs/target-architecture/CAPABILITY-TAXONOMY.md) for capability vocabulary and support boundaries.
- [docs/adr/README.md](docs/adr/README.md) and individual ADRs for decisions and rationale.

## Purpose

Corporate Code Generator is a deterministic, model-driven application scaffolding platform. It transforms:

```text
Application Model
+ Corporate Profile / Golden Path
+ Versioned Templates and Rules
-> Generated application scaffold
```

Generated artifacts may include source code, tests, build configuration, containers, quality configuration, CI/CD, deployment, infrastructure, observability, and documentation according to the selected profile and capabilities.

AI may assist implementation and maintenance, but AI must not be required by the generation runtime.

## Generation architecture

The generation flow is:

```text
Model / IR
  -> Rules / Transformers
  -> Technology Adapters
  -> Template Models
  -> Templates
  -> File Plan
  -> Generated Artifacts
```

Responsibilities:

- Model / IR describes semantic intent.
- Rules make explicit and testable generation decisions.
- Transformers convert semantic models into render-ready models.
- Technology adapters represent technology-specific concepts.
- Template models contain everything required to render artifacts.
- Templates represent artifact shape.
- File Plan describes filesystem mutations before they occur.

## Architectural invariants

1. The Core must remain technology-agnostic. It must not depend on Spring, JPA, Hibernate, .NET, EF Core, ASP.NET Core, NestJS, Helm, Terraform, GitHub Actions, concrete CLI frameworks, Nunjucks, or concrete filesystem implementations where an abstraction is appropriate.
2. The Application Model and IR must use semantic concepts, not platform-specific concepts. Prefer `uuid`, `decimal`, and `datetime`; do not encode `UUID`, `Guid`, `BigDecimal`, or `DateTimeOffset` in the model.
3. Templates must not make generation decisions.
4. Templates must not resolve semantic types into technology types.
5. Templates must not interpret semantic relationships.
6. Templates should receive prepared template models rather than unrestricted IR access.
7. Rendering must not mutate the filesystem directly.
8. The complete File Plan must be created and validated before filesystem mutation.
9. Generation must be deterministic for identical declared inputs and versions. It must not implicitly depend on LLMs, current time, randomness, external mutable state, or undeclared environment state.
10. Semantic references in the IR should be resolved references whenever practical.
11. A Module is a generation capability, not an alias for a template.
12. A Profile is Golden Path composition, not a monolithic implementation of generation behavior.

## Responsibility map

When implementing changes, put behavior in its proper owner:

| Change type | Primary owners |
| --- | --- |
| New semantic concept | Model schema, IR, semantic validation, tests |
| New primitive type | Model schema, IR primitive type, relevant technology adapters, tests, golden tests when output changes |
| Technology-specific type mapping | Technology adapter |
| Generation decision | Rule |
| IR-to-renderable conversion | Transformer |
| Source representation | Template |
| New generation capability | Module |
| New Golden Path composition | Profile |
| Generated filesystem behavior | File Plan / File Writer |

## Dependency direction

Desired dependency direction:

```text
CLI -> Core
Adapters -> Core contracts
Template engine adapter -> Core contracts
File writer implementation -> Core contracts
```

Do not introduce dependencies from Core to technology-specific packages, concrete template engines, concrete filesystems, or CLI frameworks.

## Package manager and commands

Use npm. The repository uses npm workspaces and `package-lock.json`; do not switch package managers or install dependencies without explicit authorization.

Common commands:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:coverage`
- `npm run smoke`
- `npm run smoke:*`

After `npm run build`, execute the CLI with:

```bash
node packages/cli/dist/index.js <command>
```

The full validation policy is maintained in [docs/project/QUALITY-GATES.md](docs/project/QUALITY-GATES.md).

## Testing and generated output

- Generation behavior must be testable.
- Prefer unit tests for rules, transformers, technology adapters, and validation.
- Use golden tests when generated artifacts change.
- Use integration tests for complete generation flows.
- Generated projects should ultimately be validated with their native toolchain when applicable.
- Do not edit goldens as the primary source of truth; generate expected output from the actual CLI behavior when golden updates are in scope.

## Documentation

Important architectural decisions must be documented as ADRs. When behavior changes, update the relevant specification, ADR, model/profile/template-pack documentation, tests, and current-state or quality-gate documents as applicable. Documentation and implementation must not intentionally diverge.

Current versions, artifact counts, measured dry-run results, script inventory, smoke inventory, and CI state belong in [docs/project/CURRENT-STATE.md](docs/project/CURRENT-STATE.md), not in entry-point or architecture documents.

## Repository safety

- Modify only files authorized by the task.
- Preserve existing user changes and avoid unrelated refactors.
- Do not install dependencies without explicit authorization.
- Do not remove tests, weaken assertions, or hide failures.
- Do not use `--force`, `--no-verify`, or equivalent bypasses.
- Do not commit, push, merge, rebase, or create pull requests without explicit request.
- Do not access, reveal, or modify secrets.
- Do not modify files outside the repository or global machine configuration.
- Do not execute destructive commands or delete data unless explicitly requested and safely scoped.
- Do not use network access unless the task requires it.

## Required multi-agent workflow

For non-trivial development tasks, the primary coordinator must explicitly use these roles by name:

- `tech_lead`: architecture, design, scope, and final technical judgment.
- `developer_a`: implementation driver.
- `developer_b` or repository-defined navigator/quality role when available: reasoning review, risks, regressions, and edge cases.
- `qa_engineer` or repository-defined quality-assurance role when available: independent validation.

The required flow is:

1. Analyze the task and repository.
2. Produce a plan and objective acceptance criteria.
3. Delegate implementation to `developer_a`.
4. Delegate navigation/review to `developer_b` when configured for the active workflow.
5. Avoid simultaneous edits to the same file.
6. Consolidate and review the complete diff.
7. Delegate independent validation to `qa_engineer` or `quality_assurance`.
8. Address rejected findings and rerun validation.
9. Present an evidence-based consolidated report.

Project-local agent files, when configured, are under `.codex/agents/`. Custom agents must not spawn or delegate to other agents.

## AI policy

AI can assist with models, schemas, rules, transformers, adapters, templates, tests, documentation, review, and refactoring. The runtime architecture must never be:

```text
Application Model
  -> LLM
  -> Generated Application
```

The deterministic generation pipeline must remain fully functional without access to any AI service.
