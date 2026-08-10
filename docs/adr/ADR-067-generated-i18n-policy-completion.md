# ADR-067 — Generated i18n Policy Completion

## Status

Accepted — Milestone 6.46.

## Context

The generated `java-spring-clean-multimodule` project already ships an English
message bundle and a `messages_pt_BR.properties` bundle. `GlobalExceptionHandler`
uses Spring's `MessageSource`, but locale selection and message fallback were
left to framework and JVM defaults. That made the effective default locale,
supported locales, and fallback behavior implicit and potentially dependent on
the host environment.

The Wallet Reference Gap Plan identifies this as Milestone 6.46: complete the
i18n policy and generate a locale-negotiation test. The policy belongs in the
configuration module because it is an HTTP/runtime concern, not a semantic
application-model concern.

## Decision

The generated configuration module emits `LocaleConfiguration` with these
runtime rules:

- The default locale is English (`Locale.ENGLISH`, language tag `en`).
- The supported-locale allowlist is exactly English and Brazilian Portuguese
  (`Locale.forLanguageTag("pt-BR")`). Other locales are not selected by
  `Accept-Language` negotiation.
- Locale negotiation uses `AcceptHeaderLocaleResolver`, so the HTTP
  `Accept-Language` header is the only locale selector. A missing or unsupported
  header resolves to English.
- Message bundles are loaded from `classpath:messages` as UTF-8.
- `ReloadableResourceBundleMessageSource#setFallbackToSystemLocale(false)` is
  explicit. A host JVM locale cannot change generated responses; a missing
  regional translation falls back to the base English bundle.

The adapter passes ready-to-render locale expressions and fallback settings in
dedicated template models. Templates render those decisions but do not derive
locale values or inspect the application model.

The generated `LocaleNegotiationTests` loads the complete Spring context and
exercises the resolver with `Accept-Language: pt-BR`, an unsupported `fr-FR`
header, and no header. It asserts both the resolved locale and the translated
English/Portuguese message, covering supported negotiation and deterministic
default fallback.

## Alternatives rejected

- **Relying on Spring Boot's implicit locale/message defaults:** rejected
  because the effective default and system-locale fallback would remain
  undeclared and could change with framework or host settings.
- **Allowing every locale present in the JVM:** rejected because the generated
  profile only owns English and Brazilian Portuguese bundles; silently
  accepting other locales would imply translations the generator does not
  provide.
- **Using a query parameter or cookie locale resolver:** rejected because the
  REST contract already uses standard `Accept-Language` negotiation and no
  stateful locale preference is modeled.
- **Adding an application-model locale field:** rejected as scope expansion;
  this milestone completes the existing Java Spring golden path policy and
  does not introduce product-level localization metadata.

## Scope boundary

This decision applies only to the generated `java-spring-clean-multimodule`
configuration module. It does not change the single-module Java profile, the
NestJS profile, the message-key model, or milestones 6.47 and 6.48.

## Consequences

- Generated HTTP error responses are stable across host JVM locales.
- Adding another supported locale requires a deliberate adapter/template-model
  change and a corresponding generated message bundle and test expectation.
- The generated project has one explicit configuration boundary for locale
  resolution and message-source fallback, while existing exception handlers
  continue to depend only on Spring's `MessageSource` abstraction.

## Validation

- `npm run typecheck`, `npm run build`, and `npm test` pass; the default suite
  reports 48 files and 212 tests.
- The focused producer/integration/smoke run passes 4 files and 27 tests.
- `npm run smoke:java-multimodule` passes its golden byte comparison, including
  both generated locale files.
- `mvn -B test '-Dspring.profiles.active=test'` against a freshly generated
  wallet project reports Reactor `BUILD SUCCESS`; the configuration module runs
  119 tests with 0 failures, 0 errors, and 0 skipped, including both locale
  negotiation tests.
