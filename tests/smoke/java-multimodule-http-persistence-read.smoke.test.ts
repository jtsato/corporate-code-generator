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

describe("Java multi-module HTTP persistence read smoke test", () => {
  it("returns a persisted entity through the complete HTTP read path when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven HTTP persistence read smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      console.warn(message); skip(message); return;
    }
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-multimodule-http-persistence-read-smoke-"));
    try {
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", "examples/wallet-service/model.yaml", "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await testWithMaven(outputRoot, "*HttpPersistenceReadTests");
    } finally { await rm(outputRoot, { recursive: true, force: true }); }
  }, 300_000);

  it("serializes date and datetime fixtures with the configured Spring Boot Jackson stack", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven HTTP persistence read smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      console.warn(message); skip(message); return;
    }
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-multimodule-http-persistence-read-datetime-smoke-"));
    const modelPath = join(outputRoot, "model.yaml");
    try {
      await writeFile(modelPath, `schemaVersion: "1.0"\n\napplication:\n  name: schedule-service\n  namespace: io.github.jtsato.scheduleservice\n\nentities:\n  - name: Schedule\n    attributes:\n      - name: id\n        type: uuid\n        identifier: true\n        required: true\n      - name: scheduledOn\n        type: date\n        required: false\n      - name: processedAt\n        type: datetime\n        required: false\n`, "utf8");
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", modelPath, "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await testWithMaven(outputRoot, "*HttpPersistenceReadTests");
    } finally { await rm(outputRoot, { recursive: true, force: true }); }
  }, 300_000);
});
