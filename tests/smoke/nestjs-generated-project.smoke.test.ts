/**
 * Generated-project execution gate for the NestJS Golden Path.
 *
 * The sibling suite `nestjs-clean-architecture.smoke.test.ts` compares generated
 * artifacts against approved goldens: it proves the generator renders what was
 * reviewed. This suite proves the rendered project actually installs, compiles, and
 * serves, which a byte comparison cannot detect.
 *
 * The generated repository is held in memory for the lifetime of the server process,
 * so a record created by one test remains visible to later tests in this file.
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
  runNpmScript,
  spawnGeneratedNodeServer,
  stopGeneratedNodeServer,
  type GeneratedServer,
} from "./support/NpmSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/nestjs-wallet-service/model.yaml";

let projectRoot: string | undefined;
let server: GeneratedServer | undefined;
let skipReason: string | undefined;

describe("NestJS generated project smoke test", () => {
  beforeAll(async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    projectRoot = await mkdtemp(join(tmpdir(), "ccg-nestjs-generated-project-"));
    await execFileAsync(
      process.execPath,
      [cliEntryPoint, "generate", modelPath, "--profile", profileId, "--output", projectRoot],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    );

    const registry = await detectNpmRegistry(projectRoot);
    if (!registry.available) {
      const message = `NestJS generated project smoke skipped: ${registry.reason} Set CODEGEN_REQUIRE_NPM_SMOKE=true to require npm registry access.`;
      if (process.env["CODEGEN_REQUIRE_NPM_SMOKE"] === "true") throw new Error(message);
      console.warn(message);
      skipReason = message;
      return;
    }

    await installNpmDependencies(projectRoot);
    await runNpmScript(projectRoot, "build");
    await runNpmScript(projectRoot, "test");
    await runNpmScript(projectRoot, "test:e2e");

    const port = await reserveEphemeralPort();
    // Published before readiness is awaited, so teardown can reach the process even if
    // this hook is cut short while the server is still starting.
    server = spawnGeneratedNodeServer({ cwd: projectRoot, entryPoint: "dist/main.js", port });
    await awaitServerReadiness(server);
    // Exceeds the sum of the helper's own budgets, so their errors win over this one.
  }, 1_020_000);

  afterAll(async () => {
    await stopGeneratedNodeServer(server);
    await removeGeneratedProject(projectRoot);
  }, 120_000);

  it("compiles the generated project into the entry point its start script names", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const root = projectRoot as string;

    await expect(access(join(root, "dist", "main.js"))).resolves.toBeUndefined();
    await expect(access(join(root, "dist", "app.module.js"))).resolves.toBeUndefined();

    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { readonly scripts: Record<string, string> };
    expect(manifest.scripts["build"]).toBe("nest build");
    expect(manifest.scripts["test"]).toBe("jest --runInBand");
    expect(manifest.scripts["test:e2e"]).toBe("jest --config ./test/jest-e2e.json --runInBand");
    expect(manifest.scripts["start:prod"]).toBe("node dist/main");
  }, 30_000);

  it("serves create, read, and not-found over HTTP", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const identifier = randomUUID();
    const balance = 125.5;

    const emptyPage = await fetch(`${running.baseUrl}/wallets?page=0&size=20`);
    expect(emptyPage.status, running.output()).toBe(200);
    await expect(emptyPage.json()).resolves.toEqual({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    });

    const created = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: identifier, balance }),
    });
    expect(created.status, running.output()).toBe(201);
    expect(created.headers.get("location")).toBe(`/wallets/${identifier}`);
    await expect(created.json()).resolves.toEqual({ id: identifier, balance });

    const read = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(read.status, running.output()).toBe(200);
    await expect(read.json()).resolves.toEqual({ id: identifier, balance });

    const filtered = await fetch(`${running.baseUrl}/wallets?filter=id:eq:${identifier}`);
    expect(filtered.status, running.output()).toBe(200);
    await expect(filtered.json()).resolves.toEqual({
      items: [{ id: identifier, balance }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });

    const missing = await fetch(`${running.baseUrl}/wallets/${randomUUID()}`);
    expect(missing.status, running.output()).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ statusCode: 404 });
  }, 120_000);

  it("applies the generated global validation pipe and mounts the generated OpenAPI document", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;

    const rejected = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "not-a-uuid", balance: 1 }),
    });
    expect(rejected.status, running.output()).toBe(400);
    await expect(rejected.json()).resolves.toMatchObject({ statusCode: 400 });

    const rejectedPortuguese = await fetch(`${running.baseUrl}/wallets/not-a-uuid`, {
      headers: { "accept-language": "pt-BR" },
    });
    expect(rejectedPortuguese.status, running.output()).toBe(400);
    await expect(rejectedPortuguese.json()).resolves.toMatchObject({ message: "Falha de validação" });

    const invalidIdentifier = await fetch(`${running.baseUrl}/wallets/not-a-uuid`);
    expect(invalidIdentifier.status, running.output()).toBe(400);
    await expect(invalidIdentifier.json()).resolves.toEqual({
      statusCode: 400,
      message: "Validation failed",
      violations: [{ field: "id", message: "id has an invalid value" }],
    });

    const swagger = await fetch(`${running.baseUrl}/swagger-ui`);
    expect(swagger.status, running.output()).toBe(200);
    await swagger.arrayBuffer();

    const live = await fetch(`${running.baseUrl}/health-check/live`);
    expect(live.status, running.output()).toBe(200);
    await expect(live.json()).resolves.toEqual({ status: "UP" });

    const ready = await fetch(`${running.baseUrl}/health-check/ready`);
    expect(ready.status, running.output()).toBe(200);
    await expect(ready.json()).resolves.toEqual({ status: "UP" });
  }, 60_000);
});
