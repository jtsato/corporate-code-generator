import { execFile } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { detectMaven, testWithMaven } from "./support/MavenSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

describe("Java multi-module HTTP update smoke test", () => {
  it("updates an existing entity and exercises HTTP error handling when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven HTTP update smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      console.warn(message);
      skip(message);
      return;
    }
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-multimodule-http-update-smoke-"));
    try {
      await execFileAsync(process.execPath, [
        cliEntryPoint,
        "generate",
        "examples/wallet-service/model.yaml",
        "--profile",
        "java-spring-clean-multimodule",
        "--output",
        outputRoot,
      ], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await testWithMaven(outputRoot, "*HttpUpdateTests");
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 300_000);
});
