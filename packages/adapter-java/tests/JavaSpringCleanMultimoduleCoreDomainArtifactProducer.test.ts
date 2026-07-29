import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleCoreDomainArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleCoreDomainArtifactProducer", () => {
  it("produces core domain entity invocations with the reference package layout", () => {
    const producer = new JavaSpringCleanMultimoduleCoreDomainArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice",
        entities: [{ name: "Wallet", attributes: [
          { name: "id", type: "uuid", identifier: true },
          { name: "balance", type: "decimal", identifier: false },
        ] }],
      },
      profile: {
        id: "java-spring-clean-multimodule", version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "core", requires: [] }],
      },
      modules: [{ id: "core", requires: [] }],
    });

    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("core");
    expect(artifacts).toMatchObject([{
      templateId: "core-domain-entity",
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "Wallet" },
      model: {
        packageName: "io.github.jtsato.walletservice.core.domains.wallet.model",
        fields: [
          { name: "id", type: "UUID", modifiers: ["private", "final"] },
          { name: "balance", type: "BigDecimal", modifiers: ["private", "final"] },
        ],
        constructorParameters: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }],
        getters: [{ name: "getId" }, { name: "getBalance" }],
      },
    }]);
  });
});
