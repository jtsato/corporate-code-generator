import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = join(repoRoot, "packages", "cli", "dist", "index.js");

interface CommandResult { readonly code: number; readonly stdout: string; readonly stderr: string; }

async function runCli(args: readonly string[]): Promise<CommandResult> {
  try {
    const result = await execFileAsync(process.execPath, [cliEntryPoint, ...args], { cwd: repoRoot });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: typeof failure.code === "number" ? failure.code : 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" };
  }
}

function normalizeLineEndings(content: string): string {
  return content.replaceAll("\r\n", "\n");
}

describe("CLI smoke test", () => {
  it("validates, previews, and generates the wallet Golden Path", async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    const dryRunRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-dry-"));
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-output-"));
    const partialRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-partial-"));
    const buildRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-build-"));
    const bootstrapRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-bootstrap-"));
    const restRoot = await mkdtemp(join(tmpdir(), "ccg-smoke-rest-"));
    try {
      const model = "examples/wallet-service/model.yaml";
      const common = ["generate", model, "--profile", "java-spring-clean"];

      const validation = await runCli(["validate", model]);
      expect(validation.code).toBe(0);

      const dryRun = await runCli([...common, "--dry-run"]);
      expect(dryRun.code).toBe(0);
      expect(dryRun.stdout).toContain("CREATE pom.xml");
      expect(dryRun.stdout).toContain("CREATE src/main/java/io/github/jtsato/walletservice/domain/Wallet.java");
      expect(dryRun.stdout).toContain("CREATE src/main/java/io/github/jtsato/walletservice/application/WalletService.java");
      expect(dryRun.stdout).toContain("CREATE src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java");
      expect(dryRun.stdout).toContain("CREATE src/main/java/io/github/jtsato/walletservice/api/WalletController.java");
      expect(dryRun.stdout).toContain("CREATE src/main/java/io/github/jtsato/walletservice/api/WalletResponse.java");
      await expect(readdir(dryRunRoot)).resolves.toEqual([]);

      const generation = await runCli([...common, "--output", outputRoot]);
      expect(generation.code).toBe(0);

      const generatedPath = join(outputRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "domain", "Wallet.java");
      const goldenPath = join(repoRoot, "tests", "golden", "java-spring-clean", "domain", "Wallet.java");
      const [generated, golden] = await Promise.all([readFile(generatedPath, "utf8"), readFile(goldenPath, "utf8")]);
      expect(normalizeLineEndings(generated)).toBe(normalizeLineEndings(golden));

      const generatedServicePath = join(outputRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "application", "WalletService.java");
      const serviceGoldenPath = join(repoRoot, "tests", "golden", "java-spring-clean", "application", "WalletService.java");
      const [generatedService, serviceGolden] = await Promise.all([readFile(generatedServicePath, "utf8"), readFile(serviceGoldenPath, "utf8")]);
      expect(normalizeLineEndings(generatedService)).toBe(normalizeLineEndings(serviceGolden));

      const generatedBootstrap = await readFile(join(outputRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "WalletServiceApplication.java"), "utf8");
      const goldenBootstrap = await readFile(join(repoRoot, "tests", "golden", "java-spring-clean", "bootstrap", "WalletServiceApplication.java"), "utf8");
      expect(normalizeLineEndings(generatedBootstrap)).toBe(normalizeLineEndings(goldenBootstrap));

      const generatedController = await readFile(join(outputRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "api", "WalletController.java"), "utf8");
      const goldenController = await readFile(join(repoRoot, "tests", "golden", "java-spring-clean", "api-rest", "WalletController.java"), "utf8");
      expect(normalizeLineEndings(generatedController)).toBe(normalizeLineEndings(goldenController));

      const generatedResponse = await readFile(join(outputRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "api", "WalletResponse.java"), "utf8");
      const goldenResponse = await readFile(join(repoRoot, "tests", "golden", "java-spring-clean", "api-rest", "WalletResponse.java"), "utf8");
      expect(normalizeLineEndings(generatedResponse)).toBe(normalizeLineEndings(goldenResponse));

      const generatedPom = await readFile(join(outputRoot, "pom.xml"), "utf8");
      const goldenPom = await readFile(join(repoRoot, "tests", "golden", "java-spring-clean", "build", "pom.xml"), "utf8");
      expect(normalizeLineEndings(generatedPom)).toBe(normalizeLineEndings(goldenPom));

      const buildOnly = await runCli([...common, "--module", "build", "--output", buildRoot]);
      expect(buildOnly.code).toBe(0);
      await expect(readFile(join(buildRoot, "pom.xml"), "utf8")).resolves.not.toContain("spring-boot-starter-web");
      await expect(readFile(join(buildRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "domain", "Wallet.java"))).rejects.toMatchObject({ code: "ENOENT" });

      const bootstrapOnly = await runCli([...common, "--module", "bootstrap", "--output", bootstrapRoot]);
      expect(bootstrapOnly.code).toBe(0);
      await expect(readFile(join(bootstrapRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "WalletServiceApplication.java"))).resolves.toBeTruthy();
      await expect(readFile(join(bootstrapRoot, "pom.xml"))).rejects.toMatchObject({ code: "ENOENT" });

      const partial = await runCli([...common, "--module", "domain", "--output", partialRoot]);
      expect(partial.code).toBe(0);
      await expect(readFile(join(partialRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "domain", "Wallet.java"))).resolves.toBeTruthy();
      await expect(readFile(join(partialRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "application", "WalletService.java"))).rejects.toMatchObject({ code: "ENOENT" });

      const restOnly = await runCli([...common, "--module", "api-rest", "--output", restRoot]);
      expect(restOnly.code).toBe(0);
      await expect(readFile(join(restRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "domain", "Wallet.java"))).resolves.toBeTruthy();
      await expect(readFile(join(restRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "application", "WalletService.java"))).resolves.toBeTruthy();
      await expect(readFile(join(restRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "api", "WalletController.java"))).resolves.toBeTruthy();
      await expect(readFile(join(restRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "api", "WalletResponse.java"))).resolves.toBeTruthy();
      await expect(readFile(join(restRoot, "src", "main", "java", "io", "github", "jtsato", "walletservice", "WalletServiceApplication.java"))).rejects.toMatchObject({ code: "ENOENT" });
      await expect(readFile(join(restRoot, "pom.xml"))).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dryRunRoot, { recursive: true, force: true });
      await rm(outputRoot, { recursive: true, force: true });
      await rm(partialRoot, { recursive: true, force: true });
      await rm(buildRoot, { recursive: true, force: true });
      await rm(bootstrapRoot, { recursive: true, force: true });
      await rm(restRoot, { recursive: true, force: true });
    }
  });
});
