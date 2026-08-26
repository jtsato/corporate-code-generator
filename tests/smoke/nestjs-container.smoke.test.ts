/**
 * Container packaging gate for the NestJS Golden Path.
 *
 * The generated `Dockerfile`, `.dockerignore` and Compose file restate facts that
 * live elsewhere in the generated project: the port comes from `.env.production`,
 * and the healthcheck target is a route the health controller declares. Nothing
 * makes those agree, so this suite asserts they do.
 *
 * It cannot prove the image builds — that needs a container runtime, and the
 * milestone shipped without one available. What it can prove is that the packaging
 * describes the application the generator actually emitted, which is where drift
 * would otherwise appear silently and only at deploy time.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/nestjs-wallet-service/model.yaml";

/**
 * Produced by the build stage rather than by the generator, so they cannot be
 * asserted to exist in generated output. Listed explicitly so that a copy of
 * anything else has to be justified here first.
 */
const BUILD_PRODUCTS = new Set(["dist", "node_modules"]);

let projectRoot: string;
let dockerfile: string;
let dockerignore: string;
let compose: string;
let productionEnvironment: string;
let workflow: string;

async function readFrom(root: string, relativePath: string): Promise<string> {
  return (await readFile(join(root, relativePath), "utf8")).replaceAll("\r\n", "\n");
}

async function read(relativePath: string): Promise<string> {
  return readFrom(projectRoot, relativePath);
}

describe("NestJS container packaging smoke test", () => {
  beforeAll(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "ccg-nest-container-"));
    await execFileAsync(
      process.execPath,
      [cliEntryPoint, "generate", modelPath, "--profile", profileId, "--output", projectRoot],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    );

    dockerfile = await read("Dockerfile");
    dockerignore = await read(".dockerignore");
    compose = await read("docker-compose.yml");
    productionEnvironment = await read(".env.production");
    workflow = await read(".github/workflows/node-ci.yml");
  }, 60_000);

  afterAll(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("exposes, health-checks and publishes the port the production environment declares", () => {
    const declaredPort = /^PORT=(\d+)$/m.exec(productionEnvironment)?.[1];
    expect(declaredPort, ".env.production must declare a PORT").toBeDefined();

    expect(dockerfile).toContain(`EXPOSE ${declaredPort}`);
    expect(dockerfile).toContain(`http://localhost:${declaredPort}/`);
    expect(compose).toContain(`"${declaredPort}:${declaredPort}"`);
    // The workflow starts the image and polls it, so it restates the port twice.
    expect(workflow).toContain(`-p ${declaredPort}:${declaredPort}`);
    expect(workflow).toContain(`http://localhost:${declaredPort}/`);
  });

  it("health-checks a route the generated health controller declares", async () => {
    const healthPath = /wget[^\n]*http:\/\/localhost:\d+(\/\S*?)\s/.exec(dockerfile)?.[1];
    expect(healthPath, "the Dockerfile must health-check an explicit path").toBeDefined();

    const controller = await read("src/web-api/health/health.controller.ts");
    expect(controller, `health controller must declare ${String(healthPath)}`).toContain(`'${String(healthPath)}'`);
  });

  it("keeps the production environment file out of the ignore list", () => {
    // The decisive case: were `.env.production` ignored, the container would boot
    // on development defaults, which include a wildcard CORS origin.
    const ignored = dockerignore
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));

    expect(ignored).not.toContain(".env.production");
    expect(ignored).not.toContain(".env.*");
    expect(ignored).toContain(".env");
  });

  it("copies only paths the generated project produces", async () => {
    const copies = [...dockerfile.matchAll(/COPY --from=build[^\n]*\s\/build\/(\S+)\s/g)].map((match) => match[1] ?? "");
    expect(copies.length).toBeGreaterThan(0);

    for (const copied of copies) {
      if (BUILD_PRODUCTS.has(copied)) continue;
      await expect(readFile(join(projectRoot, copied), "utf8"), `${copied} is copied but never generated`).resolves.toBeTruthy();
    }
  });

  it("runs the runtime stage as an unprivileged user", () => {
    const runtimeStage = dockerfile.slice(dockerfile.indexOf("AS runtime"));
    const user = /^USER\s+(\S+)/m.exec(runtimeStage)?.[1];

    expect(user, "the runtime stage must set USER").toBeDefined();
    expect(user).not.toBe("root");
    expect(user).not.toBe("0");
    expect(runtimeStage).toContain("--chown=node:node");
  });

  it("generates a workflow that parses as YAML", () => {
    const parsed = parse(workflow) as { readonly jobs?: Record<string, { readonly steps?: readonly unknown[] }> };

    expect(parsed.jobs?.["build"]?.steps?.length ?? 0).toBeGreaterThan(0);
  });

  it("pins every workflow action by commit SHA with its tag in a comment", () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)(.*)$/gm)];
    expect(uses.length).toBeGreaterThan(0);

    for (const [, reference = "", trailing = ""] of uses) {
      expect(reference, `${reference} must be pinned by 40-character commit SHA`).toMatch(/@[0-9a-f]{40}$/);
      expect(trailing, `${reference} must carry its tag in a trailing comment`).toMatch(/#\s*v\d/);
    }
  });

  it("only runs npm scripts the generated manifest declares", async () => {
    const manifest = JSON.parse(await read("package.json")) as { readonly scripts: Record<string, string> };

    // `npm test` is the one invocation that does not spell `run`.
    const invoked = [...workflow.matchAll(/run:\s*npm (?:run )?([a-z0-9:]+)/g)]
      .map((match) => match[1] ?? "")
      .filter((script) => script !== "install");

    expect(invoked.length).toBeGreaterThan(0);
    for (const script of invoked) {
      expect(Object.keys(manifest.scripts), `the workflow runs '${script}'`).toContain(script);
    }
  });

  it("builds and probes the container image in CI", () => {
    // The milestone that added the Dockerfile could not build it: no container
    // runtime was available. This step is where that verification actually happens.
    expect(workflow).toContain("docker build");
    expect(workflow).toContain("docker run");
    expect(workflow).toContain("docker logs");
  });

  it("names the image after the application and omits the obsolete version key", () => {
    expect(compose).toContain("image: wallet-service:latest");
    expect(compose).not.toContain("version:");
  });
});

/**
 * With an ORM the packaging has to start a database as well as the application,
 * so Compose stops being an alternative to `docker run` and becomes the only way
 * the image can serve. These cases assert the agreements that span files and that
 * a byte-for-byte golden therefore cannot catch: credentials restated in two
 * services, and a workflow naming commands the Compose file has to support.
 */
describe("NestJS container packaging with TypeORM persistence", () => {
  let typeormRoot: string;
  let typeormCompose: string;
  let typeormWorkflow: string;

  beforeAll(async () => {
    typeormRoot = await mkdtemp(join(tmpdir(), "ccg-nest-container-typeorm-"));
    await execFileAsync(
      process.execPath,
      [
        cliEntryPoint, "generate", modelPath, "--profile", profileId,
        "--option", "persistence=typeorm", "--output", typeormRoot,
      ],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    );

    typeormCompose = await readFrom(typeormRoot, "docker-compose.yml");
    typeormWorkflow = await readFrom(typeormRoot, ".github/workflows/node-ci.yml");
  }, 60_000);

  afterAll(async () => {
    await rm(typeormRoot, { recursive: true, force: true });
  });

  it("waits for the database to accept connections before starting the application", () => {
    const parsed = parse(typeormCompose) as {
      readonly services: Record<string, {
        readonly depends_on?: Record<string, { readonly condition?: string }>;
        readonly healthcheck?: unknown;
      }>;
    };

    expect(Object.keys(parsed.services)).toContain("postgres");
    // `service_started` would let the application race an unready database and
    // fail its first connection, which is the failure this condition prevents.
    expect(parsed.services["app"]?.depends_on?.["postgres"]?.condition).toBe("service_healthy");
    expect(parsed.services["postgres"]?.healthcheck).toBeDefined();
  });

  it("gives the application the credentials the database service was created with", () => {
    const parsed = parse(typeormCompose) as {
      readonly services: Record<string, { readonly environment?: Record<string, string> }>;
    };
    const app = parsed.services["app"]?.environment ?? {};
    const database = parsed.services["postgres"]?.environment ?? {};

    // Restated in two services, so nothing but this makes them agree.
    expect(app["DATABASE_USERNAME"]).toBe(database["POSTGRES_USER"]);
    expect(app["DATABASE_PASSWORD"]).toBe(database["POSTGRES_PASSWORD"]);
    expect(app["DATABASE_NAME"]).toBe(database["POSTGRES_DB"]);
    expect(app["DATABASE_HOST"]).toBe("postgres");
  });

  it("verifies the stack through Compose rather than a lone container", () => {
    expect(typeormWorkflow).toContain("docker compose up");
    expect(typeormWorkflow).toContain("docker compose logs");
    // A bare `docker run` would start the application with no database to reach.
    expect(typeormWorkflow).not.toMatch(/run:\s*docker run/);
  });

  it("keeps the readiness probe pointed at the port and path the packaging declares", async () => {
    const productionEnvironmentFile = await readFrom(typeormRoot, ".env.production");
    const declaredPort = /^PORT=(\d+)$/m.exec(productionEnvironmentFile)?.[1];
    const controller = await readFrom(typeormRoot, "src/web-api/health/health.controller.ts");
    const healthPath = /curl -sf http:\/\/localhost:\d+(\S*)/.exec(typeormWorkflow)?.[1];

    expect(declaredPort).toBeDefined();
    expect(typeormCompose).toContain(`"${String(declaredPort)}:${String(declaredPort)}"`);
    expect(typeormWorkflow).toContain(`http://localhost:${String(declaredPort)}`);
    expect(healthPath, "the workflow must probe an explicit path").toBeDefined();
    expect(controller).toContain(`'${String(healthPath)}'`);
  });
});
