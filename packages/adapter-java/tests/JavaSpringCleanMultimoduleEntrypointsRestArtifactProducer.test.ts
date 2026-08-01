import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer", () => {
  it("produces a delegating controller then a response with a domain factory", () => {
    const producer = new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [
        { name: "Wallet", attributes: [{ name: "id", type: "uuid", identifier: true }, { name: "balance", type: "decimal", identifier: false }] },
      ] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "entrypoints-rest", requires: [] }],
    });
    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("entrypoints-rest");
    expect(artifacts.map((artifact) => artifact.templateId)).toEqual(["entrypoints-rest-controller", "entrypoints-rest-response", "entrypoints-rest-response-status"]);
    expect(artifacts).toMatchObject([
      {
        outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletController" },
        model: {
          packageName: "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet",
          requestMapping: "/wallets",
          useCaseType: "FindWalletsUseCase",
          useCaseFieldName: "findWalletsUseCase",
          useCaseExecuteMethodName: "execute",
          responseFactoryMethodName: "from",
          imports: [
            "io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase",
            "java.util.List",
            "org.springframework.web.bind.annotation.GetMapping",
            "org.springframework.web.bind.annotation.RequestMapping",
            "org.springframework.web.bind.annotation.RestController",
          ],
        },
      },
      {
        outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletResponse" },
        model: {
          components: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }],
          factoryMethodName: "from",
          factoryParameterType: "Wallet",
          factoryParameterName: "wallet",
          factoryArguments: ["wallet.getId()", "wallet.getBalance()"],
          imports: [
            "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
            "java.math.BigDecimal",
            "java.util.UUID",
          ],
        },
      },
      { outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "ResponseStatus" }, model: { packageName: "io.github.jtsato.walletservice.entrypoint.rest.common", className: "ResponseStatus" } },
    ]);
  });
});
