# ADR-079: NestJS Basic i18n Error Messages

* Status: Accepted
* Date: 2026-08-11
* Milestone: 7.14

## Context

The generated HTTP filters had stable English messages but no locale negotiation. Adding a third-party i18n package would add dependency and configuration surface for the initial capability.

## Decision

Generate a deterministic `I18nService` and static English/Portuguese message map. `Accept-Language` values beginning with `pt` select Portuguese; all other values select English. Validation and not-found filters use the service while preserving structured status and violation fields.

## Consequences

The initial generated contract supports `en` and `pt` without external runtime state. Message catalogs, pluralization, and broader locale negotiation remain future extensions.
