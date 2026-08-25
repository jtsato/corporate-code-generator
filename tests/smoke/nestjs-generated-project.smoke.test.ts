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
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/wallet-service/model.yaml";

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
    await runNpmScript(projectRoot, "lint");
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

  it("negotiates language by quality weight, not by header order", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;

    // The distinguishing case for the generated policy: an unsupported language
    // outranks a supported one. A resolver that simply forwards the first tag
    // would land on `de`, find no catalog, and answer in English.
    const weighted = await fetch(`${running.baseUrl}/wallets/not-a-uuid`, {
      headers: { "accept-language": "de;q=1.0, pt;q=0.1" },
    });
    expect(weighted.status, running.output()).toBe(400);
    await expect(weighted.json()).resolves.toMatchObject({ message: "Falha de validação" });

    const unsupported = await fetch(`${running.baseUrl}/wallets/not-a-uuid`, {
      headers: { "accept-language": "fr-FR" },
    });
    expect(unsupported.status, running.output()).toBe(400);
    await expect(unsupported.json()).resolves.toMatchObject({ message: "Validation failed" });

    const missing = await fetch(`${running.baseUrl}/wallets/not-a-uuid`);
    expect(missing.status, running.output()).toBe(400);
    await expect(missing.json()).resolves.toMatchObject({ message: "Validation failed" });
  }, 30_000);

  it("applies the CORS policy the selected environment file declares", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;

    // NODE_ENV is unset for this server, so ConfigModule loads `.env.development`,
    // which allows any origin with credentials off.
    const preflight = await fetch(`${running.baseUrl}/wallets`, {
      method: "OPTIONS",
      headers: {
        origin: "https://example.test",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(preflight.status, running.output()).toBeLessThan(400);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("*");
    expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
    expect(preflight.headers.get("access-control-allow-credentials")).toBeNull();
  }, 30_000);

  it("rejects an import that crosses a layer boundary", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const root = projectRoot as string;

    // The clean run in `beforeAll` proves the generated sources satisfy the rule.
    // This proves the rule is capable of rejecting anything at all, which a clean
    // run alone cannot distinguish from a misconfigured or unmatched rule.
    const modelPathInProject = join(root, "src", "core", "models", "wallet.model.ts");
    const original = await readFile(modelPathInProject, "utf8");
    try {
      await writeFile(
        modelPathInProject,
        `import { WalletEntity } from '../../infra/models/wallet-entity.model';

${original}`,
        "utf8",
      );

      const lint = await runFailingNpmScript(root, "lint");
      expect(lint.failed, lint.output).toBe(true);
      expect(lint.output).toContain("no-restricted-imports");
      expect(lint.output).toContain("Dependencies point inward");
    } finally {
      await writeFile(modelPathInProject, original, "utf8");
    }
  }, 120_000);

  it("serves the complete CRUD lifecycle over HTTP", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const identifier = randomUUID();
    const balance = 125.5;
    const replacementBalance = 250.75;
    const patchedBalance = 375.25;

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

    const conflict = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": "pt-BR" },
      body: JSON.stringify({ id: randomUUID(), balance }),
    });
    expect(conflict.status, running.output()).toBe(409);
    await expect(conflict.json()).resolves.toEqual({
      statusCode: 409,
      message: "Wallet já existe.",
    });

    const read = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(read.status, running.output()).toBe(200);
    await expect(read.json()).resolves.toEqual({ id: identifier, balance });

    const collection = await fetch(`${running.baseUrl}/wallets?page=0&size=20`);
    expect(collection.status, running.output()).toBe(200);
    await expect(collection.json()).resolves.toEqual({
      items: [{ id: identifier, balance }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });

    const replaced = await fetch(`${running.baseUrl}/wallets/${identifier}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ balance: replacementBalance }),
    });
    expect(replaced.status, running.output()).toBe(200);
    await expect(replaced.json()).resolves.toEqual({ id: identifier, balance: replacementBalance });

    const patched = await fetch(`${running.baseUrl}/wallets/${identifier}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ balance: patchedBalance }),
    });
    expect(patched.status, running.output()).toBe(200);
    await expect(patched.json()).resolves.toEqual({ id: identifier, balance: patchedBalance });

    const emptyPatch = await fetch(`${running.baseUrl}/wallets/${identifier}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(emptyPatch.status, running.output()).toBe(400);

    const filtered = await fetch(`${running.baseUrl}/wallets?filter=id:eq:${identifier}`);
    expect(filtered.status, running.output()).toBe(200);
    await expect(filtered.json()).resolves.toEqual({
      items: [{ id: identifier, balance: patchedBalance }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });

    const deleted = await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
    expect(deleted.status, running.output()).toBe(204);
    await expect(deleted.text()).resolves.toBe("");

    const deletedRead = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(deletedRead.status, running.output()).toBe(404);
    await expect(deletedRead.json()).resolves.toMatchObject({ statusCode: 404 });

    const repeatedDelete = await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
    expect(repeatedDelete.status, running.output()).toBe(404);
    await expect(repeatedDelete.json()).resolves.toMatchObject({ statusCode: 404 });

    const missing = await fetch(`${running.baseUrl}/wallets/${randomUUID()}`);
    expect(missing.status, running.output()).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ statusCode: 404 });
  }, 120_000);

  it("propagates collection sorting and composes it with filtering and pagination", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const wallets = [
      { id: "00000000-0000-4000-8000-000000000003", balance: 20 },
      { id: "00000000-0000-4000-8000-000000000001", balance: 10 },
      { id: "00000000-0000-4000-8000-000000000002", balance: 15 },
      { id: "00000000-0000-4000-8000-000000000004", balance: 30 },
    ];

    for (const wallet of wallets) {
      const response = await fetch(`${running.baseUrl}/wallets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(wallet),
      });
      expect(response.status, running.output()).toBe(201);
      await response.json();
    }

    const insertionOrder = await fetch(`${running.baseUrl}/wallets`);
    expect(insertionOrder.status, running.output()).toBe(200);
    await expect(insertionOrder.json()).resolves.toMatchObject({
      items: wallets,
    });

    const ascending = await fetch(`${running.baseUrl}/wallets?sort=balance:asc`);
    expect(ascending.status, running.output()).toBe(200);
    await expect(ascending.json()).resolves.toMatchObject({
      items: [wallets[1], wallets[2], wallets[0], wallets[3]],
    });

    const descending = await fetch(`${running.baseUrl}/wallets?sort=balance:desc`);
    expect(descending.status, running.output()).toBe(200);
    await expect(descending.json()).resolves.toMatchObject({
      items: [wallets[3], wallets[0], wallets[2], wallets[1]],
    });

    const repeated = await fetch(`${running.baseUrl}/wallets?sort=balance:asc&sort=id:desc`);
    expect(repeated.status, running.output()).toBe(200);
    await expect(repeated.json()).resolves.toMatchObject({
      items: [wallets[1], wallets[2], wallets[0], wallets[3]],
    });

    const filteredAndPaged = await fetch(
      `${running.baseUrl}/wallets?filter=balance:eq:15&sort=id:desc&page=0&size=1`,
    );
    expect(filteredAndPaged.status, running.output()).toBe(200);
    await expect(filteredAndPaged.json()).resolves.toEqual({
      items: [wallets[2]],
      page: 0,
      size: 1,
      totalItems: 1,
      totalPages: 1,
    });
  }, 120_000);

  it("returns the existing structured validation response for invalid collection sorting", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const cases = [
      { value: "balance", message: "sort must use the property:direction format" },
      { value: " balance:asc", message: "unsupported sort property:  balance" },
      { value: "unknown:asc", message: "unsupported sort property: unknown" },
      { value: "balance:sideways", message: "sort direction must be asc or desc" },
    ];

    for (const testCase of cases) {
      const query = new URLSearchParams({ sort: testCase.value });
      const response = await fetch(`${running.baseUrl}/wallets?${query.toString()}`);
      expect(response.status, running.output()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        statusCode: 400,
        message: "Validation failed",
        violations: [{ field: "sort[0]", message: testCase.message }],
      });
    }
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

    const rejectedPut = await fetch(`${running.baseUrl}/wallets/${randomUUID()}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ balance: "not-a-number" }),
    });
    expect(rejectedPut.status, running.output()).toBe(400);
    await expect(rejectedPut.json()).resolves.toMatchObject({ statusCode: 400 });

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
