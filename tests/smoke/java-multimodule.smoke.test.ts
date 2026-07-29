import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

describe("Java multi-module CLI smoke test", () => {
  it("generates the Maven reactor build capability", async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-multimodule-"));

    try {
      await execFileAsync(process.execPath, [
        cliEntryPoint,
        "generate",
        "examples/wallet-service/model.yaml",
        "--profile",
        "java-spring-clean-multimodule",
        "--module",
        "build",
        "--module",
        "core",
        "--module",
        "entrypoints-rest",
        "--output",
        outputRoot,
      ], { cwd: repoRoot });

      for (const targetPath of [
        "pom.xml",
        "core/pom.xml",
        "entrypoints/rest/pom.xml",
        "configuration/pom.xml",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
      ]) {
        const [generated, golden] = await Promise.all([
          readFile(join(outputRoot, ...targetPath.split("/")), "utf8"),
          readFile(join(
            repoRoot,
            "tests",
            "golden",
            "java-spring-clean-multimodule",
            targetPath.includes("entrypoints/rest/src") ? "entrypoints-rest" : targetPath.endsWith("Wallet.java") ? "core" : "build",
            ...targetPath.split("/"),
          ), "utf8"),
        ]);
        expect(normalizeLineEndings(generated)).toBe(normalizeLineEndings(golden));
      }
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });
});

function normalizeLineEndings(content: string): string {
  return content.replaceAll("\r\n", "\n");
}
