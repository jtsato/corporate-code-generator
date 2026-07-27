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
