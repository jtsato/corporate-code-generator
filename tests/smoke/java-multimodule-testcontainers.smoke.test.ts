import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { detectDocker, detectMaven, integrationTestWithMaven } from "./support/MavenSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

describe("Java multi-module Testcontainers smoke test", () => {
  it("verifies the generated persistence provider against a real database when Docker is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Testcontainers smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      console.warn(message); skip(message); return;
    }
    const docker = await detectDocker();
    if (!docker.available) {
      const message = `Testcontainers smoke skipped: ${docker.reason} Set CODEGEN_REQUIRE_DOCKER_SMOKE=true to require Docker.`;
      if (process.env.CODEGEN_REQUIRE_DOCKER_SMOKE === "true") throw new Error(message);
      console.warn(message); skip(message); return;
    }
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-multimodule-testcontainers-smoke-"));
    try {
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", "examples/wallet-service/model.yaml", "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await integrationTestWithMaven(outputRoot, "integration-test", "infra/database");

      // Failsafe reports success even when it selected no tests, so assert the
      // report exists and that the container-backed test methods actually ran.
      const report = await readFile(
        join(outputRoot, "infra", "database", "target", "failsafe-reports", "TEST-io.github.jtsato.walletservice.infra.database.domains.wallet.WalletGatewayProviderIT.xml"),
        "utf8",
      );
      expect(report).toContain('errors="0"');
      expect(report).toContain('failures="0"');
      expect(report).toContain("shouldCreateAndReadRecordOnTheContainerDatabase");
    } finally { await rm(outputRoot, { recursive: true, force: true }); }
  }, 900_000);
});
