/**
 * Golden and layout gate for the NestJS multi-module profile.
 *
 * The multi-module profile is a *layout* variant, not a different capability
 * set: it emits the same artifacts as `nestjs-clean-architecture`, one npm
 * workspace package per module instead of one folder per module. Its template
 * pack borrows every source template from the single-package pack rather than
 * copying them, so the two layouts cannot drift apart in content — only in where
 * an artifact lands and in how one layer names another.
 *
 * That is the property this suite protects. It asserts the two profiles emit the
 * same artifact set under a path rewrite, that no source file is left behind,
 * and that a cross-layer import is a package name here where it is a relative
 * path there.
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
const singleProfileId = "nestjs-clean-architecture";
const multiProfileId = "nestjs-clean-architecture-multimodule";
const modelPath = "examples/nestjs-wallet-service/model.yaml";
const goldenRoot = join(repoRoot, "tests", "golden", multiProfileId);

/** Every module the multi-module profile declares, as a workspace package. */
const PACKAGES = ["core", "infra-persistence", "web-api", "bootstrap"] as const;

/**
 * Build artifacts that exist in one layout and not the other. Workspaces need a
 * root manifest and a shared compiler baseline; a folder layout needs neither,
 * and its single `tsconfig.build.json` has no counterpart once each package
 * carries its own configuration.
 */
const SINGLE_ONLY_PATHS = ["tsconfig.json", "tsconfig.build.json"] as const;
const MULTI_ONLY_PATHS = ["tsconfig.base.json", "tsconfig.spec.json"] as const;

const dotlessGoldenPaths = new Map([
  [".gitignore", "gitignore"],
  [".dockerignore", "dockerignore"],
  [".env.example", "env.example"],
  [".env.development", "env.development"],
  [".env.test", "env.test"],
  [".env.production", "env.production"],
]);

function goldenModule(targetPath: string): string {
  for (const workspacePackage of PACKAGES) {
    if (targetPath.startsWith(`packages/${workspacePackage}/`)) return workspacePackage;
  }
  return "build";
}

/** The rewrite the multi-module manifest applies to every inherited artifact. */
function multiModulePathOf(singlePath: string): string {
  const packageOf: Readonly<Record<string, string>> = {
    core: "core", infra: "infra-persistence", "web-api": "web-api",
  };

  for (const [folder, workspacePackage] of Object.entries(packageOf)) {
    if (singlePath.startsWith(`src/${folder}/`)) {
      return `packages/${workspacePackage}/src/${singlePath.slice(`src/${folder}/`.length)}`;
    }
  }
  if (singlePath.startsWith("src/modules/") || singlePath.startsWith("src/config/")) {
    return `packages/bootstrap/${singlePath}`;
  }
  if (singlePath === "src/main.ts" || singlePath === "src/app.module.ts") {
    return `packages/bootstrap/${singlePath}`;
  }
  if (singlePath === "nest-cli.json") return "packages/bootstrap/nest-cli.json";
  if (singlePath.startsWith("test/")) return `packages/bootstrap/${singlePath}`;
  return singlePath;
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

async function generate(root: string, profileId: string, args: readonly string[] = []): Promise<void> {
  await execFileAsync(
    process.execPath,
    [cliEntryPoint, "generate", modelPath, "--profile", profileId, ...args, "--output", root],
    { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
  );
}

let singleRoot: string;
let multiRoot: string;

describe("NestJS multi-module smoke test", () => {
  beforeAll(async () => {
    singleRoot = await mkdtemp(join(tmpdir(), "ccg-nest-single-"));
    multiRoot = await mkdtemp(join(tmpdir(), "ccg-nest-multi-"));

    await generate(singleRoot, singleProfileId);
    await generate(multiRoot, multiProfileId);
  }, 60_000);

  afterAll(async () => {
    await rm(singleRoot, { recursive: true, force: true });
    await rm(multiRoot, { recursive: true, force: true });
  });

  it("emits the same artifacts as the single-package profile, relocated", async () => {
    const single = await listRelativeFiles(singleRoot);
    const multi = new Set(await listRelativeFiles(multiRoot));

    // A layout variant that quietly dropped an artifact would still build and
    // still pass a golden comparison against its own tree. Only a comparison
    // against the other profile catches it.
    const missing = single
      .filter((path) => !(SINGLE_ONLY_PATHS as readonly string[]).includes(path))
      .map((path) => ({ from: path, to: multiModulePathOf(path) }))
      .filter((entry) => !multi.has(entry.to));

    expect(missing).toEqual([]);
  });

  it("adds only the scaffolding a workspace needs", async () => {
    const single = new Set(
      (await listRelativeFiles(singleRoot)).map((path) => multiModulePathOf(path)),
    );
    const extra = (await listRelativeFiles(multiRoot)).filter((path) => !single.has(path));

    // Each package's own manifest and compiler configuration, plus the root
    // workspace files. Anything else is an artifact nobody decided to add.
    expect(extra.sort()).toEqual([
      ...MULTI_ONLY_PATHS,
      ...PACKAGES.flatMap((name) => [
        `packages/${name}/package.json`,
        `packages/${name}/tsconfig.json`,
      ]),
    ].sort());
  });

  it("names another layer by package rather than by relative path", async () => {
    const controller = await readFile(
      join(multiRoot, "packages/web-api/src/entrypoints/wallets/wallet.controller.ts"), "utf8",
    );
    const provider = await readFile(
      join(multiRoot, "packages/infra-persistence/src/providers/create-wallet.provider.ts"), "utf8",
    );

    expect(controller).toContain("from '@wallet-service/core/");
    expect(provider).toContain("from '@wallet-service/core/");
    // The depth-dependent relative hop is exactly what the package name replaces.
    expect(controller).not.toContain("../../../core/");
    expect(provider).not.toContain("../../core/");
    // Imports inside a package stay relative, because nothing is crossed.
    expect(controller).toContain("from './wallet-response.model'");
  });

  it("declares the dependency direction where npm can enforce it", async () => {
    const manifests = await Promise.all(PACKAGES.map(async (name) => ({
      name,
      manifest: JSON.parse(
        await readFile(join(multiRoot, `packages/${name}/package.json`), "utf8"),
      ) as { readonly dependencies?: Record<string, string> },
    })));

    const dependenciesOf = (name: string): readonly string[] =>
      Object.keys(manifests.find((entry) => entry.name === name)?.manifest.dependencies ?? {});

    // The Core declares nothing at all: the same claim the boundary lint makes,
    // expressed where the package manager can act on it.
    expect(dependenciesOf("core")).toEqual([]);
    expect(dependenciesOf("infra-persistence")).toContain("@wallet-service/core");
    expect(dependenciesOf("infra-persistence")).not.toContain("@wallet-service/web-api");
    expect(dependenciesOf("web-api")).toContain("@wallet-service/core");
    expect(dependenciesOf("web-api")).not.toContain("@wallet-service/infra-persistence");
    // Only the composition root sees every package.
    for (const name of ["core", "infra-persistence", "web-api"]) {
      expect(dependenciesOf("bootstrap")).toContain(`@wallet-service/${name}`);
    }
  });

  it("orders the reference build so each package compiles after what it needs", async () => {
    const references = await Promise.all(PACKAGES.map(async (name) => ({
      name,
      tsconfig: JSON.parse(
        await readFile(join(multiRoot, `packages/${name}/tsconfig.json`), "utf8"),
      ) as { readonly references?: readonly { readonly path: string }[] },
    })));

    const referencesOf = (name: string): readonly string[] =>
      (references.find((entry) => entry.name === name)?.tsconfig.references ?? [])
        .map((reference) => reference.path.replace("../", ""));

    expect(referencesOf("core")).toEqual([]);
    expect(referencesOf("infra-persistence")).toEqual(["core"]);
    expect(referencesOf("web-api")).toEqual(["core"]);
    expect(referencesOf("bootstrap")).toEqual(["core", "infra-persistence", "web-api"]);
  });

  it("resolves package names to sources for the test run", async () => {
    // Unit tests run against sources rather than build output, so the suite needs
    // no prior build. Both the runtime resolution and the type resolution have to
    // agree about that, and they are configured in different files.
    const manifest = JSON.parse(await readFile(join(multiRoot, "package.json"), "utf8")) as {
      readonly jest: { readonly moduleNameMapper: Record<string, string> };
      readonly workspaces: readonly string[];
    };
    const specConfig = JSON.parse(await readFile(join(multiRoot, "tsconfig.spec.json"), "utf8")) as {
      readonly compilerOptions: { readonly paths: Record<string, readonly string[]> };
    };

    expect(manifest.workspaces).toEqual(["packages/*"]);
    expect(Object.values(manifest.jest.moduleNameMapper)).toEqual(
      ["<rootDir>/packages/$1/src/$2"],
    );
    for (const name of PACKAGES) {
      expect(specConfig.compilerOptions.paths[`@wallet-service/${name}/*`])
        .toEqual([`packages/${name}/src/*`]);
    }
  });

  it("matches the approved golden for every generated artifact", async () => {
    const generated = await listRelativeFiles(multiRoot);
    expect(generated.length).toBeGreaterThan(0);

    for (const path of generated) {
      const content = await readFile(join(multiRoot, path), "utf8");
      const golden = await readFile(
        join(goldenRoot, goldenModule(path), dotlessGoldenPaths.get(path) ?? path),
        "utf8",
      );
      expect(normalize(content), path).toBe(normalize(golden));
    }
  }, 30_000);

  it("renders the same layout under the TypeORM option", async () => {
    const root = await mkdtemp(join(tmpdir(), "ccg-nest-multi-typeorm-"));
    try {
      await generate(root, multiProfileId, ["--option", "persistence=typeorm"]);

      const infraManifest = JSON.parse(
        await readFile(join(root, "packages/infra-persistence/package.json"), "utf8"),
      ) as { readonly dependencies: Record<string, string> };

      // The option reaches the package that owns persistence and no other.
      expect(Object.keys(infraManifest.dependencies)).toContain("typeorm");
      const coreManifest = JSON.parse(
        await readFile(join(root, "packages/core/package.json"), "utf8"),
      ) as { readonly dependencies?: Record<string, string> };
      expect(Object.keys(coreManifest.dependencies ?? {})).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
