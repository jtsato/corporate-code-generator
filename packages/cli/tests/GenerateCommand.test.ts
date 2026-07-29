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
    "recognizes the multi-module profile but rejects generation (dryRun=$dryRun)",
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

        expect(exitCode).toBe(1);
        expect(writer).not.toHaveBeenCalled();
        expect(error.mock.calls.flat().join("\n")).toContain("CLI002");
        expect(error.mock.calls.flat().join("\n")).toContain(
          "Profile 'java-spring-clean-multimodule' currently supports only the 'build' module; complete multi-module generation is not implemented yet.",
        );
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
      "configuration/pom.xml",
    ]);
  });

  it.each([
    { moduleIds: ["core"] },
    { moduleIds: ["entrypoints-rest"] },
    { moduleIds: ["configuration"] },
    { moduleIds: ["build", "core"] },
  ])(
    "rejects unsupported multi-module selection $moduleIds",
    async ({ moduleIds }) => {
      const writer = vi.fn(async () => undefined);
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const exitCode = await new GenerateCommand(writer).execute({
          modelPath: "examples/wallet-service/model.yaml",
          profileId: "java-spring-clean-multimodule",
          moduleIds,
          outputDirectory: "generated",
          dryRun: false,
        });

        expect(exitCode).toBe(1);
        expect(writer).not.toHaveBeenCalled();
        expect(error.mock.calls.flat().join("\n")).toContain("CLI002");
      } finally {
        error.mockRestore();
      }
    },
  );
});
