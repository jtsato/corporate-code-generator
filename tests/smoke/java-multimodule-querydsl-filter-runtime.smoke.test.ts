import { execFile } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { detectMaven, testWithMaven } from "./support/MavenSmokeSupport.js";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

describe("Java multi-module Querydsl filter runtime smoke test", () => {
  it("applies generated Querydsl predicates through the gateway when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven Querydsl filter runtime smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      skip(message);
      return;
    }

    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-querydsl-filter-runtime-smoke-"));
    const modelPath = join(outputRoot, "model.yaml");
    try {
      await writeFile(modelPath, `schemaVersion: "1.0"

application:
  name: wallet-service
  namespace: io.github.jtsato.walletservice

entities:
  - name: Wallet
    attributes:
      - name: id
        type: uuid
        identifier: true
        required: true
      - name: balance
        type: decimal
        required: true
`, "utf8");
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", modelPath, "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await testWithMaven(outputRoot, "*QuerydslFilterPersistenceTests,*FindWalletsByFilterUseCaseInteractorTests");
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 300_000);
});
