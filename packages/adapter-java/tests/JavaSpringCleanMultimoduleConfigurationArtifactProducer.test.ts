import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleConfigurationArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleConfigurationArtifactProducer", () => {
  it("produces the root application followed by deterministic domain wiring", () => {
    const producer = new JavaSpringCleanMultimoduleConfigurationArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{ name: "Wallet", attributes: [] }],
      },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "configuration", requires: [] }],
    });
    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("configuration");
    expect(artifacts).toEqual([{
      templateId: "configuration-application",
      model: { packageName: "io.github.jtsato.walletservice", className: "WalletServiceApplication" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletServiceApplication" },
    }, {
      templateId: "configuration-domain-wiring",
      model: {
        packageName: "io.github.jtsato.walletservice.configuration.domains.wallet",
        imports: [
          "io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway",
          "io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase",
          "io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCaseInteractor",
          "io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository",
          "io.github.jtsato.walletservice.infra.domains.wallet.WalletGatewayProvider",
          "org.springframework.context.annotation.Bean",
          "org.springframework.context.annotation.Configuration",
        ],
        className: "WalletConfiguration",
        gatewayBeanMethodName: "walletGateway",
        gatewayType: "WalletGateway",
        gatewayImplementationType: "WalletGatewayProvider",
        repositoryType: "WalletRepository",
        repositoryParameterName: "walletRepository",
        useCaseBeanMethodName: "findWalletsUseCase",
        useCaseType: "FindWalletsUseCase",
        useCaseImplementationType: "FindWalletsUseCaseInteractor",
        gatewayParameterName: "walletGateway",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "WalletConfiguration",
      },
    }, {
      templateId: "configuration-application-test",
      model: {
        packageName: "io.github.jtsato.walletservice",
        imports: [
          "org.junit.jupiter.api.Test",
          "org.springframework.boot.test.context.SpringBootTest",
        ],
        className: "WalletServiceApplicationTests",
        testMethodName: "contextLoads",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        className: "WalletServiceApplicationTests",
      },
    }]);
  });
});
