import { describe, expect, it } from "vitest";
import { JavaSpringCleanBootstrapArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanBootstrapArtifactProducer", () => {
  it("produces the Spring Boot application entry point", () => {
    const producer = new JavaSpringCleanBootstrapArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [] },
      profile: {
        id: "java-spring-clean", version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" }, modules: [],
      },
      modules: [],
    });
    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("bootstrap");
    expect(artifacts).toEqual([{
      templateId: "spring-boot-application",
      model: { packageName: "io.github.jtsato.walletservice", className: "WalletServiceApplication" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletServiceApplication" },
    }]);
  });
});
