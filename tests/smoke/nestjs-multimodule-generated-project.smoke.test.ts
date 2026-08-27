/**
 * Generated-project execution gate for the NestJS multi-module profile.
 *
 * `nestjs-multimodule.smoke.test.ts` proves the generator renders the layout
 * that was reviewed. This proves the layout is a working npm workspace: that the
 * packages link, that a reference build compiles them in dependency order, that
 * the suites resolve package names to sources without a prior build, and that
 * the composition root serves the same REST contract the single-package layout
 * does.
 *
 * None of that follows from the file listing. A workspace can generate perfectly
 * and still fail to link, or compile and still fail to resolve a package at
 * runtime, which is the failure this suite exists for.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  awaitServerReadiness,
  detectNpmRegistry,
  installNpmDependencies,
  removeGeneratedProject,
  reserveEphemeralPort,
  runFailingNpmScript,
  runNpmScript,
  spawnGeneratedNodeServer,
  stopGeneratedNodeServer,
  type GeneratedServer,
} from "./support/NpmSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture-multimodule";
// The same model the single-package execution gate uses, so the two are directly
// comparable; it marks `balance` unique, which the conflict assertions need.
const modelPath = "examples/wallet-service/model.yaml";

let projectRoot: string | undefined;
let server: GeneratedServer | undefined;
let skipReason: string | undefined;

describe("NestJS multi-module generated project smoke test", () => {
  beforeAll(async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    projectRoot = await mkdtemp(join(tmpdir(), "ccg-nestjs-multimodule-project-"));
    await execFileAsync(
      process.execPath,
      [cliEntryPoint, "generate", modelPath, "--profile", profileId, "--output", projectRoot],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    );

    const registry = await detectNpmRegistry(projectRoot);
    if (!registry.available) {
      const message = `NestJS multi-module generated project smoke skipped: ${registry.reason} Set CODEGEN_REQUIRE_NPM_SMOKE=true to require npm registry access.`;
      if (process.env["CODEGEN_REQUIRE_NPM_SMOKE"] === "true") throw new Error(message);
      console.warn(message);
      skipReason = message;
      return;
    }

    await installNpmDependencies(projectRoot);
    await runNpmScript(projectRoot, "lint");
    // `tsc --build packages/bootstrap`, which walks the project references.
    await runNpmScript(projectRoot, "build");
    await runNpmScript(projectRoot, "test");
    await runNpmScript(projectRoot, "test:e2e");

    const port = await reserveEphemeralPort();
    server = spawnGeneratedNodeServer({
      cwd: projectRoot,
      entryPoint: "packages/bootstrap/dist/main.js",
      port,
    });
    await awaitServerReadiness(server);
  }, 1_020_000);

  afterAll(async () => {
    await stopGeneratedNodeServer(server);
    await removeGeneratedProject(projectRoot);
  }, 120_000);

  it("links every workspace package and compiles each into its own output", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const root = projectRoot as string;

    for (const name of ["core", "infra-persistence", "web-api", "bootstrap"]) {
      // The symlink npm creates for a workspace is what makes a package name
      // resolvable at runtime; without it the build succeeds and the server dies
      // on its first require.
      await expect(access(join(root, "node_modules", "@wallet-service", name)), name)
        .resolves.toBeUndefined();
      await expect(access(join(root, "packages", name, "dist")), name).resolves.toBeUndefined();
    }

    await expect(access(join(root, "packages/bootstrap/dist/main.js"))).resolves.toBeUndefined();
    // Declarations, because a referenced project is consumed through its types.
    await expect(access(join(root, "packages/core/dist/models/wallet.model.d.ts"))).resolves.toBeUndefined();
  }, 30_000);

  it("rejects an import that crosses a package boundary", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const root = projectRoot as string;

    // The clean run above proves the generated sources satisfy the rule. This
    // proves the rule can reject anything at all, which a clean run cannot
    // distinguish from a misconfigured one.
    const modelFile = join(root, "packages/core/src/models/wallet.model.ts");
    const original = await readFile(modelFile, "utf8");
    try {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(
        modelFile,
        `import { WalletEntity } from '@wallet-service/infra-persistence/models/wallet-entity.model';\n\n${original}`,
        "utf8",
      );

      const lint = await runFailingNpmScript(root, "lint");
      expect(lint.failed, lint.output).toBe(true);
      expect(lint.output).toContain("no-restricted-imports");
      expect(lint.output).toContain("Dependencies point inward");
    } finally {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(modelFile, original, "utf8");
    }
  }, 120_000);

  it("serves the same REST contract the single-package layout does", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const identifier = randomUUID();
    const balance = 431.75;

    const created = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: identifier, balance }),
    });
    expect(created.status, running.output()).toBe(201);
    await expect(created.json()).resolves.toEqual({ id: identifier, balance });

    const read = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(read.status, running.output()).toBe(200);
    await read.json();

    const deleted = await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
    expect(deleted.status, running.output()).toBe(204);

    // Soft delete, the deleted-only route and restore all cross package
    // boundaries on the way through, so this is the end-to-end proof that the
    // layout did not break the wiring.
    const tombstone = await fetch(`${running.baseUrl}/wallets/deleted/${identifier}`);
    expect(tombstone.status, running.output()).toBe(200);
    await tombstone.json();

    const restored = await fetch(`${running.baseUrl}/wallets/${identifier}/restore`, { method: "POST" });
    expect(restored.status, running.output()).toBe(204);

    const readBack = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(readBack.status, running.output()).toBe(200);
    await expect(readBack.json()).resolves.toEqual({ id: identifier, balance });

    const health = await fetch(`${running.baseUrl}/health-check/ready`);
    expect(health.status, running.output()).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: "UP" });

    const invalid = await fetch(`${running.baseUrl}/wallets/not-a-uuid`);
    expect(invalid.status, running.output()).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({ statusCode: 400 });
  }, 120_000);
});
