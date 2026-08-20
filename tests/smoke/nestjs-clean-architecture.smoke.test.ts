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
const profileId = "nestjs-clean-architecture";
const modelPath = "examples/nestjs-wallet-service/model.yaml";
const identifierOnlyModelPath = "examples/nestjs-identifier-only/model.yaml";

const GENERATED_PATHS = [
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "nest-cli.json",
  "test/jest-e2e.json",
  "src/core/exceptions/core.exception.ts",
  "src/core/exceptions/field-violation.ts",
  "src/core/exceptions/not-found.exception.ts",
  "src/core/exceptions/validation.exception.ts",
  "src/core/common/paging/sort-direction.ts",
  "src/core/common/paging/sort-order.ts",
  "src/core/common/paging/sort-order.spec.ts",
  "src/core/common/paging/page-request.ts",
  "src/core/common/paging/page-request.spec.ts",
  "src/core/common/paging/page-result.ts",
  "src/core/common/filter/filter-operator.ts",
  "src/core/common/filter/filter-condition.ts",
  "src/core/common/filter/filter-expression.ts",
  "src/core/models/wallet.model.ts",
  "src/core/usecases/create-wallet/create-wallet.command.ts",
  "src/core/usecases/create-wallet/create-wallet-command.validator.ts",
  "src/core/usecases/create-wallet/create-wallet.usecase.spec.ts",
  "src/core/usecases/create-wallet/create-wallet.gateway.ts",
  "src/core/usecases/create-wallet/create-wallet-usecase.interface.ts",
  "src/core/usecases/create-wallet/create-wallet.usecase.ts",
  "src/core/usecases/update-wallet/update-wallet.command.ts",
  "src/core/usecases/update-wallet/update-wallet-command.validator.ts",
  "src/core/usecases/update-wallet/update-wallet.usecase.spec.ts",
  "src/core/usecases/update-wallet/update-wallet.gateway.ts",
  "src/core/usecases/update-wallet/update-wallet-usecase.interface.ts",
  "src/core/usecases/update-wallet/update-wallet.usecase.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id.query.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id-query.validator.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id.usecase.spec.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id.gateway.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id-usecase.interface.ts",
  "src/core/usecases/get-wallet-by-id/get-wallet-by-id.usecase.ts",
  "src/core/usecases/page-wallets/page-wallets.query.ts",
  "src/core/usecases/page-wallets/page-wallets.gateway.ts",
  "src/core/usecases/page-wallets/page-wallets-usecase.interface.ts",
  "src/core/usecases/page-wallets/page-wallets.usecase.ts",
  "src/core/usecases/patch-wallet/patch-wallet.command.ts",
  "src/core/usecases/patch-wallet/patch-wallet.changes.ts",
  "src/core/usecases/patch-wallet/patch-wallet-command.validator.ts",
  "src/core/usecases/patch-wallet/patch-wallet.usecase.spec.ts",
  "src/core/usecases/patch-wallet/patch-wallet-usecase.interface.ts",
  "src/core/usecases/patch-wallet/patch-wallet.usecase.ts",
  "src/core/usecases/delete-wallet/delete-wallet.command.ts",
  "src/core/usecases/delete-wallet/delete-wallet.usecase.spec.ts",
  "src/core/usecases/delete-wallet/delete-wallet.gateway.ts",
  "src/core/usecases/delete-wallet/delete-wallet-usecase.interface.ts",
  "src/core/usecases/delete-wallet/delete-wallet.usecase.ts",
  "src/infra/models/wallet-entity.model.ts",
  "src/infra/mappers/wallet.mapper.ts",
  "src/infra/repositories/wallet.repository.ts",
  "src/infra/repositories/wallet.repository.spec.ts",
  "src/infra/providers/create-wallet.provider.ts",
  "src/infra/providers/get-wallet-by-id.provider.ts",
  "src/infra/providers/page-wallets.provider.ts",
  "src/infra/providers/update-wallet.provider.ts",
  "src/infra/providers/delete-wallet.provider.ts",
  "src/web-api/commons/filters/not-found.exception.filter.ts",
  "src/web-api/commons/filters/validation.exception.filter.ts",
  "src/web-api/commons/models/http-response.model.ts",
  "src/web-api/commons/models/http-response.builder.ts",
  "src/web-api/commons/interceptors/response-transformer.interceptor.ts",
  "src/web-api/entrypoints/wallets/wallet-page-request.model.ts",
  "src/web-api/entrypoints/wallets/wallet-filter.parser.ts",
  "src/web-api/entrypoints/wallets/wallet-sort.parser.ts",
  "src/web-api/entrypoints/wallets/wallet-sort.parser.spec.ts",
  "src/web-api/entrypoints/wallets/wallet-page-response.model.ts",
  "src/web-api/entrypoints/wallets/create-wallet-request.model.ts",
  "src/web-api/entrypoints/wallets/update-wallet-request.model.ts",
  "src/web-api/entrypoints/wallets/patch-wallet-request.model.ts",
  "src/web-api/entrypoints/wallets/wallet-response.model.ts",
  "src/web-api/entrypoints/wallets/wallet-presenter.mapper.ts",
  "src/web-api/entrypoints/wallets/wallet.controller.ts",
  "src/web-api/health/health-response.model.ts",
  "src/web-api/health/health.controller.ts",
  "src/web-api/i18n/messages.ts",
  "src/web-api/i18n/i18n.service.ts",
  "test/app.e2e-spec.ts",
  "src/main.ts",
  "src/app.module.ts",
  "src/modules/wallet.module.ts",
] as const;

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

function goldenModule(targetPath: string): string {
  if (targetPath.startsWith("src/core/")) return "core";
  if (targetPath.startsWith("src/infra/")) return "infra-persistence";
  if (targetPath.startsWith("src/web-api/")) return "web-api";
  if (targetPath.startsWith("src/modules/")) return "bootstrap";
  if (targetPath === "src/main.ts" || targetPath === "src/app.module.ts") return "bootstrap";
  if (targetPath === "test/app.e2e-spec.ts") return "bootstrap";
  return "build";
}

describe("NestJS clean architecture smoke test", () => {
  it("renders CRUD artifacts for an entity with only its identifier", async () => {
    const dryRun = await runCli([
      "generate",
      identifierOnlyModelPath,
      "--profile",
      profileId,
      "--dry-run",
    ]);

    expect(dryRun.code, dryRun.stderr).toBe(0);
    expect(dryRun.stdout).toContain("src/core/usecases/patch-marker/patch-marker.usecase.spec.ts");
  });

  it("validates, previews, and generates the NestJS Golden Path", async () => {
    await expect(access(cliEntryPoint)).resolves.toBeUndefined();

    const dryRunRoot = await mkdtemp(join(tmpdir(), "ccg-nest-dry-"));
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-nest-output-"));
    const coreRoot = await mkdtemp(join(tmpdir(), "ccg-nest-core-"));
    try {
      const common = ["generate", modelPath, "--profile", profileId];

      const validation = await runCli(["validate", modelPath]);
      expect(validation.code).toBe(0);

      const dryRun = await runCli([...common, "--dry-run"]);
      expect(dryRun.code).toBe(0);
      expect(dryRun.stdout).toContain(`CREATE: ${GENERATED_PATHS.length}`);
      for (const targetPath of GENERATED_PATHS) {
        expect(dryRun.stdout).toContain(`CREATE ${targetPath}`);
      }
      await expect(readdir(dryRunRoot)).resolves.toEqual([]);

      const generation = await runCli([...common, "--output", outputRoot]);
      expect(generation.code).toBe(0);

      for (const targetPath of GENERATED_PATHS) {
        const generated = await readFile(join(outputRoot, targetPath), "utf8");
        const golden = await readFile(
          join(repoRoot, "tests", "golden", profileId, goldenModule(targetPath), targetPath),
          "utf8",
        );
        expect(normalizeLineEndings(generated), targetPath).toBe(normalizeLineEndings(golden));
      }

      const coreOnly = await runCli([...common, "--module", "core", "--output", coreRoot]);
      expect(coreOnly.code).toBe(0);
      await expect(readFile(join(coreRoot, "src", "core", "models", "wallet.model.ts"), "utf8")).resolves.toBeTruthy();
      await expect(readFile(join(coreRoot, "package.json"))).rejects.toMatchObject({ code: "ENOENT" });
      await expect(readFile(join(coreRoot, "src", "main.ts"))).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(dryRunRoot, { recursive: true, force: true });
      await rm(outputRoot, { recursive: true, force: true });
      await rm(coreRoot, { recursive: true, force: true });
    }
  }, 30_000);

  it("keeps the generated Core module free of framework imports", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "ccg-nest-arch-"));
    try {
      const generation = await runCli(["generate", modelPath, "--profile", profileId, "--module", "core", "--output", outputRoot]);
      expect(generation.code).toBe(0);

      const coreFiles = GENERATED_PATHS.filter((targetPath) => targetPath.startsWith("src/core/"));
      expect(coreFiles.length).toBeGreaterThan(0);

      for (const targetPath of coreFiles) {
        const content = await readFile(join(outputRoot, targetPath), "utf8");
        expect(content, targetPath).not.toContain("@nestjs/");
        expect(content, targetPath).not.toContain("class-validator");
      }
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  }, 30_000);
});
