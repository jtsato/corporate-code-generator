import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleConfigurationArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleConfigurationArtifactProducer", () => {
  it("produces the root Spring Boot application invocation", () => {
    const producer = new JavaSpringCleanMultimoduleConfigurationArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "configuration", requires: [] }],
    });
    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("configuration");
    expect(artifacts).toEqual([{
      templateId: "configuration-application",
      model: { packageName: "io.github.jtsato.walletservice", className: "WalletServiceApplication" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletServiceApplication" },
    }]);
  });
});
