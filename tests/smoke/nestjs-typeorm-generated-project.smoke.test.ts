/**
 * Generated-project execution gate for the TypeORM persistence option.
 *
 * `nestjs-typeorm-persistence.smoke.test.ts` compares the option's output against
 * approved goldens: it proves the generator renders what was reviewed. This suite
 * proves the rendered project installs, compiles, and serves the same REST
 * contract through a real SQL engine — which is the whole claim of the option and
 * the one thing a byte comparison cannot make.
 *
 * The database is SQLite running inside the application process, selected by
 * `.env.test`. That is why this needs no container runtime and no provisioned
 * server, and also the honest limit of what it proves: PostgreSQL is the
 * configured runtime and nothing here connects to one. The entity and the
 * repository are written to the subset both engines accept precisely because this
 * gate cannot see where they differ.
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
  spawnGeneratedNodeServer,
  stopGeneratedNodeServer,
  runNpmScript,
  type GeneratedServer,
} from "./support/NpmSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture";
// The same model the in-memory execution gate uses, so the two suites are
// directly comparable. It marks `balance` unique, which is what lets this gate
// exercise the interaction between soft delete and active uniqueness.
const modelPath = "examples/wallet-service/model.yaml";

let projectRoot: string | undefined;
let server: GeneratedServer | undefined;
let skipReason: string | undefined;

describe("NestJS TypeORM generated project smoke test", () => {
  beforeAll(async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    projectRoot = await mkdtemp(join(tmpdir(), "ccg-nestjs-typeorm-project-"));
    await execFileAsync(
      process.execPath,
      [
        cliEntryPoint, "generate", modelPath, "--profile", profileId,
        "--option", "persistence=typeorm", "--output", projectRoot,
      ],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    );

    const registry = await detectNpmRegistry(projectRoot);
    if (!registry.available) {
      const message = `NestJS TypeORM generated project smoke skipped: ${registry.reason} Set CODEGEN_REQUIRE_NPM_SMOKE=true to require npm registry access.`;
      if (process.env["CODEGEN_REQUIRE_NPM_SMOKE"] === "true") throw new Error(message);
      console.warn(message);
      skipReason = message;
      return;
    }

    await installNpmDependencies(projectRoot);
    await runNpmScript(projectRoot, "lint");
    await runNpmScript(projectRoot, "build");
    // The generated repository suite lives here: it drives the TypeORM repository
    // against SQLite rather than against a mock.
    await runNpmScript(projectRoot, "test");
    await runNpmScript(projectRoot, "test:e2e");

    const port = await reserveEphemeralPort();
    server = spawnGeneratedNodeServer({
      cwd: projectRoot,
      entryPoint: "dist/main.js",
      port,
      // `.env.development` names a PostgreSQL a test machine is not required to
      // run. `.env.test` selects the in-process engine instead.
      env: { NODE_ENV: "test" },
    });
    await awaitServerReadiness(server);
  }, 1_020_000);

  afterAll(async () => {
    await stopGeneratedNodeServer(server);
    await removeGeneratedProject(projectRoot);
  }, 120_000);

  it("installs the ORM packages the option declares and no native database driver", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const root = projectRoot as string;

    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
      readonly dependencies: Record<string, string>;
      readonly devDependencies: Record<string, string>;
    };

    expect(Object.keys(manifest.dependencies)).toEqual(expect.arrayContaining(["typeorm", "@nestjs/typeorm", "pg"]));
    // The test engine is a development dependency: the runtime image prunes it,
    // and production talks to PostgreSQL.
    expect(Object.keys(manifest.devDependencies)).toContain("sql.js");
    // `better-sqlite3` would need a compiled binary, and npm no longer runs
    // install scripts unattended, so `npm install && npm test` could fail on a
    // machine that has no toolchain. Nothing here may reintroduce that.
    expect(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })).not.toContain("better-sqlite3");
  }, 30_000);

  it("serves the complete CRUD lifecycle through the database", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const identifier = randomUUID();
    const balance = 125.5;

    const created = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: identifier, balance }),
    });
    expect(created.status, running.output()).toBe(201);
    // A `numeric` column comes back from some drivers as a string. The generated
    // transformer is what keeps this a number rather than "125.5".
    await expect(created.json()).resolves.toEqual({ id: identifier, balance });

    const conflict = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: identifier, balance }),
    });
    expect(conflict.status, running.output()).toBe(409);
    await conflict.json();

    const read = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(read.status, running.output()).toBe(200);
    await expect(read.json()).resolves.toEqual({ id: identifier, balance });

    const replaced = await fetch(`${running.baseUrl}/wallets/${identifier}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ balance: 250.75 }),
    });
    expect(replaced.status, running.output()).toBe(200);
    await expect(replaced.json()).resolves.toEqual({ id: identifier, balance: 250.75 });

    const patched = await fetch(`${running.baseUrl}/wallets/${identifier}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ balance: 375.25 }),
    });
    expect(patched.status, running.output()).toBe(200);
    await expect(patched.json()).resolves.toEqual({ id: identifier, balance: 375.25 });

    const deleted = await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
    expect(deleted.status, running.output()).toBe(204);
    await expect(deleted.text()).resolves.toBe("");

    const missing = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(missing.status, running.output()).toBe(404);
    await missing.json();
  }, 120_000);

  it("returns the same paging, sorting and filtering contract the in-memory option does", async ({ skip }) => {
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

    // Sorting by the identifier has to survive the total-order tiebreaker the
    // repository appends, which is a tiebreaker on that very column.
    const byIdentifier = await fetch(`${running.baseUrl}/wallets?sort=id:desc`);
    expect(byIdentifier.status, running.output()).toBe(200);
    await expect(byIdentifier.json()).resolves.toMatchObject({
      items: [wallets[3], wallets[0], wallets[2], wallets[1]],
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

    const pages = await Promise.all([0, 1].map(async (page) => {
      const response = await fetch(`${running.baseUrl}/wallets?page=${String(page)}&size=2&sort=balance:asc`);
      expect(response.status, running.output()).toBe(200);
      return (await response.json()) as { readonly items: readonly { readonly id: string }[] };
    }));
    const identifiers = pages.flatMap((page) => page.items.map((item) => item.id));
    expect(new Set(identifiers).size, "pages must not repeat a row").toBe(identifiers.length);
  }, 120_000);

  it("rejects an unsupported filter field before it can reach SQL", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;

    const injected = await fetch(
      `${running.baseUrl}/wallets?${new URLSearchParams({ filter: "id) OR 1=1 --:eq:x" }).toString()}`,
    );

    expect(injected.status, running.output()).toBe(400);
    await expect(injected.json()).resolves.toMatchObject({ statusCode: 400 });
  }, 30_000);

  it("retains a deleted record, exposes it through the deleted routes, and restores it", async ({ skip }) => {
    if (skipReason !== undefined) { skip(skipReason); return; }
    const running = server as GeneratedServer;
    const identifier = randomUUID();
    const balance = 917.25;

    const created = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: identifier, balance }),
    });
    expect(created.status, running.output()).toBe(201);
    await created.json();

    const deleted = await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
    expect(deleted.status, running.output()).toBe(204);

    // Hidden from the active routes, not gone from the store.
    const active = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(active.status, running.output()).toBe(404);
    await active.json();

    const tombstone = await fetch(`${running.baseUrl}/wallets/deleted/${identifier}`);
    expect(tombstone.status, running.output()).toBe(200);
    const tombstoneBody = (await tombstone.json()) as { readonly id: string; readonly balance: number; readonly deletedAt: string };
    expect(tombstoneBody.id).toBe(identifier);
    expect(tombstoneBody.balance).toBe(balance);
    expect(Number.isNaN(Date.parse(tombstoneBody.deletedAt)), tombstoneBody.deletedAt).toBe(false);

    // `/deleted` is declared before `/:id`. Were the order reversed this would be
    // a 400 for an identifier that does not parse, not a page.
    const deletedPage = await fetch(`${running.baseUrl}/wallets/deleted?page=0&size=50`);
    expect(deletedPage.status, running.output()).toBe(200);
    const deletedPageBody = (await deletedPage.json()) as { readonly items: readonly { readonly id: string }[] };
    expect(deletedPageBody.items.some((item) => item.id === identifier)).toBe(true);

    // A unique value is released while its row is deleted, which is the whole
    // reason a tombstone is not simply a reserved identifier.
    const reuse = await fetch(`${running.baseUrl}/wallets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: randomUUID(), balance }),
    });
    expect(reuse.status, running.output()).toBe(201);
    const reused = (await reuse.json()) as { readonly id: string };

    // And restoring is then refused, because the value it held is taken.
    const blockedRestore = await fetch(`${running.baseUrl}/wallets/${identifier}/restore`, { method: "POST" });
    expect(blockedRestore.status, running.output()).toBe(409);
    await blockedRestore.json();

    // Free the value again and the same restore succeeds.
    const removedReuse = await fetch(`${running.baseUrl}/wallets/${reused.id}`, { method: "DELETE" });
    expect(removedReuse.status, running.output()).toBe(204);

    const restored = await fetch(`${running.baseUrl}/wallets/${identifier}/restore`, { method: "POST" });
    expect(restored.status, running.output()).toBe(204);
    await expect(restored.text()).resolves.toBe("");

    const readBack = await fetch(`${running.baseUrl}/wallets/${identifier}`);
    expect(readBack.status, running.output()).toBe(200);
    await expect(readBack.json()).resolves.toEqual({ id: identifier, balance });

    // Restoring an active record is a refusal, not an absence.
    const repeatedRestore = await fetch(`${running.baseUrl}/wallets/${identifier}/restore`, { method: "POST" });
    expect(repeatedRestore.status, running.output()).toBe(409);
    await repeatedRestore.json();

    const unknownRestore = await fetch(`${running.baseUrl}/wallets/${randomUUID()}/restore`, { method: "POST" });
    expect(unknownRestore.status, running.output()).toBe(404);
    await unknownRestore.json();

    // Clean up so later cases see the collection they expect.
    await fetch(`${running.baseUrl}/wallets/${identifier}`, { method: "DELETE" });
  }, 120_000);

});
