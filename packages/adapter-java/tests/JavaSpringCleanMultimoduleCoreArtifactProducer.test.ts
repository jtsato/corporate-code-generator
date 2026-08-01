import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleCoreArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleCoreArtifactProducer", () => {
  it("produces deterministic core domain, port, use case and interactor invocations", () => {
    const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{
          name: "Wallet",
          attributes: [
            { name: "id", type: "uuid", identifier: true },
            { name: "balance", type: "decimal", identifier: false },
          ],
        }],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: {
          language: "java",
          languageVersion: "25",
          framework: "spring-boot",
        },
        architecture: { style: "clean-architecture" },
        templatePack: {
          id: "java-spring-clean-multimodule",
          version: "0.1.0",
        },
        modules: [{ id: "core", requires: [] }],
      },
      modules: [{ id: "core", requires: [] }],
    });

    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("core");
    expect(artifacts).toMatchObject([
      {
        templateId: "core-domain-entity",
        outputVariables: {
          packagePath: "io/github/jtsato/walletservice",
          domainName: "wallet",
          className: "Wallet",
        },
        model: {
          packageName: "io.github.jtsato.walletservice.core.domains.wallet.model",
          fields: [
            { name: "id", type: "UUID", modifiers: ["private", "final"] },
            { name: "balance", type: "BigDecimal", modifiers: ["private", "final"] },
          ],
        },
      },
      {
        templateId: "core-gateway",
        outputVariables: { className: "WalletGateway" },
        model: {
          packageName: "io.github.jtsato.walletservice.core.domains.wallet.gateway",
          imports: [
            "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
            "java.util.List",
          ],
          interfaceName: "WalletGateway",
          entityType: "Wallet",
          findAllMethodName: "findAll",
        },
      },
      {
        templateId: "core-find-usecase",
        outputVariables: { className: "FindWalletsUseCase" },
        model: {
          interfaceName: "FindWalletsUseCase",
          entityType: "Wallet",
          executeMethodName: "execute",
        },
      },
      {
        templateId: "core-find-usecase-interactor",
        outputVariables: { className: "FindWalletsUseCaseInteractor" },
        model: {
          className: "FindWalletsUseCaseInteractor",
          interfaceName: "FindWalletsUseCase",
          gatewayType: "WalletGateway",
          gatewayFieldName: "walletGateway",
          entityType: "Wallet",
          executeMethodName: "execute",
          gatewayFindAllMethodName: "findAll",
        },
      },
      { templateId: "core-application-exception", outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "ApplicationException" }, model: { packageName: "io.github.jtsato.walletservice.core.common.exception", className: "ApplicationException" } },
      { templateId: "core-field-violation", outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "FieldViolation" }, model: { packageName: "io.github.jtsato.walletservice.core.common.exception", className: "FieldViolation" } },
      { templateId: "core-validation-exception", outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "ValidationException" }, model: { packageName: "io.github.jtsato.walletservice.core.common.exception", className: "ValidationException", parentClassName: "ApplicationException", fieldViolationClassName: "FieldViolation" } },
      { templateId: "core-not-found-exception", outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "NotFoundException" }, model: { packageName: "io.github.jtsato.walletservice.core.common.exception", className: "NotFoundException", parentClassName: "ApplicationException" } },
    ]);
  });
});
