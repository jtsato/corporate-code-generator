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
        "--output",
        outputRoot,
      ], { cwd: repoRoot });

      for (const targetPath of [
        "pom.xml",
        "core/pom.xml",
        "entrypoints/rest/pom.xml",
        "infra/database/pom.xml",
        "configuration/pom.xml",
        ".github/workflows/java-ci.yml",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/gateway/WalletGateway.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCaseInteractor.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ApplicationException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/FieldViolation.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ValidationException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/NotFoundException.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/ResponseStatus.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/entity/WalletEntity.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/mapper/WalletPersistenceMapper.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/repository/WalletRepository.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/WalletGatewayProvider.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapper.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapper.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapperTests.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapperTests.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilder.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilderTests.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/domains/wallet/WalletConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandler.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsProperties.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsWebConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/openapi/OpenApiConfiguration.java",
        "configuration/src/main/resources/application.yaml",
        "configuration/src/main/resources/application-local.yaml",
        "configuration/src/main/resources/application-test.yaml",
        "configuration/src/main/resources/application-prod.yaml",
        "configuration/src/main/resources/messages.properties",
        "configuration/src/main/resources/messages_pt_BR.properties",
        "configuration/src/test/java/io/github/jtsato/walletservice/WalletServiceApplicationTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/architecture/ArchitectureTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandlerTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/WalletCorsSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/WalletOpenApiSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/WalletHttpSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/WalletHttpPersistenceReadTests.java",
      ]) {
        const [generated, golden] = await Promise.all([
          readFile(join(outputRoot, ...targetPath.split("/")), "utf8"),
          readFile(join(
            repoRoot,
            "tests",
            "golden",
            "java-spring-clean-multimodule",
            goldenModule(targetPath),
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

function goldenModule(targetPath: string): string {
  if (targetPath.startsWith("core/src/")) return "core";
  if (targetPath.startsWith("entrypoints/rest/src/")) return "entrypoints-rest";
  if (targetPath.startsWith("infra/database/src/")) return "infra-database";
  if (targetPath.startsWith("configuration/src/")) return "configuration";
  return "build";
}
