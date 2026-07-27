# ADR-002 — Nunjucks as Initial Template Engine

## Status

Accepted

## Context

Corporate Code Generator requires a template engine to render source code and other textual artifacts from prepared Template Models.

Generated artifacts may include:

* Java source code;
* C# source code;
* TypeScript source code;
* Maven and project configuration;
* Dockerfiles;
* YAML;
* CI/CD workflows;
* Helm manifests;
* Terraform;
* documentation.

The template engine must support enough expressiveness for artifact representation while remaining simple enough to discourage implementation of generation rules inside templates.

The generator implementation language is TypeScript running on Node.js.

## Decision

Nunjucks will be used as the initial Template Engine.

Nunjucks will be accessed through an internal abstraction rather than directly from the Core.

Conceptually:

```text
Core
  │
  ▼
TemplateEngine
  ▲
  │
NunjucksTemplateEngine
````

The Core will depend only on the `TemplateEngine` contract.

Example:

```typescript
interface TemplateEngine {
    render(
        template: Template,
        model: unknown
    ): Promise<string>;
}
```

The Nunjucks implementation will reside outside the Core.

Initial package:

```text
packages/
└── template-engine-nunjucks/
```

## Template Responsibilities

Templates should primarily represent artifacts.

They may contain presentation-oriented constructs such as:

* loops;
* simple conditionals;
* macros;
* includes;
* whitespace control.

Templates should not perform semantic or technology-resolution decisions.

For example, this is acceptable:

```jinja2
{% for import in imports %}
import {{ import }};
{% endfor %}
```

This should be avoided:

```jinja2
{% if entity.hasOneToMany %}
import java.util.List;
{% endif %}
```

The decision that `java.util.List` is required belongs to Rules, Transformers or Technology Adapters before rendering.

## Consequences

### Positive

* natural integration with Node.js and TypeScript;
* mature template syntax;
* supports macros and template composition;
* familiar Jinja-like syntax;
* suitable for generating multiple textual artifact types;
* keeps the implementation simple for the initial version.

### Negative

* Nunjucks is dynamically typed;
* complex logic can easily leak into templates if architectural rules are not enforced;
* Template Models require explicit contracts outside the template engine.

## Alternatives Considered

### Mustache

Provides stronger constraints due to its logic-less philosophy.

However, it may require excessive preprocessing or duplication for some generated artifacts.

### Handlebars

Mature and widely adopted, but custom helpers can easily become another location for generation logic.

### EJS

Simple integration with JavaScript but provides less separation between presentation and arbitrary JavaScript logic.

### Custom Template Engine

Rejected due to unnecessary implementation and maintenance complexity.

## Architectural Rule

Nunjucks is an infrastructure detail.

Replacing Nunjucks MUST NOT require redesigning:

* Application Model;
* IR;
* Rules;
* Transformers;
* Technology Adapters;
* File Plan.
