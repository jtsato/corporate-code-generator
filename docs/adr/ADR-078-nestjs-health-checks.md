# ADR-078: NestJS Health Checks

* Status: Accepted
* Date: 2026-08-11
* Milestone: 7.13

## Context

Generated applications need stable process-level endpoints for orchestration and smoke tests.

## Decision

Generate `/health-check/live` and `/health-check/ready`. Both return `{ "status": "UP" }` through the normal response transformer and are excluded from the generated Swagger operation list. Readiness is intentionally process-level until external dependency checks are introduced.

## Consequences

The generated project has deterministic liveness and readiness probes without adding a health framework or database dependency.
