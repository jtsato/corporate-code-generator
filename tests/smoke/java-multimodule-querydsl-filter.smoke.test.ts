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

describe("Java multi-module Querydsl filter smoke test", () => {
  it("compiles entity-aware Querydsl filter definitions when Maven is available", async ({ skip }) => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const maven = await detectMaven(repoRoot);
    if (!maven.available) {
      const message = "Maven Querydsl filter smoke skipped: Maven executable was not found. Set CODEGEN_REQUIRE_MAVEN_SMOKE=true to require Maven.";
      if (process.env.CODEGEN_REQUIRE_MAVEN_SMOKE === "true") throw new Error(message);
      skip(message);
      return;
    }

    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-querydsl-filter-smoke-"));
    const modelPath = join(outputRoot, "model.yaml");
    try {
      await writeFile(modelPath, `schemaVersion: "1.0"

application:
  name: schedule-service
  namespace: io.github.jtsato.scheduleservice

entities:
  - name: Schedule
    attributes:
      - name: id
        type: uuid
        identifier: true
        required: true
      - name: title
        type: string
        required: true
      - name: active
        type: boolean
        required: true
      - name: priority
        type: int32
        required: true
      - name: sequence
        type: int64
        required: true
      - name: amount
        type: decimal
        required: true
      - name: scheduledFor
        type: date
        required: true
      - name: startsAt
        type: datetime
        required: true
`, "utf8");
      await execFileAsync(process.execPath, [cliEntryPoint, "generate", modelPath, "--profile", "java-spring-clean-multimodule", "--output", outputRoot], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      await testWithMaven(outputRoot, "*QuerydslFilterDefinitionTests");
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 300_000);
});
