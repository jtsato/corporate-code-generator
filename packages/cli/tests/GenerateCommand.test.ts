import { describe, expect, it, vi } from "vitest";
import { GenerateCommand } from "../src/commands/GenerateCommand.js";

describe("GenerateCommand", () => {
  it("plans without writing in dry-run mode", async () => {
    const writer = vi.fn(async () => undefined);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const exitCode = await new GenerateCommand(writer).execute({
        modelPath: "examples/wallet-service/model.yaml",
        profileId: "java-spring-clean",
        moduleIds: ["domain"],
        outputDirectory: undefined,
        dryRun: true,
      });
      expect(exitCode).toBe(0);
      expect(writer).not.toHaveBeenCalled();
      expect(log.mock.calls.flat().join("\n")).toContain("CREATE src/main/java/io/github/jtsato/walletservice/domain/Wallet.java");
    } finally { log.mockRestore(); }
  });

  it("writes through the injected local writer", async () => {
    const writer = vi.fn(async () => undefined);
    const exitCode = await new GenerateCommand(writer).execute({
      modelPath: "examples/wallet-service/model.yaml",
      profileId: "java-spring-clean",
      moduleIds: ["domain"],
      outputDirectory: "generated",
      dryRun: false,
    });
    expect(exitCode).toBe(0);
    expect(writer).toHaveBeenCalledOnce();
  });

  it("resolves application transitively and combines domain before application", async () => {
    let targetPaths: readonly string[] = [];
    const writer = vi.fn(async (plan: { readonly operations: readonly { readonly targetPath: string }[] }) => {
      targetPaths = plan.operations.map((operation) => operation.targetPath);
    });
    const exitCode = await new GenerateCommand(writer).execute({
      modelPath: "examples/wallet-service/model.yaml",
      profileId: "java-spring-clean",
      moduleIds: ["application"],
      outputDirectory: "generated",
      dryRun: false,
    });
    expect(exitCode).toBe(0);
    expect(targetPaths).toEqual([
      "src/main/java/io/github/jtsato/walletservice/domain/Wallet.java",
      "src/main/java/io/github/jtsato/walletservice/application/WalletService.java",
    ]);
  });

  it("requires output when not running dry-run", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const exitCode = await new GenerateCommand().execute({
        modelPath: "examples/wallet-service/model.yaml",
        profileId: "java-spring-clean",
        moduleIds: ["domain"],
        outputDirectory: undefined,
        dryRun: false,
      });
      expect(exitCode).toBe(1);
      expect(error.mock.calls.flat().join("\n")).toContain("CLI001");
    } finally { error.mockRestore(); }
  });

  it.each([
    { dryRun: true, outputDirectory: undefined },
    { dryRun: false, outputDirectory: "generated" },
  ])(
    "generates the complete multi-module profile (dryRun=$dryRun)",
    async ({ dryRun, outputDirectory }) => {
      const writer = vi.fn(async () => undefined);
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const exitCode = await new GenerateCommand(writer).execute({
          modelPath: "examples/wallet-service/model.yaml",
          profileId: "java-spring-clean-multimodule",
          moduleIds: [],
          outputDirectory,
          dryRun,
        });

        expect(exitCode).toBe(0);
        if (dryRun) expect(writer).not.toHaveBeenCalled();
        else expect(writer).toHaveBeenCalledOnce();

        if (!dryRun) {
          expect(writer.mock.calls[0]?.[0].operations).toHaveLength(82);
        }
      } finally {
        error.mockRestore();
      }
    },
  );

  it("generates the Maven reactor when only the multi-module build capability is requested", async () => {
    let targetPaths: readonly string[] = [];
    const writer = vi.fn(async (plan: { readonly operations: readonly { readonly targetPath: string }[] }) => {
      targetPaths = plan.operations.map((operation) => operation.targetPath);
    });

    const exitCode = await new GenerateCommand(writer).execute({
      modelPath: "examples/wallet-service/model.yaml",
      profileId: "java-spring-clean-multimodule",
      moduleIds: ["build"],
      outputDirectory: "generated",
      dryRun: false,
    });

    expect(exitCode).toBe(0);
    expect(targetPaths).toEqual([
      "pom.xml",
      "core/pom.xml",
      "entrypoints/rest/pom.xml",
      "infra/database/pom.xml",
      "configuration/pom.xml",
      ".github/workflows/java-ci.yml",
    ]);
  });

  it("generates the twenty-eight core artifacts when the multi-module core capability is requested", async () => {
    let targetPaths: readonly string[] = [];
    const writer = vi.fn(async (plan: { readonly operations: readonly { readonly targetPath: string }[] }) => {
      targetPaths = plan.operations.map((operation) => operation.targetPath);
    });
    const exitCode = await new GenerateCommand(writer).execute({
      modelPath: "examples/wallet-service/model.yaml", profileId: "java-spring-clean-multimodule",
      moduleIds: ["core"], outputDirectory: "generated", dryRun: false,
    });
    expect(exitCode).toBe(0);
    expect(targetPaths).toEqual([
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/gateway/WalletGateway.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCaseInteractor.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ApplicationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/FieldViolation.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ValidationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/NotFoundException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/validation/SelfValidating.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/SortDirection.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/SortOrder.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/PageRequest.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/PageResult.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/model/WalletValidationTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/SortOrderTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/PageRequestTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/PageResultTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterOperator.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterCondition.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupOperator.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroup.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterExpression.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterConditionTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterExpressionTests.java",
    ]);
  });

  it("combines supported multi-module build and core capabilities in module order", async () => {
    let targetPaths: readonly string[] = [];
    const writer = vi.fn(async (plan: { readonly operations: readonly { readonly targetPath: string }[] }) => {
      targetPaths = plan.operations.map((operation) => operation.targetPath);
    });
    const exitCode = await new GenerateCommand(writer).execute({
      modelPath: "examples/wallet-service/model.yaml", profileId: "java-spring-clean-multimodule",
      moduleIds: ["build", "core"], outputDirectory: "generated", dryRun: false,
    });
    expect(exitCode).toBe(0);
    expect(targetPaths).toHaveLength(34);
    expect(targetPaths.at(-1)).toBe(
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterExpressionTests.java",
    );
  });

  it.each([
    {
      moduleIds: ["entrypoints-rest"],
      operationCount: 38,
      expectedPath: "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
      unexpectedPath: "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/WalletGatewayProvider.java",
    },
    {
      moduleIds: ["infra-database"],
      operationCount: 46,
      expectedPath: "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapperTests.java",
      unexpectedPath: "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
    },
    { moduleIds: ["configuration"], operationCount: 82, expectedPath: ".github/workflows/java-ci.yml" },
    { moduleIds: ["build", "configuration"], operationCount: 82, expectedPath: ".github/workflows/java-ci.yml" },
  ])(
    "resolves multi-module selection $moduleIds to $operationCount operations",
    async ({ moduleIds, operationCount, expectedPath, unexpectedPath }) => {
      let targetPaths: readonly string[] = [];
      const writer = vi.fn(async (plan: { readonly operations: readonly { readonly targetPath: string }[] }) => {
        targetPaths = plan.operations.map((operation) => operation.targetPath);
      });
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const exitCode = await new GenerateCommand(writer).execute({
          modelPath: "examples/wallet-service/model.yaml",
          profileId: "java-spring-clean-multimodule",
          moduleIds,
          outputDirectory: "generated",
          dryRun: false,
        });

        expect(exitCode).toBe(0);
        expect(targetPaths).toHaveLength(operationCount);
        expect(targetPaths).toContain(expectedPath);
        if (unexpectedPath !== undefined) expect(targetPaths).not.toContain(unexpectedPath);
      } finally {
        error.mockRestore();
      }
    },
  );
});
