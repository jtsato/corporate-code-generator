# Contributing

This repository is a deterministic code generator. Contributions should preserve the separation between semantic intent, generation decisions, technology mapping, representation, and filesystem mutation.

## Workflow

1. Inspect the requested scope and current repository state before editing.
2. Read the relevant docs: [AGENTS.md](AGENTS.md), [Current State](docs/project/CURRENT-STATE.md), [Quality Gates](docs/project/QUALITY-GATES.md), the applicable ADRs, and the target architecture docs when generated Java output is involved.
3. Keep the Core technology-agnostic. Put semantic model changes in the model/IR, generation decisions in rules or transformers, technology mapping in adapters, and representation in templates.
4. Make the smallest complete change. Avoid unrelated refactors and speculative abstractions.
5. Update tests, golden tests, ADRs, profile/template documentation, and current-state or quality-gate docs when the behavior change requires it.
6. Run the relevant quality gates for the change type. Do not claim a command passed unless it was run.
7. Review the full diff, including generated artifacts and documentation links when applicable.
8. Do not commit, push, merge, rebase, or open pull requests unless the repository owner explicitly asks for it.

## Documentation-only changes

For documentation-only changes, keep canonical ownership clear:

- project overview in [README.md](README.md);
- roadmap status in [ROADMAP.md](ROADMAP.md);
- measured current facts in [docs/project/CURRENT-STATE.md](docs/project/CURRENT-STATE.md);
- validation policy in [docs/project/QUALITY-GATES.md](docs/project/QUALITY-GATES.md);
- generated Java application architecture in [docs/target-architecture/REFERENCE-ARCHITECTURE.md](docs/target-architecture/REFERENCE-ARCHITECTURE.md);
- decisions in [docs/adr](docs/adr).

Do not change production capabilities, TypeScript behavior, templates, producers, profiles, manifests, generated Java, tests, or CI while performing documentation-only cleanup unless explicitly authorized.
