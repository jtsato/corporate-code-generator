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
          "org.springframework.data.querydsl.ListQuerydslPredicateExecutor",
        ],
        interfaceName: "WalletRepository",
        entityType: "WalletEntity",
        identifierType: "UUID",
        baseRepositoryType: "JpaRepository",
        additionalInterfaces: ["ListQuerydslPredicateExecutor<WalletEntity>"],
      },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletRepository" },
    }, {
      templateId: "infra-database-gateway-provider",
      model: {
        packageName: "io.github.jtsato.walletservice.infra.domains.wallet",
        imports: [
          "com.querydsl.core.types.dsl.BooleanExpression",
          "io.github.jtsato.walletservice.core.common.filter.FilterExpression",
          "io.github.jtsato.walletservice.core.common.paging.PageRequest",
          "io.github.jtsato.walletservice.core.common.paging.PageResult",
          "io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway",
          "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
          "io.github.jtsato.walletservice.infra.database.common.filter.QuerydslFilterMapper",
          "io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageRequestMapper",
          "io.github.jtsato.walletservice.infra.database.common.paging.SpringDataPageResultMapper",
          "io.github.jtsato.walletservice.infra.database.domains.wallet.filter.WalletQuerydslFilterDefinition",
          "io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity",
          "io.github.jtsato.walletservice.infra.domains.wallet.mapper.WalletPersistenceMapper",
          "io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository",
          "java.util.List",
          "java.util.Map",
          "java.util.Objects",
          "java.util.Optional",
          "org.springframework.data.domain.Page",
          "org.springframework.data.domain.Pageable",
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
        findByFilterMethodName: "findByFilter",
        filterExpressionType: "FilterExpression",
        filterExpressionParameterName: "filterExpression",
        filterMapperType: "QuerydslFilterMapper",
        filterMapperMethodName: "toPredicate",
        filterDefinitionType: "WalletQuerydslFilterDefinition",
        filterDefinitionFactoryMethodName: "create",
        findByFilterPageMethodName: "findByFilterPage",
        persistenceEntityType: "WalletEntity",
        persistenceEntitiesVariableName: "walletEntities",
        requiresIterableConversion: false,
        findPageMethodName: "findPage",
        pageRequestType: "PageRequest",
        pageRequestParameterName: "pageRequest",
        pageResultType: "PageResult",
        pageableType: "Pageable",
        pageableVariableName: "pageable",
        pageType: "Page",
        pageVariableName: "page",
        pageRequestMapperType: "SpringDataPageRequestMapper",
        pageRequestMapperMethodName: "toPageable",
        pageResultMapperType: "SpringDataPageResultMapper",
        pageResultMapperMethodName: "toPageResult",
        sortPropertyMapping: [{ domainName: "id", persistenceName: "id" }, { domainName: "balance", persistenceName: "balance" }],
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "WalletGatewayProvider",
      },
    },
    ...["QuerydslFilterFieldDefinition", "QuerydslFilterDefinition", "QuerydslFilterValueConverter", "QuerydslFilterMapper"].map((className) => ({
      templateId: `infra-database-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`,
      model: { packageName: "io.github.jtsato.walletservice.infra.database.common.filter", exceptionPackage: "io.github.jtsato.walletservice.core.common.exception", filterPackage: "io.github.jtsato.walletservice.core.common.filter" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className },
    })),
    ...["QuerydslFilterValueConverter", "QuerydslFilterMapper"].map((className) => ({
      templateId: `infra-database-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: "io.github.jtsato.walletservice.infra.database.common.filter", filterPackage: "io.github.jtsato.walletservice.core.common.filter" }, outputVariables: { packagePath: "io/github/jtsato/walletservice", className: `${className}Tests` },
    })),
    { templateId: "infra-database-querydsl-domain-filter-definition", model: { packageName: "io.github.jtsato.walletservice.infra.database.domains.wallet.filter", commonPackage: "io.github.jtsato.walletservice.infra.database.common.filter", filterPackage: "io.github.jtsato.walletservice.core.common.filter", entityPackage: "io.github.jtsato.walletservice.infra.domains.wallet.entity", entityType: "Wallet", qVariableName: "walletEntity", imports: ["java.util.UUID", "java.math.BigDecimal"], fields: [{ name: "id", domainName: "id", type: "UUID", import: "java.util.UUID", operators: [{ operator: "EQUALS", method: "eq" }, { operator: "NOT_EQUALS", method: "ne" }, { operator: "IN", method: "in" }, { operator: "IS_NULL", method: "isNull" }, { operator: "IS_NOT_NULL", method: "isNotNull" }] }, { name: "balance", domainName: "balance", type: "BigDecimal", import: "java.math.BigDecimal", operators: [{ operator: "EQUALS", method: "eq" }, { operator: "NOT_EQUALS", method: "ne" }, { operator: "GREATER_THAN", method: "gt" }, { operator: "GREATER_THAN_OR_EQUALS", method: "goe" }, { operator: "LESS_THAN", method: "lt" }, { operator: "LESS_THAN_OR_EQUALS", method: "loe" }, { operator: "IN", method: "in" }, { operator: "IS_NULL", method: "isNull" }, { operator: "IS_NOT_NULL", method: "isNotNull" }] }] }, outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletQuerydslFilterDefinition" } },
    { templateId: "infra-database-querydsl-domain-filter-definition-test", model: { packageName: "io.github.jtsato.walletservice.infra.database.domains.wallet.filter", entityType: "Wallet", imports: ["java.util.UUID", "java.math.BigDecimal"], fields: [{ name: "id", domainName: "id", type: "UUID", import: "java.util.UUID", operators: [{ operator: "EQUALS", method: "eq" }, { operator: "NOT_EQUALS", method: "ne" }, { operator: "IN", method: "in" }, { operator: "IS_NULL", method: "isNull" }, { operator: "IS_NOT_NULL", method: "isNotNull" }] }, { name: "balance", domainName: "balance", type: "BigDecimal", import: "java.math.BigDecimal", operators: [{ operator: "EQUALS", method: "eq" }, { operator: "NOT_EQUALS", method: "ne" }, { operator: "GREATER_THAN", method: "gt" }, { operator: "GREATER_THAN_OR_EQUALS", method: "goe" }, { operator: "LESS_THAN", method: "lt" }, { operator: "LESS_THAN_OR_EQUALS", method: "loe" }, { operator: "IN", method: "in" }, { operator: "IS_NULL", method: "isNull" }, { operator: "IS_NOT_NULL", method: "isNotNull" }] }] }, outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletQuerydslFilterDefinitionTests" } },
    {
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

  it("prepares Querydsl filter fields from the actual entity attributes", () => {
    const producer = new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "schedule-service", namespace: "example.schedule", entities: [{ name: "Schedule", attributes: [
        { name: "id", type: "uuid", identifier: true, required: true },
        { name: "title", type: "string", identifier: false, required: true },
        { name: "active", type: "boolean", identifier: false, required: true },
        { name: "priority", type: "int32", identifier: false, required: true },
        { name: "sequence", type: "int64", identifier: false, required: true },
        { name: "amount", type: "decimal", identifier: false, required: true },
        { name: "scheduledFor", type: "date", identifier: false, required: true },
        { name: "startsAt", type: "datetime", identifier: false, required: true },
      ] }] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "infra-database", requires: ["core"] }],
    });

    const definition = artifacts.find((artifact) => artifact.templateId === "infra-database-querydsl-domain-filter-definition");
    expect(definition).toMatchObject({ outputVariables: { domainName: "schedule", className: "ScheduleQuerydslFilterDefinition" }, model: { entityType: "Schedule", qVariableName: "scheduleEntity" } });
    const fields = (definition!.model as { fields: Array<{ domainName: string; type: string; operators: Array<{ operator: string }> }> }).fields;
    expect(fields.map(({ domainName, type }) => ({ domainName, type }))).toEqual([
      { domainName: "id", type: "UUID" }, { domainName: "title", type: "String" }, { domainName: "active", type: "Boolean" }, { domainName: "priority", type: "Integer" },
      { domainName: "sequence", type: "Long" }, { domainName: "amount", type: "BigDecimal" }, { domainName: "scheduledFor", type: "LocalDate" }, { domainName: "startsAt", type: "OffsetDateTime" },
    ]);
    expect(fields.find((field) => field.domainName === "title")!.operators.map(({ operator }) => operator)).toEqual(["EQUALS", "NOT_EQUALS", "CONTAINS", "STARTS_WITH", "ENDS_WITH", "IN", "IS_NULL", "IS_NOT_NULL"]);
    expect(fields.find((field) => field.domainName === "active")!.operators.map(({ operator }) => operator)).toEqual(["EQUALS", "NOT_EQUALS", "IN", "IS_NULL", "IS_NOT_NULL"]);
    expect(fields.find((field) => field.domainName === "startsAt")!.operators.map(({ operator }) => operator)).toEqual(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUALS", "LESS_THAN", "LESS_THAN_OR_EQUALS", "IN", "IS_NULL", "IS_NOT_NULL"]);
    expect(JSON.stringify(definition)).not.toContain("balance");
    expect(JSON.stringify(definition)).not.toContain("Wallet");
  });
});
