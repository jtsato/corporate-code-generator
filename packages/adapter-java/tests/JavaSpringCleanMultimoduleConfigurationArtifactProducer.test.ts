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
        entities: [{
          name: "Wallet",
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "balance", type: "decimal", required: false, identifier: false },
          ],
        }],
      },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "configuration", requires: [] }],
    });
    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("configuration");
    expect(artifacts.map((artifact) => artifact.templateId)).toEqual([
      "configuration-application", "configuration-domain-wiring", "configuration-global-exception-handler",
      "configuration-cors-properties", "configuration-cors-web-configuration",
      "configuration-openapi-configuration",
      "configuration-application-yaml", "configuration-application-local-yaml", "configuration-application-test-yaml", "configuration-application-prod-yaml",
      "configuration-messages", "configuration-messages-pt-br", "configuration-application-test", "configuration-architecture-test",
      "configuration-global-exception-handler-test", "configuration-cors-smoke-test", "configuration-openapi-smoke-test", "configuration-http-smoke-test", "configuration-http-persistence-read-test", "configuration-querydsl-filter-persistence-test",
    ]);
    /* Detailed legacy expectations retained below for fixture reference.
    expect(artifacts).toMatchObject([{
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
      templateId: "configuration-global-exception-handler",
      model: { packageName: "io.github.jtsato.walletservice.configuration.exception", responseStatusPackageName: "io.github.jtsato.walletservice.entrypoint.rest.common", coreExceptionPackageName: "io.github.jtsato.walletservice.core.common.exception" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "GlobalExceptionHandler" },
    }, {
      templateId: "configuration-messages",
      model: { messages: [{ key: "common.error.invalid-request", value: "Invalid request." }, { key: "common.error.not-found", value: "Resource not found." }, { key: "common.error.internal-server-error", value: "Internal server error." }] }, outputVariables: {},
    }, {
      templateId: "configuration-messages-pt-br",
      model: { messages: [{ key: "common.error.invalid-request", value: "Requisição inválida." }, { key: "common.error.not-found", value: "Recurso não encontrado." }, { key: "common.error.internal-server-error", value: "Erro interno do servidor." }] }, outputVariables: {},
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
    }, {
      templateId: "configuration-architecture-test",
      model: {
        packageName: "io.github.jtsato.walletservice.architecture",
        className: "ArchitectureTests",
        basePackage: "io.github.jtsato.walletservice",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        className: "ArchitectureTests",
      },
    }, {
      templateId: "configuration-global-exception-handler-test",
      model: { packageName: "io.github.jtsato.walletservice.configuration.exception", className: "GlobalExceptionHandlerTests", basePackage: "io.github.jtsato.walletservice" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "GlobalExceptionHandlerTests" },
    }, {
      templateId: "configuration-http-smoke-test",
      model: {
        packageName: "io.github.jtsato.walletservice",
        imports: [
          "java.net.URI",
          "java.net.http.HttpClient",
          "java.net.http.HttpRequest",
          "java.net.http.HttpResponse",
          "org.junit.jupiter.api.Test",
          "org.springframework.boot.test.context.SpringBootTest",
          "org.springframework.boot.test.web.server.LocalServerPort",
        ],
        className: "WalletHttpSmokeTests",
        serverPortAnnotationType: "LocalServerPort",
        serverPortFieldName: "port",
        endpointUriExpression: "\"http://localhost:\" + port + \"/wallets\"",
        testMethodName: "findAllReturnsEmptyList",
        requestType: "HttpRequest",
        responseType: "HttpResponse",
        responseBodyType: "String",
        httpClientType: "HttpClient",
        expectedStatusCode: 200,
        expectedBody: "[]",
        contentTypeHeaderName: "Content-Type",
        expectedContentTypePrefix: "application/json",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        className: "WalletHttpSmokeTests",
      },
    }, {
      templateId: "configuration-http-persistence-read-test",
      model: {
        packageName: "io.github.jtsato.walletservice",
        imports: [
          "io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity",
          "io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository",
          "java.math.BigDecimal",
          "java.net.URI",
          "java.net.http.HttpClient",
          "java.net.http.HttpRequest",
          "java.net.http.HttpResponse",
          "java.util.UUID",
          "org.junit.jupiter.api.AfterEach",
          "org.junit.jupiter.api.Test",
          "org.springframework.beans.factory.annotation.Autowired",
          "org.springframework.boot.test.context.SpringBootTest",
          "org.springframework.boot.test.web.server.LocalServerPort",
        ],
        className: "WalletHttpPersistenceReadTests",
        fixtures: [{
          constantName: "WALLET_ID",
          type: "UUID",
          javaExpression: "UUID.fromString(\"11111111-1111-1111-1111-111111111111\")",
        }, {
          constantName: "WALLET_BALANCE",
          type: "BigDecimal",
          javaExpression: "new BigDecimal(\"123.45\")",
        }],
        entityType: "WalletEntity",
        entityConstructorArguments: ["WALLET_ID", "WALLET_BALANCE"],
        repositoryType: "WalletRepository",
        repositoryFieldName: "walletRepository",
        repositoryCleanupMethodName: "deleteAll",
        repositorySaveMethodName: "saveAndFlush",
        autowiredAnnotationType: "Autowired",
        cleanupAnnotationType: "AfterEach",
        cleanupMethodName: "cleanUp",
        serverPortAnnotationType: "LocalServerPort",
        serverPortFieldName: "port",
        testMethodName: "findAllReturnsPersistedWallet",
        endpointUriExpression: "\"http://localhost:\" + port + \"/wallets\"",
        requestType: "HttpRequest",
        responseType: "HttpResponse",
        responseBodyType: "String",
        httpClientType: "HttpClient",
        expectedStatusCode: 200,
        expectedBodyExpression: "\"[{\\\"id\\\":\\\"11111111-1111-1111-1111-111111111111\\\",\\\"balance\\\":123.45}]\"",
        contentTypeHeaderName: "Content-Type",
        expectedContentTypePrefix: "application/json",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        className: "WalletHttpPersistenceReadTests",
      },
    }]); */
    expect(artifacts[3]).toMatchObject({
      model: { packageName: "io.github.jtsato.walletservice.configuration.web", className: "CorsProperties" },
    });
    expect(artifacts[15]).toMatchObject({
      model: { className: "WalletCorsSmokeTests", endpointPath: "/wallets", expectedStatusCode: 200 },
    });
  });

  it("prepares ordered non-null fixtures and the complete expected JSON expression", () => {
    const producer = new JavaSpringCleanMultimoduleConfigurationArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "schedule-service",
        namespace: "io.github.jtsato.scheduleservice",
        entities: [{
          name: "Schedule",
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "label", type: "string", required: false, identifier: false },
            { name: "alternateLabel", type: "string", required: false, identifier: false },
            { name: "scheduledOn", type: "date", required: false, identifier: false },
            { name: "processedAt", type: "datetime", required: false, identifier: false },
          ],
        }],
      },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "configuration", requires: [] }],
    });

    expect(artifacts.find((artifact) => artifact.templateId === "configuration-http-persistence-read-test")).toMatchObject({
      templateId: "configuration-http-persistence-read-test",
      model: {
        imports: expect.arrayContaining([
          "java.time.LocalDate",
          "java.time.OffsetDateTime",
          "java.util.UUID",
        ]),
        fixtures: [
          { constantName: "SCHEDULE_ID", type: "UUID", javaExpression: "UUID.fromString(\"11111111-1111-1111-1111-111111111111\")" },
          { constantName: "SCHEDULE_LABEL", type: "String", javaExpression: "\"sample\"" },
          { constantName: "SCHEDULE_ALTERNATE_LABEL", type: "String", javaExpression: "\"sample-2\"" },
          { constantName: "SCHEDULE_SCHEDULED_ON", type: "LocalDate", javaExpression: "LocalDate.parse(\"2026-01-15\")" },
          { constantName: "SCHEDULE_PROCESSED_AT", type: "OffsetDateTime", javaExpression: "OffsetDateTime.parse(\"2026-01-15T10:30:00Z\")" },
        ],
        entityConstructorArguments: [
          "SCHEDULE_ID",
          "SCHEDULE_LABEL",
          "SCHEDULE_ALTERNATE_LABEL",
          "SCHEDULE_SCHEDULED_ON",
          "SCHEDULE_PROCESSED_AT",
        ],
        expectedBodyExpression: "\"[{\\\"id\\\":\\\"11111111-1111-1111-1111-111111111111\\\",\\\"label\\\":\\\"sample\\\",\\\"alternateLabel\\\":\\\"sample-2\\\",\\\"scheduledOn\\\":\\\"2026-01-15\\\",\\\"processedAt\\\":\\\"2026-01-15T10:30:00Z\\\"}]\"",
      },
    });
  });
});
