# wallet-service

NestJS service generated from an application model with a clean-architecture
Golden Path, laid out as **npm workspaces**: each architectural layer is its own
package, and a boundary violation is an import of another package by name. Persistence is in memory, so the application needs no external
services to run.

## Packages

| Package | Responsibility | Depends on |
| --- | --- | --- |
| `@wallet-service/core` | Domain models, use cases, commands, queries, gateway ports, paging, filtering and validation. Framework-free. | nothing |
| `@wallet-service/infra-persistence` | Persistence models, mappers, repositories and gateway-implementing providers. | `core` |
| `@wallet-service/web-api` | Controllers, request/response representations, presenters, exception filters and i18n. | `core` |
| `@wallet-service/bootstrap` | Composition root: validates configuration and binds providers and controllers to the Core dependency-injection symbols. | `core`, `infra-persistence`, `web-api` |

Dependencies point inward, and here that is enforced twice over: `eslint.config.mjs`
forbids the imports that would cross a boundary the wrong way, and a package that
does not declare another in its `dependencies` cannot resolve it at all.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Install, build and test

```bash
npm install
npm run lint
npm run build
npm test
npm run test:e2e
```

`npm run build` is `tsc --build packages/bootstrap`, not `nest build`: the build
walks the TypeScript project references so each package compiles in dependency
order and publishes its declarations to the next one.

Unit tests run from the repository root against **sources** rather than build
output — `moduleNameMapper` and `tsconfig.spec.json` both point package names at
`packages/*/src` — so the suite needs no prior build.

## Run

```bash
npm run build
npm run start:prod
```

## Container

```bash
docker build -t wallet-service:latest .
docker run --rm -p 3000:3000 wallet-service:latest
```

The build stage installs the whole workspace, because the reference build needs
every package's sources; the runtime stage keeps only the compiled output and
production dependencies, and runs as the unprivileged `node` user.

## Configuration

`NODE_ENV` selects one of three committed environment files — `.env.development`,
`.env.test` or `.env.production` — and an uncommitted `.env` overrides whichever
was selected. `.env.example` documents every variable the application reads.

Values are validated at startup by `packages/bootstrap/src/config/environment.ts`,
which reports every faulty variable at once and refuses to start.
