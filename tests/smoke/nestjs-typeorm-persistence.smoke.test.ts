/**
 * Persistence-option gate for the NestJS Golden Path.
 *
 * The `persistence` option selects between the in-memory adapter and TypeORM.
 * Goldens for the TypeORM variant are stored as the *difference* from the default
 * generation rather than as a second full tree, and this suite is what makes that
 * safe: it asserts that the set of files the option changes is exactly the
 * declared set, so a template that quietly started depending on the option would
 * fail here rather than drift unreviewed.
 *
 * That assertion is also the evidence for ADR-057's mapper boundary. The mapper
 * and the five gateway providers are not on the list, which is the claim that
 * swapping the storage technology does not reach the code between the repository
 * and the Core.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/nestjs-wallet-service/model.yaml";
const identifierOnlyModelPath = "examples/nestjs-identifier-only/model.yaml";
const goldenRoot = join(repoRoot, "tests", "golden", "nestjs-clean-architecture-typeorm");

/** Files the option adds. They have no counterpart in the default generation. */
const ADDED_PATHS = [
  "src/infra/persistence/column.transformers.ts",
  "test/setup-e2e-environment.ts",
] as const;

/** Files the option rewrites. Every other generated file must be untouched. */
const CHANGED_PATHS = [
  ".env.example",
  ".env.development",
  ".env.test",
  ".env.production",
  ".github/workflows/node-ci.yml",
  "README.md",
  "docker-compose.yml",
  "package.json",
  "test/jest-e2e.json",
  "src/app.module.ts",
  "src/config/environment.ts",
  "src/config/environment.spec.ts",
  "src/modules/wallet.module.ts",
  "src/infra/models/wallet-entity.model.ts",
  "src/infra/repositories/wallet.repository.ts",
  "src/infra/repositories/wallet.repository.spec.ts",
] as const;

// Same convention as the default golden tree: a stored `.env.*` would be swallowed
// by this repository's own ignore rules and so could never be committed at all.
const dotlessGoldenPaths = new Map([
  [".env.example", "env.example"],
  [".env.development", "env.development"],
  [".env.test", "env.test"],
  [".env.production", "env.production"],
]);

function goldenModule(targetPath: string): string {
  if (targetPath.startsWith("src/core/")) return "core";
  if (targetPath.startsWith("src/infra/")) return "infra-persistence";
  if (targetPath.startsWith("src/web-api/")) return "web-api";
  if (targetPath.startsWith("src/modules/") || targetPath.startsWith("src/config/")) return "bootstrap";
  if (targetPath === "src/main.ts" || targetPath === "src/app.module.ts") return "bootstrap";
  if (targetPath === "test/app.e2e-spec.ts" || targetPath === "test/setup-e2e-environment.ts") return "bootstrap";
  return "build";
}

function normalize(content: string): string {
  return content.replaceAll("\r\n", "\n");
}

async function listRelativeFiles(root: string): Promise<readonly string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"))
    .sort();
}

async function generate(root: string, args: readonly string[], model = modelPath): Promise<void> {
  await execFileAsync(
    process.execPath,
    [cliEntryPoint, "generate", model, "--profile", profileId, ...args, "--output", root],
    { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
  );
}

async function runCli(args: readonly string[]): Promise<{ readonly code: number; readonly output: string }> {
  try {
    const result = await execFileAsync(process.execPath, [cliEntryPoint, ...args], { cwd: repoRoot });
    return { code: 0, output: `${result.stdout}\n${result.stderr}` };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return {
      code: typeof failure.code === "number" ? failure.code : 1,
      output: `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`,
    };
  }
}

let defaultRoot: string;
let typeormRoot: string;

describe("NestJS persistence option smoke test", () => {
  beforeAll(async () => {
    defaultRoot = await mkdtemp(join(tmpdir(), "ccg-nest-persistence-default-"));
    typeormRoot = await mkdtemp(join(tmpdir(), "ccg-nest-persistence-typeorm-"));

    await generate(defaultRoot, []);
    await generate(typeormRoot, ["--option", "persistence=typeorm"]);
  }, 60_000);

  afterAll(async () => {
    await rm(defaultRoot, { recursive: true, force: true });
    await rm(typeormRoot, { recursive: true, force: true });
  });

  it("adds exactly the files the option is declared to add", async () => {
    const before = new Set(await listRelativeFiles(defaultRoot));
    const after = await listRelativeFiles(typeormRoot);

    expect(after.filter((path) => !before.has(path))).toEqual([...ADDED_PATHS].sort());
    expect([...before].filter((path) => !after.includes(path))).toEqual([]);
  });

  it("changes exactly the files the option is declared to change", async () => {
    const shared = (await listRelativeFiles(defaultRoot)).filter(
      (path) => !(ADDED_PATHS as readonly string[]).includes(path),
    );
    const changed: string[] = [];

    for (const path of shared) {
      const [fromDefault, fromTypeorm] = await Promise.all([
        readFile(join(defaultRoot, path), "utf8"),
        readFile(join(typeormRoot, path), "utf8"),
      ]);
      if (normalize(fromDefault) !== normalize(fromTypeorm)) changed.push(path);
    }

    // Named explicitly so an unreviewed divergence reads as what it is: the
    // option reaching a file nobody decided it should reach.
    expect(changed.sort()).toEqual([...CHANGED_PATHS].sort());
  });

  it("leaves the mapper and every gateway provider untouched", async () => {
    // The load-bearing consequence of the assertion above, stated on its own
    // because it is the ADR-057 boundary claim rather than a bookkeeping detail.
    const unaffected = [
      "src/infra/mappers/wallet.mapper.ts",
      "src/infra/providers/create-wallet.provider.ts",
      "src/infra/providers/get-wallet-by-id.provider.ts",
      "src/infra/providers/page-wallets.provider.ts",
      "src/infra/providers/update-wallet.provider.ts",
      "src/infra/providers/delete-wallet.provider.ts",
    ];

    for (const path of unaffected) {
      const [fromDefault, fromTypeorm] = await Promise.all([
        readFile(join(defaultRoot, path), "utf8"),
        readFile(join(typeormRoot, path), "utf8"),
      ]);
      expect(normalize(fromTypeorm), path).toBe(normalize(fromDefault));
    }
  });

  it("matches the approved golden for every file the option touches", async () => {
    for (const path of [...ADDED_PATHS, ...CHANGED_PATHS]) {
      const generated = await readFile(join(typeormRoot, path), "utf8");
      const golden = await readFile(
        join(goldenRoot, goldenModule(path), dotlessGoldenPaths.get(path) ?? path),
        "utf8",
      );
      expect(normalize(generated), path).toBe(normalize(golden));
    }
  });

  it("keeps the generated Core free of persistence technology", async () => {
    // The ORM is an infrastructure choice. If it reached the Core, the option
    // would no longer be an implementation detail behind the gateway ports.
    const coreFiles = (await listRelativeFiles(typeormRoot)).filter((path) => path.startsWith("src/core/"));
    expect(coreFiles.length).toBeGreaterThan(0);

    for (const path of coreFiles) {
      const content = await readFile(join(typeormRoot, path), "utf8");
      expect(content, path).not.toContain("typeorm");
    }
  });

  it("renders the TypeORM variant for an entity with only its identifier", async () => {
    const root = await mkdtemp(join(tmpdir(), "ccg-nest-persistence-marker-"));
    try {
      await generate(root, ["--option", "persistence=typeorm"], identifierOnlyModelPath);

      const entity = await readFile(join(root, "src/infra/models/marker-entity.model.ts"), "utf8");
      expect(entity).toContain("@Entity({ name: 'markers' })");
      expect(entity).toContain("@PrimaryColumn({ name: 'id' })");
      // No numeric column, so nothing imports the transformer — but the file is
      // still emitted, which is what keeps the file list independent of which
      // primitive types a model happens to use.
      expect(entity).not.toContain("numericTransformer");
      await expect(readFile(join(root, "src/infra/persistence/column.transformers.ts"), "utf8")).resolves.toContain(
        "numericTransformer",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects an option value the profile does not declare", async () => {
    const result = await runCli([
      "generate", modelPath, "--profile", profileId, "--option", "persistence=sqlite", "--dry-run",
    ]);

    expect(result.code).toBe(1);
    // The allowed values belong in the message: an operator who guessed wrong
    // should not have to open the profile to find out what was permitted.
    expect(result.output).toContain("persistence");
    expect(result.output).toContain("memory, typeorm");
  }, 30_000);

  it("rejects an option the profile does not declare at all", async () => {
    const result = await runCli([
      "generate", modelPath, "--profile", profileId, "--option", "database=postgres", "--dry-run",
    ]);

    expect(result.code).toBe(1);
    expect(result.output).toContain("not declared by this profile");
  }, 30_000);
});
