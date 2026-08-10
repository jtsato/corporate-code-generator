import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { detectMaven, mutationTestWithMaven } from "./support/MavenSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

describe("Java multi-module mutation testing smoke test", () => {
  it("kills mutants in the generated use-case interactors when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven mutation smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      console.warn(message); skip(message); return;
    }
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-multimodule-mutation-smoke-"));
    try {
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", "examples/wallet-service/model.yaml", "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await mutationTestWithMaven(outputRoot, "mutation", "core");

      // The report path is asserted literally because the generated README and
      // the generated CI step both promise it; `timestampedReports` is false so
      // no dated subdirectory may appear between them.
      const reportDirectory = join(outputRoot, "core", "target", "pit-reports");
      await expect(access(join(reportDirectory, "index.html"))).resolves.toBeUndefined();

      // A PIT run that generated no mutations would still exit zero, so assert
      // that mutants were actually produced against the interactors and killed.
      const report = await readFile(join(reportDirectory, "mutations.xml"), "utf8");
      const killed = report.match(/status='KILLED'/g) ?? [];
      expect(killed.length).toBeGreaterThan(0);
      expect(report).toContain("UseCaseInteractor");
    } finally { await rm(outputRoot, { recursive: true, force: true }); }
  }, 600_000);
});
