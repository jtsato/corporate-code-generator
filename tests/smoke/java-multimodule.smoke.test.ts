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
        ".gitignore",
        "README.md",
        "Dockerfile",
        ".dockerignore",
        "docker-compose.yml",
        "run.sh",
        "run.cmd",
        "Smoke.http",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/gateway/WalletGateway.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletCommand.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletCommand.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletCommand.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCaseInteractor.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCase.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCaseInteractor.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCaseInteractorTests.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ApplicationException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/FieldViolation.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ValidationException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/NotFoundException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ConflictException.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterOperator.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterCondition.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupOperator.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroup.java",
        "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterExpression.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterConditionTests.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupTests.java",
        "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterExpressionTests.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletApi.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
        "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletControllerTests.java",
        "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/RestTestApplication.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/request/CreateWalletRequest.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/ResponseStatus.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/WalletPageResponse.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortFieldDefinition.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortDefinition.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortParser.java",
        "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortParserTests.java",
        "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/sort/WalletRestSortDefinition.java",
        "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/sort/WalletRestSortDefinitionTests.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/entity/WalletEntity.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderTests.java",
        "infra/database/src/test/resources/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderTests.sql",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderIT.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/PersistenceTestApplication.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/mapper/WalletPersistenceMapper.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/repository/WalletRepository.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProvider.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapper.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapper.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapperTests.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapperTests.java",
        "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilder.java",
        "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilderTests.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/domains/wallet/WalletConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandler.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/i18n/LocaleConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsProperties.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsWebConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/RestFilterWebConfiguration.java",
        "configuration/src/main/java/io/github/jtsato/walletservice/configuration/openapi/OpenApiConfiguration.java",
        "configuration/src/main/resources/application.yaml",
        "configuration/src/main/resources/application-local.yaml",
        "configuration/src/main/resources/application-test.yaml",
        "configuration/src/main/resources/application-prod.yaml",
        "configuration/src/main/resources/messages.properties",
        "configuration/src/main/resources/messages_pt_BR.properties",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletServiceApplicationTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/architecture/LayerDependencyArchitectureTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/architecture/FrameworkIsolationArchitectureTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/architecture/PackageStructureArchitectureTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandlerTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/LocaleNegotiationTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletCorsSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletOpenApiSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletHttpSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/smoke/ActuatorHealthSmokeTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpPersistenceReadTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletFindByIdPersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletCreatePersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpFindByIdTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpCreateTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpDeleteTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletQuerydslFilterPersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpFilterTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletPagingPersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletQuerydslFilterPagingPersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletUpdatePersistenceTests.java",
        "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletDeletePersistenceTests.java",
      ]) {
        const [generated, golden] = await Promise.all([
          readFile(join(outputRoot, ...targetPath.split("/")), "utf8"),
          readFile(join(
            repoRoot,
            "tests",
            "golden",
            "java-spring-clean-multimodule",
            goldenModule(targetPath),
            ...goldenPath(targetPath).split("/"),
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

// The generated `.gitignore` is stored without its leading dot so that it does
// not act as a live ignore file over the golden tree itself. `.dockerignore`
// follows the same convention so both root ignore files read alike in the
// golden tree.
const dotlessGoldenPaths = new Map([
  [".gitignore", "gitignore"],
  [".dockerignore", "dockerignore"],
]);

function goldenPath(targetPath: string): string {
  return dotlessGoldenPaths.get(targetPath) ?? targetPath;
}

function goldenModule(targetPath: string): string {
  if (targetPath.startsWith("core/src/")) return "core";
  if (targetPath.startsWith("entrypoints/rest/src/")) return "entrypoints-rest";
  if (targetPath.startsWith("infra/database/src/")) return "infra-database";
  if (targetPath.startsWith("configuration/src/")) return "configuration";
  return "build";
}
