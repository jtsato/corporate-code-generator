# ADR-088 — NestJS Locale Negotiation Policy

## Status

Accepted — Milestone 7.23.

## Context

Milestone 7.19 ([ADR-084](ADR-084-nestjs-package-i18n-and-in-memory-uniqueness.md))
gave the generated NestJS project `nestjs-i18n`, English and Portuguese JSON
catalogs, and `AcceptLanguageResolver`. What it did not give it was a *stated
policy*. The effective behavior for an unsupported tag, for quality weights, and
for a malformed header was whatever the library happened to do, spread across
`fallbackLanguage`, a `fallbacks` regional map, and the resolver's own rules.

The Java Golden Path closed the same gap at milestone 6.46
([ADR-067](ADR-067-generated-i18n-policy-completion.md)) by making the default
locale, the supported-locale allowlist, and the fallback explicit, and by
generating a negotiation test. Gap G7 in the
[NestJS Parity Gap Plan](../project/NESTJS-PARITY-GAP-PLAN.md) is the NestJS
counterpart, and decision N9 approved mirroring 6.46's three test cases.

## Decision

### The policy is a pure function

`src/web-api/i18n/language-negotiation.ts` owns the decision:

- `SUPPORTED_LANGUAGES` is `['en', 'pt']` — exactly the catalogs the project
  ships. `FALLBACK_LANGUAGE` is `en`.
- Quality weights are honoured **over header order**, so
  `de;q=1.0, pt;q=0.1` selects Portuguese. Equal weights preserve the client's
  order, which is the tie-break the specification implies and the library does
  not guarantee.
- `q=0` means "not acceptable" and excludes a tag outright.
- A malformed quality (`q=high`, `q=7`) **disqualifies that tag** rather than
  defaulting it to 1. The client asked for something specific and the server
  cannot tell what; guessing would be a worse answer than moving on.
- Regional tags collapse to their base language, so `pt-BR` and `pt-PT` both
  select `pt`, and matching is case-insensitive.
- `*` matches the fallback.
- An unsupported language is never an error. It is served in `en`.

Every path returns a member of `SUPPORTED_LANGUAGES`; a generated unit test
asserts exactly that over a range of hostile headers.

### The resolver is thin

`SupportedLanguageResolver` implements `nestjs-i18n`'s `I18nResolver` by reading
the header and delegating to the pure function. It replaces
`AcceptLanguageResolver`, which forwards the raw header and leaves the outcome
for an unsupported tag to library fallback rules.

The `fallbacks` regional map is **removed**. With the resolver guaranteeing a
supported language, that map was a second place where regional collapsing was
decided. `fallbackLanguage` stays as a second line of defence rather than as the
thing that decides.

### Why a custom resolver rather than configuration

The library's resolver cannot express "prefer the highest-weighted tag that I
have a catalog for". It hands back the client's top preference, and the mismatch
is then absorbed silently by fallback. That is the same failure shape ADR-087
recorded twice: configuration that looks right and behaves differently. Deciding
in code makes the policy unit-testable without a running application — 18
assertions covering weights, ties, `q=0`, malformed weights, wildcards, casing,
and empty entries, none of which need a server.

## Consequences

- The full-profile example rises from 99 to 102 CREATE operations: `web-api`
  from 72 to 75, `bootstrap` from 87 to 90. `build`, `core` and
  `infra-persistence` are unchanged at 12, 49 and 58.
- No new dependency. The negotiation is about 60 lines of plain TypeScript.
- Adding a language now means three coordinated edits: a catalog directory, an
  entry in `SUPPORTED_LANGUAGES`, and a test expectation. That is deliberate —
  the previous arrangement would have silently accepted a language tag for a
  catalog that did not exist.
- The generated end-to-end suite gained the three cases decision N9 named:
  supported, unsupported, and missing header.
- The repository-side generated-project smoke gained a fourth, sharper case:
  `de;q=1.0, pt;q=0.1` over HTTP. It is the one assertion that distinguishes this
  policy from the previous behavior, because a resolver forwarding the top tag
  would answer in English. Without it the end-to-end cases would pass against
  either implementation and prove nothing about the change.

## Alternatives considered

- **Keeping `AcceptLanguageResolver` and adding only a `fallbacks` map.**
  Rejected: it makes regional collapsing explicit but leaves weight handling and
  unsupported-tag behavior to the library, which is most of the policy.
- **An `accept-language` parsing dependency.** Rejected: the parsing is a split
  on two delimiters and a sort. A dependency would be larger than the code it
  replaces and would still need the allowlist logic wrapped around it.
- **Rejecting unsupported languages with HTTP 406.** Rejected: it is defensible
  by the specification but hostile in practice, and it diverges from the Java
  Golden Path, which falls back to English. Parity is measured on behavior.
- **Renaming the `pt` catalog to `pt-BR` to match the Java allowlist literally.**
  Rejected: ADR-084 chose `pt` to match the reference project's layout, and the
  user-visible behavior is identical because `pt-BR` resolves to it. Renaming
  would churn goldens for no behavioral gain.

## Validation

Typecheck and build exit 0. `npm test` 56 files / 308 tests. NestJS golden smoke
3/3; boundary smoke 7/7; `CODEGEN_REQUIRE_NPM_SMOKE=true npm run
smoke:generated-project:nestjs` 8/8, including the generated project's own
negotiation unit tests, its three end-to-end cases, and the weight-over-order
assertion over HTTP. Two consecutive generations were byte-identical, and the
identifier-only example emits the same 102 CREATE operations. Goldens were
derived by copying built-CLI output.
