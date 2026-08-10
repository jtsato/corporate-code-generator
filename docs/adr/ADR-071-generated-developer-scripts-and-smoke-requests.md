# ADR-071 — Generated Developer Scripts and Smoke Requests

## Status

Accepted — Milestone 6.50.

## Context

Milestones 6.48 and 6.49 put two capabilities behind Maven profiles that a
newcomer to a generated project has no way to discover:
`-P mutation -pl core verify` and `-P integration-test -pl infra/database -am
verify`. Neither runs by default, and neither is guessable. The generated
`README.md` documents them, but a command that must be copied out of prose is a
command that goes unused.

The reference project answers this with four Windows batch files (`run.cmd`,
`run-app.cmd`, `run-test.cmd`, `run-mutation.cmd`) and a `Smoke.http` request
collection. The Wallet Reference Gap Plan schedules them as Milestone 6.50,
"opt-in convenience artifacts".

## Decision

- Generate **one dispatcher per platform** — `run.sh` and `run.cmd` — rather
  than one file per task. Both expose the same five tasks (`app`, `test`,
  `verify`, `mutation`, `integration`), print usage on `help` or an unknown
  task, and default to `verify`.
- Generate `Smoke.http`: a request collection covering health, the OpenAPI
  document, and the full REST surface of every entity in the model — create,
  list, read, replace, patch, soft delete, deleted list, deleted read, restore —
  with request bodies built from the model's attributes.
- Both are emitted unconditionally, following the precedent
  [ADR-058](ADR-058-generated-repository-hygiene.md) set for `.gitignore` and
  `README.md` and [ADR-066](ADR-066-generated-docker-capability.md) restated for
  the Docker artifacts.
- The task list is derived in the adapter from the same constants that generate
  the POM profiles, so a script cannot name a profile the build does not have.

## Why not the reference's four batch files

Copying them would mean shipping Windows-only scripts into projects whose
generated CI runs on Linux, and four files whose entire content is one Maven
line each. One dispatcher per platform covers the same ground in two artifacts
instead of eight, works on both operating systems, and has somewhere to put the
next profile-gated task without adding a file.

This is the gap plan's own framing applied literally: the reference is a source
of requirements, not a template to copy, and parts of it are explicitly legacy.

## Alternatives rejected

- **Four separate scripts per platform, mirroring the reference**: rejected
  above.
- **A Makefile instead of shell scripts**: rejected. It reads better, but
  `make` is not present by default on Windows, which is where a meaningful share
  of these projects are developed.
- **Marking `run.sh` executable**: the generator writes file contents, not
  POSIX permission bits, so the README documents `sh run.sh <task>`. Teaching
  the writer about file modes is a generator-wide change and is not in scope
  for a convenience script.
- **Generating a Postman collection instead of `.http`**: rejected. `.http` is
  plain text that reviews in a diff and runs natively in both VS Code (REST
  Client) and IntelliJ IDEA; a Postman collection is JSON that reviews badly and
  needs an extra tool.
- **Reusing the generated tests' fixture values in `Smoke.http`**: rejected as
  false precision. The requests are illustrative; tying them to test fixtures
  would imply a guarantee the file does not make.

## Scope boundary

This decision adds no build behavior. The scripts only invoke Maven commands
that already existed, and `Smoke.http` is inert text. Nothing in CI runs either
artifact, and no generated test depends on them.

## Consequences

- Generated projects gain three root artifacts. The full-profile count rises
  from 165 to 168 CREATE operations.
- The profile-gated capabilities from 6.48 and 6.49 are now discoverable from
  the project root without reading the README.
- Adding a future Maven profile means adding one entry to the adapter's task
  list; both scripts and the README pick it up.

## Validation

- `npm run typecheck`, `npm run build`, `npm test` (48 test files, 212 tests).
- `npm run smoke:java-multimodule` — golden byte comparison at 168 CREATE
  operations.
- The generated `run.sh` was executed under `sh`: `help` printed the task table,
  and an unknown task printed usage to stderr and exited 1.
- The generated `run.cmd` was executed under `cmd.exe` with the same two cases
  and the same results.
- `Smoke.http` was inspected for well-formed JSON bodies and correct
  `{{baseUrl}}` interpolation after the Nunjucks `{% raw %}` escaping.
