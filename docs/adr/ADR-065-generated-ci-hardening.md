# ADR-065 — Generated CI Hardening

## Status

Accepted — Milestone 6.44.

## Context

The generated `java-spring-clean-multimodule` project's
`.github/workflows/java-ci.yml` had three steps: checkout, `setup-java`, and
`mvn -B clean verify`. The two `uses:` steps referenced floating major tags
(`actions/checkout@v4`, `actions/setup-java@v4`), the checkout used the
default shallow clone, the workflow had no `workflow_dispatch` trigger, the
verify command ran with no explicit Spring profile even though the generated
project already ships `configuration/src/main/resources/application-test.yaml`,
and there was no optional static-analysis step.

The gap analysis against the hand-written `wallet-service-java` reference
recorded this as Group C: the reference workflow pins actions by commit SHA,
sets `fetch-depth: 0`, caches `~/.sonar/cache` and `~/.m2`, adds
`workflow_dispatch`, runs `verify` with an explicit active profile, and runs a
Sonar scan guarded by secret presence. See
[Wallet Reference Gap Plan](../project/WALLET-REFERENCE-GAP-PLAN.md).

Floating major tags on third-party actions are a supply-chain risk: the tag
can be moved to point at different code without the consuming workflow
changing at all. Commit-SHA pinning removes that risk at the cost of manual
version bumps, which is the same trade-off ADR-059 and ADR-060 already made
for Maven dependency and plugin versions in the generated build.

## Decision

- The generated `checkout` and `setup-java` steps are pinned by commit SHA,
  each followed by a `# vX.Y.Z` comment naming the pinned release:
  - `actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1`
  - `actions/setup-java@c1e323688fd81a25caa38c78aa6df2d33d3e20d9 # v4.8.0`

  Both SHAs are copied verbatim from the hand-written reference's
  `.github/workflows/continuous-integration.yml`, which already pins the same
  two actions at the same releases. The adapter declares them as named
  constants (`checkoutActionRef`, `setupJavaActionRef`), in the same style as
  the existing `archUnitVersion`/`jacocoVersion` constants in
  `JavaSpringCleanMultimoduleBuildArtifactProducer`, and passes the full
  `owner/repo@sha # tag` string through the template model. The template
  interpolates the constant; it contains no literal SHA or version tag.
- The `checkout` step gains `with: fetch-depth: 0`, matching the reference.
- The workflow's `on:` block gains a `workflow_dispatch:` trigger alongside
  the existing `push`/`pull_request` triggers.
- `cache: maven` stays on the pinned `setup-java` step. No separate
  `actions/cache` step is added; see "Alternatives rejected" below.
- The verify step becomes
  `mvn -B clean verify -Dspring.profiles.active=test`, activating the
  `test` Spring profile the generated project already emits
  (`configuration/src/main/resources/application-test.yaml`).
- The job gains `env: SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}` and two new
  steps, following the reference's shape:
  - `Run SonarCloud Scan`, guarded by `if: ${{ env.SONAR_TOKEN != '' }}`,
    running `org.sonarsource.scanner.maven:sonar-maven-plugin:sonar` with
    `-Dsonar.token="$SONAR_TOKEN"` and `-Dsonar.projectKey={{ sonarProjectKey }}`.
    `sonarProjectKey` is the generated application's `artifactId`, derived in
    the adapter and passed through the template model; the template performs
    no derivation.
  - `SonarCloud not configured`, guarded by the complementary
    `if: ${{ env.SONAR_TOKEN == '' }}`, echoing that the scan is skipped
    because the secret is absent.

  Both `if:` expressions and the `${{ secrets.SONAR_TOKEN }}` literal are
  GitHub Actions expression syntax, which collides lexically with Nunjucks's
  own `{{ }}` output syntax. The template wraps each literal occurrence in
  `{% raw %}...{% endraw %}` so Nunjucks emits it unparsed, while
  `{{ sonarProjectKey }}`, `{{ javaVersion }}`, `{{ checkoutActionRef }}` and
  `{{ setupJavaActionRef }}` remain ordinary interpolations outside the raw
  blocks.
- `permissions: contents: read` and the existing `timeout-minutes: 15` are
  unchanged.
- A new `GithubActionsJavaCiTemplateModel` (`javaVersion`, `checkoutActionRef`,
  `setupJavaActionRef`, `sonarProjectKey`) replaces the previous inline
  `{ javaVersion }` object literal passed to the `build-github-actions-java-ci`
  template invocation.

## Alternatives rejected

- **Adding a dedicated `actions/cache` step for `~/.m2` (and, following the
  reference, `~/.sonar/cache`)**: rejected. `setup-java`'s built-in
  `cache: maven` already caches `~/.m2` keyed on `pom.xml` hashes, which is
  the measurable benefit. Pinning a third action by SHA for a cache the
  generated project's toolchain provides for free is not a measurable gain,
  it is one more action to track and re-pin over time.
- **Copying the reference's separate SonarCloud cache step**: rejected for
  the same reason; the reference's own Maven cache step is likewise not
  reproduced.
- **Deriving `sonar.projectKey` in the template from `groupId`/`artifactId`
  concatenation, or hardcoding an organization prefix (the reference uses
  `jtsato_wallet-service`)**: rejected. The generator has no notion of a
  GitHub organization or account; inventing one would be a value the
  generator cannot justify. The generated `artifactId` is the only
  SonarCloud-relevant identifier the Application Model actually provides, so
  the adapter passes it through unmodified.
- **Making the SHA pins template-authored literals instead of adapter
  constants**: rejected as a direct violation of the architectural invariant
  that templates must not make generation decisions; a version or pin change
  would otherwise require editing the `.njk` file instead of the adapter.
- **Also generating the reference's second, diagram-regeneration workflow**:
  rejected as out of scope for this milestone; the Wallet Reference Gap Plan
  does not include it in Group C's approved decision, and only Group C is in
  scope here.
- **Adding a coverage or mutation-testing gate to this workflow**: rejected as
  scope expansion; those are Milestones 6.48 and 6.51.

## Scope boundary

This decision touches only `build-github-actions-java-ci`
(`.github/workflows/java-ci.yml`) in the `java-spring-clean-multimodule`
profile. It does not change the parent or module POMs, the JaCoCo
configuration from ADR-060, the Maven dependency governance from ADR-059, the
single-module `java-spring-clean` profile, or the `nestjs-clean-architecture`
profile. It adds no new generated file and does not change the full-profile
dry-run CREATE count.

## Consequences

- The generated workflow no longer depends on floating action tags; bumping
  `actions/checkout` or `actions/setup-java` is a one-line SHA/comment edit in
  the adapter, matching the ADR-059 pattern for Maven dependency versions.
- `mvn -B clean verify` now runs with the `test` Spring profile explicitly
  active, matching what a developer running the same command locally should
  use.
- The workflow stays green with no `SONAR_TOKEN` secret configured: the scan
  step's `if:` condition is false, and the companion step reports why.
- A repository owner who configures `SONAR_TOKEN` gets a working SonarCloud
  scan with no further workflow edits.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (212 passing).
- `npm run smoke:java-multimodule` (golden byte comparison against the
  regenerated `.github/workflows/java-ci.yml`).
- `mvn -B clean verify -Dspring.profiles.active=test` against a freshly
  generated `examples/wallet-service` project: BUILD SUCCESS.
- The regenerated `.github/workflows/java-ci.yml` parses with the `yaml`
  package already used elsewhere in the repository, confirming the `# vX.Y.Z`
  comments and the `{% raw %}`-escaped GitHub Actions expressions serialize
  as valid YAML.
