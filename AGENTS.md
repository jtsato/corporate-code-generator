# Corporate Code Generator — Agent Instructions

## 1. Purpose

Corporate Code Generator is a deterministic, model-driven application scaffolding platform.

It transforms:

Application Model
+
Corporate Profile / Golden Path
+
Versioned Templates and Rules

into a complete application scaffold.

Generated artifacts may include:

- source code;
- tests;
- build configuration;
- containers;
- quality configuration;
- CI/CD;
- deployment;
- Infrastructure as Code;
- observability;
- documentation.

AI is not part of the generation runtime.

---

## 2. Fundamental Architectural Principle

The fundamental generation flow is:

Model / IR
    ↓
Rules / Transformers
    ↓
Technology Adapters
    ↓
Template Models
    ↓
Templates
    ↓
File Plan
    ↓
Generated Artifacts

The responsibilities are:

### Model / IR

Describes semantic intent.

### Rules

Make explicit and testable generation decisions.

### Transformers

Convert semantic models into render-ready models.

### Technology Adapters

Represent technology-specific concepts.

### Template Models

Contain everything required to render an artifact.

### Templates

Represent artifacts.

### File Plan

Describes filesystem mutations before they occur.

---

## 3. Architectural Invariants

### INV-001 — Technology-Agnostic Core

The Core MUST NOT depend on technology-specific frameworks or concepts.

The Core MUST NOT contain direct knowledge of:

- Spring;
- JPA;
- Hibernate;
- .NET;
- EF Core;
- ASP.NET Core;
- NestJS;
- Helm;
- Terraform;
- GitHub Actions.

Technology-specific behavior belongs outside the Core.

### INV-002 — Technology-Agnostic Model

The Application Model and IR MUST represent semantic concepts rather than platform-specific concepts.

Allowed:

uuid
decimal
datetime

Not allowed:

UUID
Guid
BigDecimal
DateTimeOffset

### INV-003 — Templates Do Not Make Generation Decisions

Templates MUST primarily answer:

"How should this artifact be represented?"

Templates MUST NOT primarily answer:

"What should be generated?"

Avoid technology or semantic decision logic inside templates.

### INV-004 — Templates Do Not Resolve Types

Templates MUST NOT convert semantic types into technology types.

Invalid:

uuid → UUID

inside a template.

This belongs to a Technology Adapter.

### INV-005 — Templates Do Not Resolve Relationships

Templates MUST NOT interpret semantic relationships such as:

one-to-many
many-to-one

Rules and Transformers must resolve those concepts before rendering.

### INV-006 — Prefer Prepared Template Models

Templates SHOULD receive render-ready Template Models rather than unrestricted access to the entire IR.

### INV-007 — No Direct Filesystem Mutation During Rendering

Templates and Template Engines MUST NOT write directly to the filesystem.

Rendering produces content.

Filesystem operations are represented by the File Plan.

### INV-008 — File Plan Before Mutation

The complete File Plan MUST be created and validated before filesystem mutation begins.

### INV-009 — Deterministic Generation

Given identical:

- Application Model;
- Generator Version;
- Model Schema Version;
- Profile Version;
- Template Pack Version;
- explicit configuration;

the generator MUST produce identical output.

Generation MUST NOT implicitly depend on:

- LLMs;
- current time;
- randomness;
- external mutable state;
- undeclared environment state.

### INV-010 — Resolved IR

Semantic references in the IR SHOULD be resolved references rather than unresolved strings whenever practical.

Example:

Order.customer → Customer Entity

instead of:

Order.customer → "Customer"

### INV-011 — Module Is a Capability

A Module represents a generation capability.

Examples:

- domain;
- application;
- persistence-jpa;
- api-rest;
- unit-tests;
- docker;
- github-actions;
- helm.

A Module is NOT an alias for a Template.

### INV-012 — Profile Is Composition

A Profile represents a coherent Golden Path.

It may compose:

- technology;
- framework;
- architecture;
- modules;
- conventions;
- Template Packs;
- configuration.

Profiles SHOULD NOT become monolithic implementations of generation behavior.

---

## 4. Responsibility Map

When implementing a change, use the following ownership rules.

### New semantic concept

Change:

1. Model Schema;
2. IR;
3. semantic validation, when applicable;
4. tests.

### New primitive type

Change:

1. Model Schema;
2. PrimitiveType in the IR;
3. relevant Technology Adapters;
4. tests;
5. Golden Tests when generated output changes.

### Technology-specific type mapping

Change:

Technology Adapter.

Example:

uuid → java.util.UUID

belongs to the Java Technology Adapter.

### Generation decision

Change:

Rule.

Example:

A JPA one-to-many relationship requires a List import.

### IR to renderable representation

Change:

Transformer.

### Source representation

Change:

Template.

### New generation capability

Change:

Module.

### New Golden Path composition

Change:

Profile.

### Generated filesystem behavior

Change:

File Plan / File Writer.

---

## 5. Dependency Direction

Desired dependency direction:

CLI
 ↓
Core

Adapters
 ↓
Core contracts

Template Engine Adapter
 ↓
Core contracts

The Core MUST NOT depend on:

- CLI frameworks;
- Nunjucks;
- Java;
- Spring;
- concrete filesystem implementations where an abstraction is appropriate.

---

## 6. Java Golden Path

The first implementation target is:

java-spring-clean

The reference application is a Wallet Service implemented with:

- Java;
- Spring Boot;
- Maven multi-module;
- Clean Architecture principles.

The reference application is used to extract the Golden Path.

Do NOT blindly convert reference source files into templates.

For every artifact, determine first:

1. what comes from the Application Model;
2. what comes from the Profile;
3. what is a Module concern;
4. what is a Java concern;
5. what is a Spring concern;
6. what is a generation Rule;
7. what belongs only to representation.

Only then create a Template.

---

## 7. Initial Vertical Slice

The first implementation milestone is intentionally small.

Input:

examples/wallet-service/model.yaml

Initial semantic model:

Wallet
- id: uuid
- balance: decimal

Expected pipeline:

model.yaml
    ↓
Schema Validator
    ↓
Parser
    ↓
    IR
    ↓
java-spring-clean Profile
    ↓
Java Technology Adapter
    ↓
Java Entity Transformer
    ↓
Java Class Template Model
    ↓
Nunjucks Template
    ↓
File Plan
    ↓
File Writer
    ↓
Wallet.java

Do NOT add Spring, JPA, REST, Docker, Helm or Terraform to this vertical slice unless explicitly requested.

---

## 8. Testing Requirements

Generation behavior MUST be testable.

Prefer:

- unit tests for Rules;
- unit tests for Transformers;
- unit tests for Technology Adapters;
- unit tests for validation;
- Golden Tests for generated artifacts;
- integration tests for complete generation flows.

Changes to generated artifacts MUST include or update the corresponding Golden Test.

---

## 9. Generated Project Validation

As Profiles mature, generated applications should be validated using their native toolchain.

Java examples:

./mvnw test
./mvnw verify

Infrastructure examples:

docker build
helm lint
terraform validate

A successful generation does not merely mean that files were written.

The generated application should ultimately be buildable and testable.

---

## 10. Error Handling

Errors exposed to users MUST use stable error codes.

Initial categories:

MODELxxx
PROFILExxx
MODULExxx
ADAPTERxxx
TEMPLATExxx
GENxxx
FILEPLANxxx
IOxxx

Errors SHOULD provide enough context to identify the model location or generation operation that failed.

---

## 11. Coding Guidelines

Use TypeScript strict mode.

Prefer:

- explicit contracts;
- immutable data where practical;
- small components;
- dependency injection through constructors or explicit parameters;
- pure functions for deterministic transformations;
- domain-specific types over unstructured objects.

Avoid:

- global mutable state;
- hidden dependencies;
- generic "utils" containing domain behavior;
- large orchestration classes containing transformation logic;
- premature plugin abstractions;
- premature framework abstractions.

---

## 12. Scope Discipline

Implement the smallest complete vertical behavior first.

Do not introduce abstractions solely because they might be useful in the future.

Prefer:

Concrete requirement
    ↓
Simple implementation
    ↓
Tests
    ↓
Second concrete requirement
    ↓
Refactor when a real abstraction becomes visible

over speculative generalization.

---

## 13. Documentation

Important architectural decisions MUST be documented as ADRs.

When behavior changes, update the relevant:

- Solution Specification;
- ADR;
- Model Specification;
- Profile documentation;
- Template Pack documentation;
- tests.

The documentation and implementation must not intentionally diverge.

---

## 14. AI Usage

AI may assist with:

- implementation;
- tests;
- templates;
- Rules;
- Transformers;
- documentation;
- refactoring;
- code review.

AI MUST NOT become a required dependency of the generation runtime.

The following architecture is prohibited:

Application Model
    ↓
   LLM
    ↓
Generated Application

The deterministic generation pipeline must remain fully functional without access to any AI service.

## Package manager

Use npm. Evidence: `package.json` defines workspaces and the repository contains `package-lock.json`. Do not switch package managers or install dependencies without explicit authorization.

## Development commands

- There is no dedicated application development server script.
- Use `npm run test:watch` for an interactive test-development loop.
- After `npm run build`, execute the CLI with `node packages/cli/dist/index.js <command>`.

## Build commands

- `npm run build`: TypeScript project build.
- `npm run typecheck`: TypeScript validation.
- `npm run clean`: clean TypeScript build outputs.

## Test commands

- `npm test`: Vitest suite excluding the Maven-dependent smoke tests listed in `package.json`.
- `npm run test:coverage`: Vitest with V8 coverage.
- `vitest run tests/integration`: integration tests, when a focused integration run is needed.
- `npm run smoke`: build plus CLI smoke test.
- `npm run smoke:*`: focused smoke tests; some Java/Maven scenarios require an appropriate JDK/Maven installation and may be skipped by their own policy.

## Lint and formatting

No ESLint, Prettier, or other lint/format scripts or configuration were found in `package.json` or the repository analysis. Do not invent commands or claim these gates passed; preserve the existing formatting and TypeScript conventions.

## Architecture conventions

Keep the dependency direction `CLI -> Core`, with adapters and template/file-writer implementations depending on core contracts. Keep semantic model and core technology-agnostic. Put technology mapping in adapters, generation decisions in rules/transformers, representation in templates, and filesystem mutation behind the File Plan/File Writer. Templates must not make generation decisions, resolve semantic types or interpret relationships.

## Coding conventions

Use strict TypeScript, explicit contracts, small cohesive components, pure deterministic transformations and immutable data where practical. Prefer existing abstractions and local patterns. Add or update focused tests for behavior changes. Do not introduce speculative framework or plugin abstractions.

## Multi-agent workflow

For non-trivial development tasks, the principal agent must:

1. Analyze the task.
2. Produce a plan.
3. Define objective acceptance criteria.
4. Delegate implementation to `developer_a`.
5. Delegate navigation/review to `developer_b`.
6. Avoid simultaneous edits to the same file.
7. Wait for delegated agents to finish.
8. Consolidate the changes.
9. Delegate validation to `qa_engineer`.
10. Correct rejected issues and repeat validation.
11. Present the consolidated report.

The principal agent must explicitly use the agents named `tech_lead`, `developer_a`, `developer_b` and `qa_engineer`. Every delegation states objective, context, allowed/prohibited files, acceptance criteria, validation commands and expected result.

## Pair-programming workflow

`developer_a` starts as driver and `developer_b` starts as navigator. Roles may be inverted between subtasks. The driver implements; the navigator reviews reasoning, risks, regressions and edge cases. Only one agent may edit a given file at a time. The navigator must not silently overwrite the driver's code. Divergences go to `tech_lead`. Pair programming does not replace independent QA validation.

## Quality gates

The relevant available gates are typecheck, build, Vitest tests, coverage when requested, integration tests and applicable smoke tests. Lint, formatting and E2E are unavailable unless the repository gains explicit tooling. A generated project should additionally be validated with its native toolchain when the selected smoke test requires it.

## Safety and repository boundaries

- Modify only files authorized by the task; this repository's agent configuration is limited to `.codex/` and `AGENTS.md` unless the user explicitly expands scope.
- Do not make unrelated refactors, install dependencies, remove tests, weaken assertions or hide failures.
- Do not use `--force`, `--no-verify` or equivalents.
- Do not commit, push, merge, rebase or create pull requests without explicit request.
- Do not access, reveal or modify secrets or print sensitive environment variables.
- Do not modify files outside the repository, global machine configuration, or execute destructive commands/delete data.
- Do not use network access without explicit need.
- Preserve existing user changes and prefer small, incremental, reversible edits.
- Do not claim success without executed validations and evidence.

## Definition of done

A development task is complete only when requirements and acceptance criteria are verified, conventions are followed, relevant tests pass, available typecheck/build gates pass, the full diff is reviewed, no out-of-scope changes exist, `qa_engineer` returns `APPROVED`, residual risks are documented and the consolidated report is presented.

## Multi-agent configuration validation

The native team consists of exactly these four files:

```text
.codex/
├── config.toml
└── agents/
    ├── tech-lead.toml
    ├── developer-a.toml
    ├── developer-b.toml
    └── qa-engineer.toml
```

After configuration changes, validate TOML syntax, required fields, unique agent names, descriptions, enabled agents and concurrency capacity. Review the complete diff, list created/modified files, confirm no application files changed, and do not start a development task as part of configuration setup.

---

# Codex Multi-Agent Operating Guide

## Project overview

Corporate Code Generator is a deterministic, model-driven scaffolding platform. It transforms an application model, a corporate Golden Path profile, versioned rules, and templates into generated application artifacts. AI is not a runtime dependency of generation.

## Technology stack

- Node.js `>=22`.
- TypeScript with strict compiler settings and project references.
- npm workspaces.
- Vitest for unit, integration, smoke, and runtime-oriented tests.
- Nunjucks for template rendering.
- AJV for schema validation.
- The primary generated Golden Path is Java, Spring Boot, Maven multi-module, and Clean Architecture.

## Repository structure

- `packages/core`: technology-agnostic model, validation, planning, profiles, modules, and generation contracts.
- `packages/adapter-java`: Java technology adapter, transformers, template models, and Java Golden Path artifact producers.
- `packages/template-engine-nunjucks`: Nunjucks template engine adapter.
- `packages/file-writer-node`: Node.js filesystem writer.
- `packages/cli`: command-line interface.
- `profiles`: Golden Path profiles.
- `template-packs`: versioned artifact templates.
- `examples`: input application models.
- `tests/integration`: complete generation-flow tests.
- `tests/smoke`: generated-application and CLI smoke tests.
- `tests/golden`: expected generated artifacts.

## Package manager

Use npm. The root `package.json` declares `packages/*` as workspaces and `package-lock.json` is present. Do not introduce pnpm, Yarn, or Bun configuration.

## Development commands

- `npm test`: run the default Vitest suite while excluding the long-running smoke suites listed in the script.
- `npm run test:watch`: run Vitest in watch mode.
- `npm test -- tests/integration/<file>.test.ts`: run a focused integration test using the existing test script.
- `npm run smoke`: build and run the CLI smoke test.
- `npm run smoke:java-multimodule`: build and run the Java multi-module smoke suite.
- Use the specific `smoke:*` scripts in `package.json` for Maven, paging, filtering, persistence, HTTP, OpenAPI, Spring context, CORS, error handling, and related checks.

## Build commands

- `npm run build`: build all TypeScript project references.
- `npm run typecheck`: validate all TypeScript project references.
- `npm run clean`: clean TypeScript build outputs.

## Test commands

Vitest is the test framework. Use `npm test` for the default suite, focused file arguments for targeted work, and the declared `smoke:*` scripts for generated Java application checks. Use `npm run test:coverage` when coverage evidence is required. There is no separate end-to-end script; smoke tests are the closest declared repository-level validation and must not be mislabeled as a missing E2E tool.

## Lint and formatting

No lint or formatting script is declared in the root or workspace package manifests inspected during configuration. Do not invent or install a lint/formatter tool. Use `git diff --check`, TypeScript validation, tests, and the established source formatting as available checks.

## Architecture conventions

Maintain the dependency direction `CLI -> Core`, with technology adapters and template-engine adapters depending on Core contracts. Keep the Core technology-agnostic. Keep semantic types in the model/IR, make generation decisions in Rules, resolve technology types in adapters, prepare render-ready template models, keep templates representational, and create/validate the complete File Plan before filesystem mutation. Generation must be deterministic and independent of LLMs, current time, randomness, undeclared environment state, and mutable external state.

## Coding conventions

Use strict TypeScript, explicit contracts, immutable data where practical, small components, constructor or explicit-parameter dependency injection, pure deterministic transformations, and domain-specific types. Avoid hidden global state, generic behavior-heavy utility modules, speculative abstractions, monolithic orchestration classes, and unrelated refactors. Changes to generated artifacts require corresponding regression or Golden Test coverage.

## Multi-agent workflow

For non-trivial development tasks, the primary agent must explicitly use `tech_lead`, `developer_a`, `developer_b`, and `qa_engineer` by name:

1. Analyze the task and repository.
2. Produce a plan and objective acceptance criteria.
3. Delegate implementation to `developer_a`.
4. Delegate navigation/review to `developer_b`.
5. Avoid simultaneous edits to the same file and wait for delegated work.
6. Consolidate and review the complete diff.
7. Delegate independent validation to `qa_engineer`.
8. Address rejected findings, rerun validation, and present a consolidated report.

The `tech_lead` coordinates the process, assigns temporary file ownership, chooses driver/navigator roles, and declares completion only after QA approval and evidence-backed validation.

## Pair-programming workflow

`developer_a` starts as driver and `developer_b` starts as navigator. The roles may be inverted between subtasks. The driver implements within the delegated scope. The navigator reviews reasoning, risks, edge cases, and tests without silently overwriting the driver's code. Only one agent may edit a given file at a time. Divergences go to `tech_lead`. Pair programming does not replace independent QA.

## Quality gates

A task is ready only when requirements and acceptance criteria are verified, the diff is reviewed, relevant tests pass, TypeScript validation passes, build passes when applicable, available lint/format checks pass when declared, generated output is validated with the native toolchain when applicable, no out-of-scope files changed, and `qa_engineer` reports `APPROVED`. Unavailable checks must be documented rather than assumed.

## Safety and repository boundaries

All agents must modify only authorized files, avoid scope expansion and unrelated refactors, avoid dependency installation without authorization, preserve and strengthen tests, and never hide failures. Do not use `--force`, `--no-verify`, or equivalent bypasses. Do not commit, push, merge, rebase, or create pull requests without explicit authorization. Do not access, reveal, or modify secrets; print no sensitive environment variables. Do not modify files outside the repository, change global machine configuration, execute destructive commands, delete data, or use network access without explicit need. Prefer small, incremental, reversible changes and reuse existing code and patterns.

## Multi-agent concurrency rules

Read-only analysis and independent tests may run in parallel. Two agents may not edit the same file simultaneously. Dependent writes are sequential. `tech_lead` owns temporary file assignment and must wait for delegated results before consolidation. If a conflict risk exists, use sequential execution.

## Definition of done

A task is complete only after requirements are met, acceptance criteria are evidenced, conventions are followed, relevant tests pass, lint/format checks pass when available, build and typecheck pass when relevant, the full diff is reviewed, no out-of-scope changes exist, QA returns `APPROVED`, residual risks and limitations are documented, and the final report is presented.
