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
});
