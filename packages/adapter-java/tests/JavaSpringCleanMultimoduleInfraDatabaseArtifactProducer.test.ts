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
          "io.github.jtsato.walletservice.infra.domains.wallet.mapper.WalletPersistenceMapper",
          "io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository",
          "java.util.List",
        ],
        className: "WalletGatewayProvider",
        gatewayType: "WalletGateway",
        entityType: "Wallet",
        findAllMethodName: "findAll",
        repositoryType: "WalletRepository",
        repositoryFieldName: "walletRepository",
        constructorName: "WalletGatewayProvider",
        mapperType: "WalletPersistenceMapper",
        repositoryFindAllMethodName: "findAll",
        mapperToDomainMethodName: "toDomain",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "WalletGatewayProvider",
      },
    }, {
      templateId: "infra-database-spring-data-page-request-mapper",
      model: { packageName: "io.github.jtsato.walletservice.infra.database.common.paging", exceptionPackageName: "io.github.jtsato.walletservice.core.common.exception", pagingPackageName: "io.github.jtsato.walletservice.core.common.paging", className: "SpringDataPageRequestMapper" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "SpringDataPageRequestMapper" },
    }, {
      templateId: "infra-database-spring-data-page-result-mapper",
      model: { packageName: "io.github.jtsato.walletservice.infra.database.common.paging", exceptionPackageName: "io.github.jtsato.walletservice.core.common.exception", pagingPackageName: "io.github.jtsato.walletservice.core.common.paging", className: "SpringDataPageResultMapper" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "SpringDataPageResultMapper" },
    }, {
      templateId: "infra-database-spring-data-page-request-mapper-test",
      model: { packageName: "io.github.jtsato.walletservice.infra.database.common.paging", exceptionPackageName: "io.github.jtsato.walletservice.core.common.exception", pagingPackageName: "io.github.jtsato.walletservice.core.common.paging", className: "SpringDataPageRequestMapperTests" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "SpringDataPageRequestMapperTests" },
    }, {
      templateId: "infra-database-spring-data-page-result-mapper-test",
      model: { packageName: "io.github.jtsato.walletservice.infra.database.common.paging", exceptionPackageName: "io.github.jtsato.walletservice.core.common.exception", pagingPackageName: "io.github.jtsato.walletservice.core.common.paging", className: "SpringDataPageResultMapperTests" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "SpringDataPageResultMapperTests" },
    }, {
      templateId: "infra-database-querydsl-predicate-builder",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.database.domains.wallet.query",
        exceptionPackage: "io.github.jtsato.walletservice.core.common.exception",
        entityPackage: "io.github.jtsato.walletservice.infra.domains.wallet.entity",
        entityType: "Wallet",
        entityName: "Wallet",
        qVariableName: "walletEntity",
        imports: ["java.util.UUID", "java.math.BigDecimal"],
        methods: [
          { name: "id", type: "UUID", import: "java.util.UUID", fixture: 'UUID.fromString("11111111-1111-1111-1111-111111111111")', methodName: "idEquals", testSuffix: "Id" },
          { name: "balance", type: "BigDecimal", import: "java.math.BigDecimal", fixture: 'new BigDecimal("124.45")', methodName: "balanceEquals", testSuffix: "Balance" },
        ],
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletPredicateBuilder" },
    }, {
      templateId: "infra-database-querydsl-predicate-builder-test",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.database.domains.wallet.query",
        exceptionPackage: "io.github.jtsato.walletservice.core.common.exception",
        entityType: "Wallet",
        className: "WalletPredicateBuilderTests",
        imports: ["java.util.UUID", "java.math.BigDecimal"],
        methods: [
          { name: "id", type: "UUID", import: "java.util.UUID", fixture: 'UUID.fromString("11111111-1111-1111-1111-111111111111")', methodName: "idEquals", testSuffix: "Id" },
          { name: "balance", type: "BigDecimal", import: "java.math.BigDecimal", fixture: 'new BigDecimal("124.45")', methodName: "balanceEquals", testSuffix: "Balance" },
        ],
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletPredicateBuilderTests" },
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
