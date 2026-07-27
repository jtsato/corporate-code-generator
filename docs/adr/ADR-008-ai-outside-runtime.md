# ADR-008 — Artificial Intelligence Outside the Generation Runtime

## Status

Accepted

## Context

Artificial Intelligence can significantly improve developer productivity when creating:

* Rules;
* Transformers;
* Templates;
* tests;
* documentation;
* refactorings;
* new Golden Paths.

However, using an LLM directly during application generation introduces characteristics that conflict with core requirements:

* non-deterministic output;
* external service dependency;
* model-version dependency;
* network dependency;
* variable latency;
* additional cost;
* difficult reproducibility;
* more difficult testing.

## Decision

Artificial Intelligence will not be a required component of the generation runtime.

The following architecture is explicitly rejected:

```text
Application Model
       ↓
      LLM
       ↓
Generated Application
````

The generation pipeline will remain deterministic:

```text
Application Model
       ↓
Parser / IR
       ↓
Rules / Transformers
       ↓
Template Models
       ↓
Templates
       ↓
File Plan
       ↓
Generated Application
```

## Permitted AI Usage

AI may assist developers during development and maintenance.

Examples:

```text
Developer
    │
    ├── AI
    │    ├── creates or reviews Rules
    │    ├── creates Transformers
    │    ├── assists with Templates
    │    ├── generates tests
    │    ├── reviews architecture
    │    └── updates documentation
    │
    ▼
Pull Request
    │
    ▼
Automated Validation
    │
    ▼
Versioned Generator
```

Once accepted into the repository, the resulting deterministic implementation becomes part of the generator.

## Future AI Features

Future optional AI-assisted functionality may be considered provided that it remains outside the deterministic generation contract.

Examples might include:

* assisting users in creating an Application Model;
* suggesting Profile configuration;
* explaining validation errors;
* assisting Template authors;
* migration assistance.

Any such functionality must remain separable from deterministic generation.

## Consequences

### Positive

* deterministic generation;
* offline execution remains possible;
* no mandatory AI provider;
* easier testing;
* reproducible builds;
* predictable CI/CD behavior.

### Negative

* the generator cannot rely on LLM flexibility to resolve ambiguous models;
* semantic decisions must be explicitly modeled and implemented.

## Architectural Rule

The deterministic generator must remain fully functional without credentials, network access or access to any AI model.
