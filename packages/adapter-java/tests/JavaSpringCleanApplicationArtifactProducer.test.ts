import { describe, expect, it } from "vitest";
import { JavaSpringCleanApplicationArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanApplicationArtifactProducer", () => {
  it("produces a deterministic service invocation per entity", () => {
    const producer = new JavaSpringCleanApplicationArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{ name: "Wallet", attributes: [] }],
      },
      profile: {
        id: "java-spring-clean",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" },
        modules: [{ id: "domain", requires: [] }, { id: "application", requires: ["domain"] }],
      },
      modules: [{ id: "domain", requires: [] }, { id: "application", requires: ["domain"] }],
    });
    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("application");
    expect(artifacts).toEqual([{
      templateId: "application-service",
      model: { packageName: "io.github.jtsato.walletservice.application", className: "WalletService" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletService" },
    }]);
  });
});
