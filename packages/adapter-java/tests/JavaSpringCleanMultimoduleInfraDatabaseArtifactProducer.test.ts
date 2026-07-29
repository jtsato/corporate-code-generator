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
        entities: [{ name: "Wallet", attributes: [
          { name: "id", type: "uuid", identifier: true, required: true },
          { name: "balance", type: "decimal", identifier: false, required: true },
        ] }],
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
      templateId: "infra-database-persistence-entity",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.domains.wallet.entity",
        imports: ["jakarta.persistence.Column", "jakarta.persistence.Entity", "jakarta.persistence.Id", "jakarta.persistence.Table", "java.math.BigDecimal", "java.util.UUID"],
        className: "WalletEntity", tableName: "wallet",
        fields: [
          { name: "id", type: "UUID", columnName: "id", nullable: false, identifier: true },
          { name: "balance", type: "BigDecimal", columnName: "balance", nullable: false, identifier: false },
        ],
        constructorParameters: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }],
        getters: [{ name: "getId", returnType: "UUID", fieldName: "id" }, { name: "getBalance", returnType: "BigDecimal", fieldName: "balance" }],
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletEntity" },
    }, {
      templateId: "infra-database-persistence-mapper",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.domains.wallet.mapper",
        imports: ["io.github.jtsato.walletservice.core.domains.wallet.model.Wallet", "io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity"],
        className: "WalletPersistenceMapper", constructorName: "WalletPersistenceMapper", domainType: "Wallet", entityType: "WalletEntity",
        domainParameterName: "wallet", entityParameterName: "walletEntity", toEntityMethodName: "toEntity", toDomainMethodName: "toDomain",
        toEntityArguments: ["wallet.getId()", "wallet.getBalance()"], toDomainArguments: ["walletEntity.getId()", "walletEntity.getBalance()"],
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletPersistenceMapper" },
    }, {
      templateId: "infra-database-repository",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.domains.wallet.repository",
        imports: [
          "io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity",
          "java.util.UUID",
          "org.springframework.data.jpa.repository.JpaRepository",
        ],
        interfaceName: "WalletRepository",
        entityType: "WalletEntity",
        identifierType: "UUID",
        baseRepositoryType: "JpaRepository",
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletRepository" },
    }, {
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

  it.each([
    { attributes: [], message: "Cannot generate Spring Data repository for entity 'Wallet' because no identifier attribute was found." },
    {
      attributes: [
        { name: "id", type: "uuid" as const, identifier: true, required: true },
        { name: "legacyId", type: "uuid" as const, identifier: true, required: true },
      ],
      message: "Cannot generate Spring Data repository for entity 'Wallet' because multiple identifier attributes were found.",
    },
  ])("rejects invalid repository identifiers", ({ attributes, message }) => {
    const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();
    expect(() => producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [{ name: "Wallet", attributes }] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "infra-database", requires: ["core"] }],
    })).toThrow(message);
  });
});
