import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer", () => {
  it("produces an unannotated gateway provider for each entity", () => {
    const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{ name: "Wallet", attributes: [] }],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "infra-database", requires: ["core"] }],
      },
      modules: [{ id: "infra-database", requires: ["core"] }],
    });

    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("infra-database");
    expect(artifacts).toEqual([{
      templateId: "infra-database-gateway-provider",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.domains.wallet",
        imports: [
          "io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway",
          "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
          "java.util.List",
        ],
        className: "WalletGatewayProvider",
        gatewayType: "WalletGateway",
        entityType: "Wallet",
        findAllMethodName: "findAll",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "WalletGatewayProvider",
      },
    }]);
  });
});
