/**
 * Module boundary gate for the NestJS Golden Path.
 *
 * Milestone 7.16 (ADR-081) fixed two artifacts that the template-pack manifest
 * assigned to `web-api` while their imports depended on modules `web-api` does not
 * declare in `requires`. The full profile hid the defect, because the composition
 * root pulls in every module; only a single-module selection exposed it, and the
 * check that found it was manual.
 *
 * This suite makes that check automatic. For every module the profile declares, it
 * generates that selection alone and resolves every relative import in the produced
 * TypeScript against the files that selection actually produces. An artifact placed
 * in a module whose dependency closure cannot satisfy its imports fails here.
 *
 * It also asserts the inward dependency direction on the full profile, which the
 * generated ESLint configuration enforces for a consumer but nothing enforced for
 * the generator itself.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/nestjs-wallet-service/model.yaml";

/** Every module the profile declares, so a new module cannot silently skip this gate. */
const MODULE_IDS = ["build", "core", "infra-persistence", "web-api", "bootstrap"] as const;

/**
 * Layers that must never appear in an import from the keyed layer. The composition
 * root is absent on purpose: seeing every layer is precisely its role.
 */
const FORBIDDEN_LAYER_IMPORTS = new Map<string, readonly string[]>([
  ["src/core/", ["/infra/", "/web-api/", "/modules/", "/app.module"]],
  ["src/infra/", ["/web-api/", "/modules/", "/app.module"]],
  ["src/web-api/", ["/infra/", "/modules/", "/app.module"]],
]);

async function generate(moduleId: string | undefined): Promise<string> {
  const outputRoot = await mkdtemp(join(tmpdir(), "ccg-nest-boundary-"));
  const args = [cliEntryPoint, "generate", modelPath, "--profile", profileId, "--output", outputRoot];
  if (moduleId !== undefined) args.push("--module", moduleId);
  await execFileAsync(process.execPath, args, { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
  return outputRoot;
}

async function listFiles(root: string, prefix = ""): Promise<readonly string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const collected: string[] = [];
  for (const entry of entries) {
    const child = prefix === "" ? entry.name : posix.join(prefix, entry.name);
    if (entry.isDirectory()) collected.push(...(await listFiles(root, child)));
    else collected.push(child);
  }
  return collected;
}

/**
 * Matches `from '…'`, bare `import '…'`, and `export … from '…'`. Deliberately a
 * regex rather than a TypeScript parse: the assertion is about which paths are
 * named, and a parser would add a dependency for no extra reach.
 */
function relativeImportsOf(source: string): readonly string[] {
  const specifiers: string[] = [];
  for (const match of source.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (specifier !== undefined && specifier.startsWith(".")) specifiers.push(specifier);
  }
  return specifiers;
}

async function resolvesWithin(root: string, importingFile: string, specifier: string): Promise<boolean> {
  const base = resolve(join(root, dirname(importingFile)), specifier);
  for (const candidate of [`${base}.ts`, join(base, "index.ts"), base]) {
    try {
      if ((await stat(candidate)).isFile()) return true;
    } catch {
      // Candidate absent; try the next spelling.
    }
  }
  return false;
}

describe("NestJS module boundary smoke test", () => {
  it.each(MODULE_IDS)("resolves every relative import inside the %s selection", async (moduleId) => {
    const outputRoot = await generate(moduleId);
    try {
      const files = (await listFiles(outputRoot)).filter((file) => file.endsWith(".ts"));

      const unresolved: string[] = [];
      for (const file of files) {
        const source = await readFile(join(outputRoot, file), "utf8");
        for (const specifier of relativeImportsOf(source)) {
          if (!(await resolvesWithin(outputRoot, file, specifier))) unresolved.push(`${file} -> ${specifier}`);
        }
      }

      expect(unresolved, `Unresolved imports in the '${moduleId}' selection`).toEqual([]);
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it("keeps the full profile's dependency direction pointing inward", async () => {
    const outputRoot = await generate(undefined);
    try {
      const files = (await listFiles(outputRoot)).filter((file) => file.endsWith(".ts"));
      const violations: string[] = [];

      for (const file of files) {
        const layer = [...FORBIDDEN_LAYER_IMPORTS.keys()].find((prefix) => file.startsWith(prefix));
        if (layer === undefined) continue;

        const source = await readFile(join(outputRoot, file), "utf8");
        for (const specifier of relativeImportsOf(source)) {
          const target = `/${relative(repoRoot, resolve(join(outputRoot, dirname(file)), specifier)).replaceAll("\\", "/")}`;
          for (const forbidden of FORBIDDEN_LAYER_IMPORTS.get(layer) ?? []) {
            if (target.includes(forbidden)) violations.push(`${file} -> ${specifier}`);
          }
        }
      }

      expect(violations).toEqual([]);
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it("covers every module the profile declares", async () => {
    const profile = await readFile(join(repoRoot, "profiles", profileId, "profile.yaml"), "utf8");
    const declared = [...profile.matchAll(/^\s{2}-\sid:\s(\S+)$/gm)].map((match) => match[1]);

    expect(new Set(declared)).toEqual(new Set(MODULE_IDS));
  });
});
