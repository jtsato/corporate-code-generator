import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");
const mavenExecutable = process.platform === "win32" ? "mvn.cmd" : "mvn";
const compileTimeoutMs = 300_000;

describe("Maven compile smoke test", () => {
  it("compiles the complete generated project when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    const maven = await detectMaven();
    if (!maven.available) {
      const message = "Maven smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") {
        throw new Error(message);
      }
      console.warn(message);
      skip(message);
      return;
    }

    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-maven-smoke-"));
    try {
      const generation = await execFileAsync(process.execPath, [
        cliEntryPoint,
        "generate",
        "examples/wallet-service/model.yaml",
        "--profile",
        "java-spring-clean",
        "--output",
        outputRoot,
      ], { cwd: repoRoot });
      expect(generation).toBeDefined();

      try {
        await execFileAsync(mavenExecutable, ["compile"], {
          cwd: outputRoot,
          timeout: compileTimeoutMs,
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (error) {
        const failure = error as { code?: string | number; stdout?: string; stderr?: string; killed?: boolean };
        if (failure.killed || failure.code === "ETIMEDOUT") {
          throw new Error(`Maven compilation exceeded the ${compileTimeoutMs}ms timeout.\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
        }
        throw new Error(`Maven compilation failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
      }
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });
});

async function detectMaven(): Promise<{ readonly available: boolean }> {
  try {
    await execFileAsync(mavenExecutable, ["-version"], {
      cwd: repoRoot,
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return { available: true };
  } catch (error) {
    const failure = error as { readonly code?: string | number };
    if (failure.code === "ENOENT" || (process.platform === "win32" && failure.code === "EINVAL")) return { available: false };
    throw new Error(`Maven was found but 'mvn -version' failed (code ${String(failure.code ?? "unknown")}).`);
  }
}
