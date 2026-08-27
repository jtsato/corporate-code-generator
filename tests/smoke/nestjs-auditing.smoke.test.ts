/**
 * Auditing gate for the NestJS Golden Path.
 *
 * `audited: true` is a per-entity opt-in, so the load-bearing property is not
 * only that it works but that it costs nothing when it is absent: a model that
 * does not ask for auditing must generate exactly what it generated before.
 *
 * `examples/nestjs-audited-wallet-service` is deliberately identical to
 * `examples/nestjs-wallet-service` apart from that flag, which is what lets this
 * suite store the golden as the difference between the two generations and
 * assert that the difference is exactly the declared set. A template that
 * quietly started branching on the flag fails here rather than drifting
 * unreviewed.
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
const plainModelPath = "examples/nestjs-wallet-service/model.yaml";
const auditedModelPath = "examples/nestjs-audited-wallet-service/model.yaml";
const goldenRoot = join(repoRoot, "tests", "golden", "nestjs-clean-architecture-audited");

/** Files auditing adds. Emitted once per application, not once per entity. */
const ADDED_PATHS = [
  "src/core/common/time/clock.ts",
  "src/core/common/time/clock.spec.ts",
  "src/modules/clock.module.ts",
] as const;

/** Files auditing rewrites. Every other generated file must be untouched. */
const CHANGED_PATHS = [
  "src/core/models/wallet.model.ts",
  "src/core/usecases/create-wallet/create-wallet.usecase.ts",
  "src/core/usecases/create-wallet/create-wallet.usecase.spec.ts",
  "src/core/usecases/update-wallet/update-wallet.usecase.ts",
  "src/core/usecases/update-wallet/update-wallet.usecase.spec.ts",
  "src/core/usecases/patch-wallet/patch-wallet.usecase.ts",
  "src/core/usecases/patch-wallet/patch-wallet.usecase.spec.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id.usecase.spec.ts",
  "src/infra/mappers/wallet.mapper.ts",
  "src/infra/models/wallet-entity.model.ts",
  "src/infra/providers/update-wallet.provider.ts",
  "src/modules/wallet.module.ts",
  "src/web-api/entrypoints/wallets/wallet-presenter.mapper.ts",
  "src/web-api/entrypoints/wallets/wallet-response.model.ts",
  "test/app.e2e-spec.ts",
] as const;

function goldenModule(targetPath: string): string {
  if (targetPath.startsWith("src/core/")) return "core";
  if (targetPath.startsWith("src/infra/")) return "infra-persistence";
  if (targetPath.startsWith("src/web-api/")) return "web-api";
  if (targetPath.startsWith("src/modules/") || targetPath.startsWith("src/config/")) return "bootstrap";
  if (targetPath === "src/main.ts" || targetPath === "src/app.module.ts") return "bootstrap";
  if (targetPath === "test/app.e2e-spec.ts") return "bootstrap";
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

async function generate(root: string, model: string, args: readonly string[] = []): Promise<void> {
  await execFileAsync(
    process.execPath,
    [cliEntryPoint, "generate", model, "--profile", profileId, ...args, "--output", root],
    { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
  );
}

let plainRoot: string;
let auditedRoot: string;

describe("NestJS auditing smoke test", () => {
  beforeAll(async () => {
    plainRoot = await mkdtemp(join(tmpdir(), "ccg-nest-audit-plain-"));
    auditedRoot = await mkdtemp(join(tmpdir(), "ccg-nest-audit-audited-"));

    await generate(plainRoot, plainModelPath);
    await generate(auditedRoot, auditedModelPath);
  }, 60_000);

  afterAll(async () => {
    await rm(plainRoot, { recursive: true, force: true });
    await rm(auditedRoot, { recursive: true, force: true });
  });

  it("adds exactly the files auditing is declared to add", async () => {
    const before = new Set(await listRelativeFiles(plainRoot));
    const after = await listRelativeFiles(auditedRoot);

    expect(after.filter((path) => !before.has(path))).toEqual([...ADDED_PATHS].sort());
    expect([...before].filter((path) => !after.includes(path))).toEqual([]);
  });

  it("changes exactly the files auditing is declared to change", async () => {
    const shared = (await listRelativeFiles(plainRoot)).filter(
      (path) => !(ADDED_PATHS as readonly string[]).includes(path),
    );
    const changed: string[] = [];

    for (const path of shared) {
      const [fromPlain, fromAudited] = await Promise.all([
        readFile(join(plainRoot, path), "utf8"),
        readFile(join(auditedRoot, path), "utf8"),
      ]);
      if (normalize(fromPlain) !== normalize(fromAudited)) changed.push(path);
    }

    // The opt-in's whole promise: a model that does not ask for auditing pays
    // nothing for it, and the reach of the flag is reviewed rather than assumed.
    expect(changed.sort()).toEqual([...CHANGED_PATHS].sort());
  });

  it("leaves every request model free of audit fields", async () => {
    // Both timestamps are server-generated. A request model that accepted either
    // would let a client backdate its own record.
    const requestModels = [
      "src/web-api/entrypoints/wallets/create-wallet-request.model.ts",
      "src/web-api/entrypoints/wallets/update-wallet-request.model.ts",
      "src/web-api/entrypoints/wallets/patch-wallet-request.model.ts",
    ];

    for (const path of requestModels) {
      const content = await readFile(join(auditedRoot, path), "utf8");
      expect(content, path).not.toContain("createdAt");
      expect(content, path).not.toContain("updatedAt");
    }
  });

  it("matches the approved golden for every file auditing touches", async () => {
    for (const path of [...ADDED_PATHS, ...CHANGED_PATHS]) {
      const generated = await readFile(join(auditedRoot, path), "utf8");
      const golden = await readFile(join(goldenRoot, goldenModule(path), path), "utf8");
      expect(normalize(generated), path).toBe(normalize(golden));
    }
  });

  it("reads the clock through a port the Core owns", async () => {
    const clock = await readFile(join(auditedRoot, "src/core/common/time/clock.ts"), "utf8");
    const createUseCase = await readFile(
      join(auditedRoot, "src/core/usecases/create-wallet/create-wallet.usecase.ts"), "utf8",
    );

    // Framework-free, like the rest of the Core.
    expect(clock).not.toContain("@nestjs/");
    expect(clock).toContain("export interface IClock");
    expect(clock).toContain("export const IClockSymbol");
    // Injected rather than called directly, which is what lets a generated test
    // say what "now" was instead of asserting against a value it cannot predict.
    expect(createUseCase).toContain("private readonly clock: IClock");
    expect(createUseCase).not.toContain("new Date()");
  });

  it("takes one clock reading for a creation and never supplies one on a write", async () => {
    const createUseCase = await readFile(
      join(auditedRoot, "src/core/usecases/create-wallet/create-wallet.usecase.ts"), "utf8",
    );
    const updateUseCase = await readFile(
      join(auditedRoot, "src/core/usecases/update-wallet/update-wallet.usecase.ts"), "utf8",
    );
    const patchUseCase = await readFile(
      join(auditedRoot, "src/core/usecases/patch-wallet/patch-wallet.usecase.ts"), "utf8",
    );
    const updateProvider = await readFile(
      join(auditedRoot, "src/infra/providers/update-wallet.provider.ts"), "utf8",
    );

    // One reading assigned twice: a fresh record is defined to have identical
    // timestamps, which two readings would not guarantee.
    expect([...createUseCase.matchAll(/this\.clock\.now\(\)/g)]).toHaveLength(1);
    expect(createUseCase).toContain("const createdAt = this.clock.now();");

    // Update and patch state the same rule, so there is one place that decides
    // what a creation timestamp survives.
    for (const useCase of [updateUseCase, patchUseCase]) {
      expect(useCase).toContain("this.clock.now()");
      expect(useCase).toMatch(/\n\s+null,\n\s+this\.clock\.now\(\),/);
    }

    expect(updateProvider).toContain("entity.createdAt = current.createdAt;");
  });

  it("keeps the ORM out of the timestamps under the TypeORM option", async () => {
    const root = await mkdtemp(join(tmpdir(), "ccg-nest-audit-typeorm-"));
    try {
      await generate(root, auditedModelPath, ["--option", "persistence=typeorm"]);

      const entity = await readFile(join(root, "src/infra/models/wallet-entity.model.ts"), "utf8");

      // Plain columns: the timestamps come from the Core clock, so a generated
      // test can state what "now" was rather than asserting against a value the
      // database invented.
      expect(entity).toContain("@Column({ name: 'created_at' })");
      expect(entity).toContain("@Column({ name: 'updated_at' })");
      // Asserted on the import rather than the whole file: the entity's own
      // comment names the decorators it deliberately does not use, and using one
      // would require importing it.
      const imports = entity.split("\n")[0] ?? "";
      expect(imports).toContain("typeorm");
      expect(imports).not.toContain("CreateDateColumn");
      expect(imports).not.toContain("UpdateDateColumn");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
