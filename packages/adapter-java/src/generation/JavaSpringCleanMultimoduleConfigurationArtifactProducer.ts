import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaBootstrapTemplateModel } from "../model/JavaBootstrapTemplateModel.js";
import type { JavaApplicationYamlTemplateModel } from "../model/JavaApplicationYamlTemplateModel.js";
import type { JavaCorsPropertiesTemplateModel } from "../model/JavaCorsPropertiesTemplateModel.js";
import type { JavaCorsWebConfigurationTemplateModel } from "../model/JavaCorsWebConfigurationTemplateModel.js";
import type { JavaCorsSmokeTestTemplateModel } from "../model/JavaCorsSmokeTestTemplateModel.js";
import type { JavaOpenApiConfigurationTemplateModel } from "../model/JavaOpenApiConfigurationTemplateModel.js";
import type { JavaOpenApiSmokeTestTemplateModel } from "../model/JavaOpenApiSmokeTestTemplateModel.js";
import type { JavaArchUnitTestTemplateModel } from "../model/JavaArchUnitTestTemplateModel.js";
import type { JavaDomainConfigurationTemplateModel } from "../model/JavaDomainConfigurationTemplateModel.js";
import type { JavaTimeConfigurationTemplateModel } from "../model/JavaTimeConfigurationTemplateModel.js";
import type { JavaLocaleConfigurationTemplateModel } from "../model/JavaLocaleConfigurationTemplateModel.js";
import type { JavaLocaleNegotiationTestTemplateModel } from "../model/JavaLocaleNegotiationTestTemplateModel.js";
import type { JavaHttpPersistenceReadTestTemplateModel } from "../model/JavaHttpPersistenceReadTestTemplateModel.js";
import type { JavaFindByIdPersistenceTestTemplateModel } from "../model/JavaFindByIdPersistenceTestTemplateModel.js";
import type { JavaCreatePersistenceTestTemplateModel } from "../model/JavaCreatePersistenceTestTemplateModel.js";
import type { JavaUpdatePersistenceTestTemplateModel } from "../model/JavaUpdatePersistenceTestTemplateModel.js";
import type { JavaDeletePersistenceTestTemplateModel } from "../model/JavaDeletePersistenceTestTemplateModel.js";
import type { JavaDeletedQueryPersistenceTestTemplateModel } from "../model/JavaDeletedQueryPersistenceTestTemplateModel.js";
import type { JavaRestorePersistenceTestTemplateModel } from "../model/JavaRestorePersistenceTestTemplateModel.js";
import type { JavaHttpDeletedQueryTestTemplateModel } from "../model/JavaHttpDeletedQueryTestTemplateModel.js";
import type { JavaHttpRestoreTestTemplateModel } from "../model/JavaHttpRestoreTestTemplateModel.js";
import type { JavaHttpFindByIdTestTemplateModel } from "../model/JavaHttpFindByIdTestTemplateModel.js";
import { createJavaHttpUpdateTestModel } from "../transformers/createJavaHttpUpdateTestModel.js";
import { createJavaHttpPatchTestModel } from "../transformers/createJavaHttpPatchTestModel.js";
import { createJavaHttpDeleteTestModel } from "../transformers/createJavaHttpDeleteTestModel.js";
import type { JavaHttpSmokeTestTemplateModel } from "../model/JavaHttpSmokeTestTemplateModel.js";
import type { JavaActuatorHealthSmokeTestTemplateModel } from "../model/JavaActuatorHealthSmokeTestTemplateModel.js";
import {
  springActuatorHealthPath,
  springApplicationPort,
} from "../spring/SpringRuntimeContract.js";
import type { JavaSpringBootApplicationTestTemplateModel } from "../model/JavaSpringBootApplicationTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { createJavaHttpFilterTestModel } from "../transformers/createJavaHttpFilterTestModel.js";
import { createJavaPagingPersistenceTestModel } from "../transformers/createJavaPagingPersistenceTestModel.js";
import { createJavaFilteredPagingPersistenceTestModel } from "../transformers/createJavaFilteredPagingPersistenceTestModel.js";
import { createJavaQuerydslFilterPersistenceTestModel } from "../transformers/createJavaQuerydslFilterPersistenceTestModel.js";
import { createJavaHttpCreateTestModel } from "../transformers/createJavaHttpCreateTestModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export class JavaSpringCleanMultimoduleConfigurationArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "configuration";

  public constructor(
    private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver(),
    private readonly fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
  ) {}

  // Persistence/HTTP integration tests in this producer construct the infra `*Entity` type directly
  // (to seed fixtures via the repository). When audited, that entity's constructor gains two trailing
  // LocalDateTime parameters (createdAt, updatedAt) — see JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer.
  // These fixed literals keep those direct-construction call sites compiling without introducing
  // non-deterministic `.now()`-based values into fixture data.
  private auditedEntityFixtureArguments(): readonly string[] {
    return [
      'LocalDateTime.parse("2026-01-15T10:30:00")',
      'LocalDateTime.parse("2026-01-15T10:31:00")',
    ];
  }

  // Same two fixed timestamps as auditedEntityFixtureArguments(), but as named constants (with an
  // accessorName) for sites that also assert on the round-tripped createdAt/updatedAt values.
  private auditedDeclaredFixturesWithAccessor(entityName: string): readonly { constantName: string; type: string; javaExpression: string; accessorName: string }[] {
    return [
      { constantName: toJavaConstantName(`${entityName}_created_at`), type: "LocalDateTime", javaExpression: 'LocalDateTime.parse("2026-01-15T10:30:00")', accessorName: "getCreatedAt" },
      { constantName: toJavaConstantName(`${entityName}_updated_at`), type: "LocalDateTime", javaExpression: 'LocalDateTime.parse("2026-01-15T10:31:00")', accessorName: "getUpdatedAt" },
    ];
  }

  // Same, but with a jsonName instead of accessorName, for sites asserting on serialized REST JSON fields.
  // These use non-zero seconds (unlike the other audited fixtures) because the generated assertion compares
  // `String.valueOf(LocalDateTime)` against the JSON text: java.time.LocalDateTime#toString() drops a
  // trailing ":00" seconds component, but Jackson's LocalDateTime serialization does not — with whole-minute
  // literals the two representations diverge ("2026-01-15T10:30" vs "2026-01-15T10:30:00") and the assertion
  // fails even though the value round-tripped correctly.
  private auditedDeclaredFixturesWithJsonName(entityName: string): readonly { constantName: string; type: string; javaExpression: string; jsonName: string }[] {
    return [
      { constantName: toJavaConstantName(`${entityName}_created_at`), type: "LocalDateTime", javaExpression: 'LocalDateTime.parse("2026-01-15T10:30:15")', jsonName: "createdAt" },
      { constantName: toJavaConstantName(`${entityName}_updated_at`), type: "LocalDateTime", javaExpression: 'LocalDateTime.parse("2026-01-15T10:31:45")', jsonName: "updatedAt" },
    ];
  }

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java bootstrap generation requires an application namespace.");
    const className = `${toJavaTypeName(request.application.name)}Application`;
    const model: JavaBootstrapTemplateModel = { packageName: namespace, className };
    const outputVariables = { packagePath: namespace.replaceAll(".", "/") };
    const anyEntityAudited = request.application.entities.some((entity) => entity.audited === true);
    const timeConfiguration: JavaTimeConfigurationTemplateModel = {
      packageName: `${namespace}.configuration.time`,
      imports: [
        `${namespace}.core.common.time.GetLocalDateTime`,
        `${namespace}.core.common.time.GetLocalDateTimeImpl`,
        "org.springframework.context.annotation.Bean",
        "org.springframework.context.annotation.Configuration",
      ],
      className: "TimeConfiguration",
      timeProviderBeanMethodName: "getLocalDateTime",
      timeProviderType: "GetLocalDateTime",
      timeProviderImplementationType: "GetLocalDateTimeImpl",
    };

    const applicationTest: JavaSpringBootApplicationTestTemplateModel = {
      packageName: `${namespace}.smoke`,
      imports: ["org.junit.jupiter.api.Test", "org.springframework.boot.test.context.SpringBootTest", "org.springframework.test.context.ActiveProfiles"],
      className: `${className}Tests`,
      testMethodName: "contextLoads",
      activeProfile: "test",
    };
    const applicationYaml: JavaApplicationYamlTemplateModel = {
      applicationName: request.application.name,
      serverPort: springApplicationPort,
      // Only `health` is exposed over HTTP: it is the endpoint the generated
      // container HEALTHCHECK polls. Every other Actuator endpoint stays off
      // because nothing in the generated application needs it.
      exposedManagementEndpoints: "health",
      healthDetailsPolicy: "never",
    };
    const corsProperties: JavaCorsPropertiesTemplateModel = {
      packageName: `${namespace}.configuration.web`, className: "CorsProperties",
    };
    const corsWebConfiguration: JavaCorsWebConfigurationTemplateModel = {
      packageName: `${namespace}.configuration.web`, className: "CorsWebConfiguration", propertiesClassName: corsProperties.className,
    };
    const localeConfiguration: JavaLocaleConfigurationTemplateModel = {
      packageName: `${namespace}.configuration.i18n`,
      className: "LocaleConfiguration",
      defaultLocaleExpression: "Locale.ENGLISH",
      supportedLocaleExpressions: ["Locale.ENGLISH", 'Locale.forLanguageTag("pt-BR")'],
      messageSourceBasename: "classpath:messages",
      messageSourceEncoding: "UTF-8",
      fallbackToSystemLocale: false,
    };
    const localeNegotiationTest: JavaLocaleNegotiationTestTemplateModel = {
      packageName: `${namespace}.smoke`,
      className: "LocaleNegotiationTests",
      defaultLocaleExpression: "Locale.ENGLISH",
      supportedLocaleExpression: 'Locale.forLanguageTag("pt-BR")',
      acceptLanguageHeaderName: "Accept-Language",
      supportedAcceptLanguage: "pt-BR",
      unsupportedAcceptLanguage: "fr-FR",
      messageKey: "common.error.invalid-request",
      supportedMessage: "Requisição inválida.",
      defaultMessage: "Invalid request.",
    };
    const openApiConfiguration: JavaOpenApiConfigurationTemplateModel = { packageName: `${namespace}.configuration.openapi`, className: "OpenApiConfiguration", title: `${request.application.name} API`, description: `${request.application.name} REST API`, version: request.profile.version };
    const layerDependencyArchitectureTest: JavaArchUnitTestTemplateModel = {
      packageName: `${namespace}.architecture`,
      className: "LayerDependencyArchitectureTests",
      basePackage: namespace,
    };
    const frameworkIsolationArchitectureTest: JavaArchUnitTestTemplateModel = {
      packageName: `${namespace}.architecture`,
      className: "FrameworkIsolationArchitectureTests",
      basePackage: namespace,
    };
    const packageStructureArchitectureTest: JavaArchUnitTestTemplateModel = {
      packageName: `${namespace}.architecture`,
      className: "PackageStructureArchitectureTests",
      basePackage: namespace,
    };
    const exceptionPackage = `${namespace}.configuration.exception`;
    const messages = [
      { key: "common.error.invalid-request", value: "Invalid request." },
      { key: "common.error.not-found", value: "Resource not found." },
      { key: "common.error.internal-server-error", value: "Internal server error." },
      { key: "common.command.required", value: "Command is required." },
      { key: "common.identifier.required", value: "Identifier is required." },
      { key: "wallet.balance.required", value: "Balance is required." },
      { key: "wallet.not-found", value: "Wallet was not found." },
      { key: "wallet.already-exists", value: "Wallet already exists." },
    ];
    const portugueseMessages = [
      { key: "common.command.required", value: "Comando é obrigatório." },
      { key: "wallet.balance.required", value: "Saldo é obrigatório." },
      { key: "common.error.invalid-request", value: "Requisição inválida." },
      { key: "common.error.not-found", value: "Recurso não encontrado." },
      { key: "common.error.internal-server-error", value: "Erro interno do servidor." },
      { key: "common.identifier.required", value: "Identificador é obrigatório." },
      { key: "wallet.not-found", value: "Carteira não encontrada." },
      { key: "wallet.already-exists", value: "Carteira já existe." },
    ];

    return [
      {
        templateId: "configuration-application",
        model,
        outputVariables: { ...outputVariables, className },
      },
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const gatewayType = `${entityType}Gateway`;
        const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
        const byFilterUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterUseCase`;
        const pageUseCaseType = `Find${toJavaPluralTypeName(entityType)}PageUseCase`;
        const byFilterPageUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
        const byIdUseCaseType = `Find${entityType}ByIdUseCase`;
        const createUseCaseType = `Create${entityType}UseCase`;
        const updateUseCaseType = `Update${entityType}UseCase`;
        const patchUseCaseType = `Patch${entityType}UseCase`;
        const deleteUseCaseType = `Delete${entityType}UseCase`;
        const deletedByIdUseCaseType = `FindDeleted${entityType}ByIdUseCase`;
        const deletedByFilterPageUseCaseType = `FindDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
        const restoreUseCaseType = `Restore${entityType}UseCase`;
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byIdUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byIdUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byFilterUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byFilterUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${pageUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${pageUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byFilterPageUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byFilterPageUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.create.${createUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.create.${createUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.update.${updateUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.update.${updateUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.patch.${patchUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.patch.${patchUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.${deleteUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.${deleteUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${deletedByIdUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${deletedByIdUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${deletedByFilterPageUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${deletedByFilterPageUseCaseType}Interactor`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.restore.${restoreUseCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.restore.${restoreUseCaseType}Interactor`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.${gatewayType}Provider`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.springframework.context.annotation.Bean");
        imports.add("org.springframework.context.annotation.Configuration");
        if (entity.audited === true) {
          imports.add(`${namespace}.core.common.time.GetLocalDateTime`);
        }
        const domainModel: JavaDomainConfigurationTemplateModel = {
          packageName: `${namespace}.configuration.domains.${domainName}`,
          imports: imports.values(),
          className: `${entityType}Configuration`,
          gatewayBeanMethodName: `${domainName}Gateway`,
          gatewayType,
          gatewayImplementationType: `${gatewayType}Provider`,
          repositoryType: `${entityType}Repository`,
          repositoryParameterName: `${domainName}Repository`,
          useCaseBeanMethodName: `find${toJavaPluralTypeName(entityType)}UseCase`,
          useCaseType,
          useCaseImplementationType: `${useCaseType}Interactor`,
          gatewayParameterName: `${domainName}Gateway`,
          byIdUseCaseBeanMethodName: `find${entityType}ByIdUseCase`,
          byIdUseCaseType,
          byIdUseCaseImplementationType: `${byIdUseCaseType}Interactor`,
          byFilterUseCaseBeanMethodName: `find${toJavaPluralTypeName(entityType)}ByFilterUseCase`,
          byFilterUseCaseType,
          byFilterUseCaseImplementationType: `${byFilterUseCaseType}Interactor`,
          pageUseCaseBeanMethodName: `find${toJavaPluralTypeName(entityType)}PageUseCase`,
          pageUseCaseType,
          pageUseCaseImplementationType: `${pageUseCaseType}Interactor`,
          byFilterPageUseCaseBeanMethodName: `find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`,
          byFilterPageUseCaseType,
          byFilterPageUseCaseImplementationType: `${byFilterPageUseCaseType}Interactor`,
          createUseCaseBeanMethodName: `create${entityType}UseCase`,
          createUseCaseType,
          createUseCaseImplementationType: `${createUseCaseType}Interactor`,
          updateUseCaseBeanMethodName: `update${entityType}UseCase`,
          updateUseCaseType,
          updateUseCaseImplementationType: `${updateUseCaseType}Interactor`,
          patchUseCaseBeanMethodName: `patch${entityType}UseCase`,
          patchUseCaseType,
          patchUseCaseImplementationType: `${patchUseCaseType}Interactor`,
          deleteUseCaseBeanMethodName: `delete${entityType}UseCase`,
          deleteUseCaseType,
          deleteUseCaseImplementationType: `${deleteUseCaseType}Interactor`,
          deletedByIdUseCaseBeanMethodName: `findDeleted${entityType}ByIdUseCase`,
          deletedByIdUseCaseType,
          deletedByIdUseCaseImplementationType: `${deletedByIdUseCaseType}Interactor`,
          deletedByFilterPageUseCaseBeanMethodName: `findDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`,
          deletedByFilterPageUseCaseType,
          deletedByFilterPageUseCaseImplementationType: `${deletedByFilterPageUseCaseType}Interactor`,
          restoreUseCaseBeanMethodName: `restore${entityType}UseCase`,
          restoreUseCaseType,
          restoreUseCaseImplementationType: `${restoreUseCaseType}Interactor`,
          audited: entity.audited === true,
          ...(entity.audited === true ? {
            timeProviderType: "GetLocalDateTime",
            timeProviderParameterName: "getLocalDateTime",
          } : {}),
        };

        return {
          templateId: "configuration-domain-wiring",
          model: domainModel,
          outputVariables: {
            ...outputVariables,
            domainName,
            className: domainModel.className,
          },
        };
      }),
      ...(anyEntityAudited ? [
        { templateId: "configuration-time", model: timeConfiguration, outputVariables: { ...outputVariables, className: timeConfiguration.className } },
      ] : []),
      { templateId: "configuration-global-exception-handler", model: { packageName: exceptionPackage, responseStatusPackageName: `${namespace}.entrypoint.rest.common`, coreExceptionPackageName: `${namespace}.core.common.exception` }, outputVariables: { ...outputVariables, className: "GlobalExceptionHandler" } },
      { templateId: "configuration-locale-configuration", model: localeConfiguration, outputVariables: { ...outputVariables, className: localeConfiguration.className } },
      { templateId: "configuration-cors-properties", model: corsProperties, outputVariables: { ...outputVariables, className: corsProperties.className } },
      { templateId: "configuration-cors-web-configuration", model: corsWebConfiguration, outputVariables: { ...outputVariables, className: corsWebConfiguration.className } },
      { templateId: "configuration-rest-filter-web-configuration", model: { packageName: `${namespace}.configuration.web`, className: "RestFilterWebConfiguration" }, outputVariables: { ...outputVariables, className: "RestFilterWebConfiguration" } },
      { templateId: "configuration-openapi-configuration", model: openApiConfiguration, outputVariables: { ...outputVariables, className: openApiConfiguration.className } },
      { templateId: "configuration-application-yaml", model: applicationYaml, outputVariables: {} },
      { templateId: "configuration-application-local-yaml", model: {}, outputVariables: {} },
      { templateId: "configuration-application-test-yaml", model: {}, outputVariables: {} },
      { templateId: "configuration-application-prod-yaml", model: {}, outputVariables: {} },
      { templateId: "configuration-messages", model: { messages }, outputVariables: {} },
      { templateId: "configuration-messages-pt-br", model: { messages: portugueseMessages }, outputVariables: {} },
      {
        templateId: "configuration-application-test",
        model: applicationTest,
        outputVariables: { ...outputVariables, className: applicationTest.className },
      },
      {
        templateId: "configuration-layer-dependency-architecture-test",
        model: layerDependencyArchitectureTest,
        outputVariables: { ...outputVariables, className: layerDependencyArchitectureTest.className },
      },
      {
        templateId: "configuration-framework-isolation-architecture-test",
        model: frameworkIsolationArchitectureTest,
        outputVariables: { ...outputVariables, className: frameworkIsolationArchitectureTest.className },
      },
      {
        templateId: "configuration-package-structure-architecture-test",
        model: packageStructureArchitectureTest,
        outputVariables: { ...outputVariables, className: packageStructureArchitectureTest.className },
      },
      { templateId: "configuration-global-exception-handler-test", model: { packageName: exceptionPackage, className: "GlobalExceptionHandlerTests", basePackage: namespace }, outputVariables: { ...outputVariables, className: "GlobalExceptionHandlerTests" } },
      { templateId: "configuration-locale-negotiation-test", model: localeNegotiationTest, outputVariables: { ...outputVariables, className: localeNegotiationTest.className } },
      ...request.application.entities.map((entity) => {
        const corsSmokeModel: JavaCorsSmokeTestTemplateModel = {
          packageName: `${namespace}.smoke`,
          className: `${toJavaTypeName(entity.name)}CorsSmokeTests`,
          endpointPath: toRestCollectionPath(entity.name),
          allowedOrigin: "http://localhost:3000",
          expectedStatusCode: 200,
        };
        return { templateId: "configuration-cors-smoke-test", model: corsSmokeModel, outputVariables: { ...outputVariables, className: corsSmokeModel.className } };
      }),
      ...request.application.entities.map((entity) => {
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate OpenAPI find-by-id smoke test for entity '${entity.name}' without an identifier.`);
        const model: JavaOpenApiSmokeTestTemplateModel = {
          packageName: `${namespace}.smoke`,
          className: `${toJavaTypeName(entity.name)}OpenApiSmokeTests`,
          title: openApiConfiguration.title,
          endpointPath: toRestCollectionPath(entity.name),
          findByIdEndpointPath: `${toRestCollectionPath(entity.name)}/{${identifier.name}}`,
          deletedByIdEndpointPath: `${toRestCollectionPath(entity.name)}/deleted/{${identifier.name}}`,
          restoreEndpointPath: `${toRestCollectionPath(entity.name)}/{${identifier.name}}/restore`,
          identifierParameterName: identifier.name,
          identifierSchemaFormat: identifier.type === "uuid" ? "uuid" : "",
          filterParameterName: "filter",
          filterParameterDescriptionFragment: "<field>:<operator>[:<value>]",
          sortParameterName: "sort",
          sortParameterDescriptionFragment: "<field>:<direction>",
          pageParameterName: "page",
          sizeParameterName: "size",
          pageResponseSchemaName: `${toJavaTypeName(entity.name)}PageResponse`,
          itemResponseSchemaName: `${toJavaTypeName(entity.name)}Response`,
          createRequestSchemaName: `Create${toJavaTypeName(entity.name)}Request`,
          createResponseSchemaName: `${toJavaTypeName(entity.name)}Response`,
          updateRequestSchemaName: `Update${toJavaTypeName(entity.name)}Request`,
          patchRequestSchemaName: `Patch${toJavaTypeName(entity.name)}Request`,
          tombstonePageResponseSchemaName: `${toJavaTypeName(entity.name)}TombstonePageResponse`,
          tombstoneResponseSchemaName: `${toJavaTypeName(entity.name)}TombstoneResponse`,
        };
        return { templateId: "configuration-openapi-smoke-test", model, outputVariables: { ...outputVariables, className: model.className } };
      }),
      ...request.application.entities.map((entity) => {
        const entityType = toJavaTypeName(entity.name);
        const imports = new JavaImportCollector();
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
        imports.add("com.fasterxml.jackson.databind.JsonNode");
        imports.add("com.fasterxml.jackson.databind.ObjectMapper");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.boot.test.web.server.LocalServerPort");
        imports.add("org.springframework.test.context.ActiveProfiles");
        const httpSmokeModel: JavaHttpSmokeTestTemplateModel = {
          packageName: `${namespace}.smoke`,
          imports: ["java.net.URI", ...imports.values()],
          className: `${entityType}HttpSmokeTests`,
          serverPortAnnotationType: "LocalServerPort",
          serverPortFieldName: "port",
          endpointUriExpression: `"http://localhost:" + port + "${toRestCollectionPath(entity.name)}"`,
          testMethodName: "findAllReturnsEmptyList",
          requestType: "HttpRequest",
          responseType: "HttpResponse",
          responseBodyType: "String",
          httpClientType: "HttpClient",
          objectMapperType: "ObjectMapper",
          jsonNodeType: "JsonNode",
          expectedStatusCode: 200,
          expectedPage: 0,
          expectedSize: 20,
          expectedTotalItems: 0,
          expectedTotalPages: 0,
          contentTypeHeaderName: "Content-Type",
          expectedContentTypePrefix: "application/json",
          activeProfile: "test",
        };

        return {
          templateId: "configuration-http-smoke-test",
          model: httpSmokeModel,
          outputVariables: {
            ...outputVariables,
            className: httpSmokeModel.className,
          },
        };
      }),
      ((): TemplateInvocation => {
        const imports = new JavaImportCollector();
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
        imports.add("com.fasterxml.jackson.databind.JsonNode");
        imports.add("com.fasterxml.jackson.databind.ObjectMapper");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.boot.test.web.server.LocalServerPort");
        imports.add("org.springframework.test.context.ActiveProfiles");
        // This test is the runtime proof for the generated container HEALTHCHECK:
        // it polls the same Actuator path the Dockerfile does, so a healthcheck
        // that would never turn the container healthy fails the generated build.
        const actuatorHealthSmokeModel: JavaActuatorHealthSmokeTestTemplateModel = {
          packageName: `${namespace}.smoke`,
          imports: ["java.net.URI", ...imports.values()],
          className: "ActuatorHealthSmokeTests",
          serverPortAnnotationType: "LocalServerPort",
          serverPortFieldName: "port",
          endpointUriExpression: `"http://localhost:" + port + "${springActuatorHealthPath}"`,
          testMethodName: "healthEndpointReportsUp",
          requestType: "HttpRequest",
          responseType: "HttpResponse",
          responseBodyType: "String",
          httpClientType: "HttpClient",
          objectMapperType: "ObjectMapper",
          jsonNodeType: "JsonNode",
          expectedStatusCode: 200,
          statusFieldName: "status",
          expectedStatus: "UP",
          detailsFieldName: "components",
          activeProfile: "test",
        };

        return {
          templateId: "configuration-actuator-health-smoke-test",
          model: actuatorHealthSmokeModel,
          outputVariables: {
            ...outputVariables,
            className: actuatorHealthSmokeModel.className,
          },
        };
      })(),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const persistenceEntityType = `${entityType}Entity`;
        const repositoryType = `${entityType}Repository`;
        const repositoryFieldName = toJavaFieldName(repositoryType);
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${persistenceEntityType}`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${repositoryType}`);
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
        imports.add("com.fasterxml.jackson.databind.JsonNode");
        imports.add("com.fasterxml.jackson.databind.ObjectMapper");
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.boot.test.web.server.LocalServerPort");
        imports.add("org.springframework.test.context.ActiveProfiles");

        const occurrenceCounts = new Map<string, number>();
        const fixtureValues = entity.attributes.map((attribute) => {
          const occurrenceIndex = occurrenceCounts.get(attribute.type) ?? 0;
          occurrenceCounts.set(attribute.type, occurrenceIndex + 1);
          const javaType = this.typeResolver.resolve(attribute.type);
          imports.add(javaType.import);
          return {
            attribute,
            javaType,
            value: this.fixtureResolver.resolve(attribute.type, occurrenceIndex),
            constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
          };
        });
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }
        const auditedBodyFields = entity.audited === true
          ? [
              `"createdAt":"2026-01-15T10:30:00"`,
              `"updatedAt":"2026-01-15T10:31:00"`,
            ]
          : [];
        const expectedBody = `[{${
          [
            ...fixtureValues.map(({ attribute, value }) =>
              `${JSON.stringify(attribute.name)}:${value.jsonLiteral}`,
            ),
            ...auditedBodyFields,
          ].join(",")
        }}]`;
        const persistenceReadModel: JavaHttpPersistenceReadTestTemplateModel = {
          packageName: `${namespace}.http`,
          imports: insertUriImport(imports.values()),
          className: `${entityType}HttpPersistenceReadTests`,
          fixtures: fixtureValues.map(({ javaType, value, constantName }) => ({
            constantName,
            type: javaType.name,
            javaExpression: value.javaExpression,
          })),
          entityType: persistenceEntityType,
          entityConstructorArguments: entity.audited === true
            ? [...fixtureValues.map(({ constantName }) => constantName), ...this.auditedEntityFixtureArguments()]
            : fixtureValues.map(({ constantName }) => constantName),
          repositoryType,
          repositoryFieldName,
          repositoryCleanupMethodName: "deleteAll",
          repositorySaveMethodName: "saveAndFlush",
          autowiredAnnotationType: "Autowired",
          cleanupAnnotationType: "AfterEach",
          cleanupMethodName: "cleanUp",
          serverPortAnnotationType: "LocalServerPort",
          serverPortFieldName: "port",
          testMethodName: `findAllReturnsPersisted${entityType}`,
          endpointUriExpression: `"http://localhost:" + port + "${toRestCollectionPath(entity.name)}"`,
          requestType: "HttpRequest",
          responseType: "HttpResponse",
          responseBodyType: "String",
          httpClientType: "HttpClient",
          objectMapperType: "ObjectMapper",
          jsonNodeType: "JsonNode",
          expectedStatusCode: 200,
          expectedItemsBodyExpression: JSON.stringify(expectedBody),
          contentTypeHeaderName: "Content-Type",
          expectedContentTypePrefix: "application/json",
          activeProfile: "test",
        };

        return {
          templateId: "configuration-http-persistence-read-test",
          model: persistenceReadModel,
          outputVariables: {
            ...outputVariables,
            className: persistenceReadModel.className,
          },
        };
      }),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate find-by-id persistence test for entity '${entity.name}' without an identifier.`);
        const imports = new JavaImportCollector();
        const useCaseType = `Find${entityType}ByIdUseCase`;
        imports.add(`${namespace}.core.common.exception.NotFoundException`);
        imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.test.context.ActiveProfiles");
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }
        const fixtures = [
          ...entity.attributes.map((attribute, index) => {
            const javaType = this.typeResolver.resolve(attribute.type);
            imports.add(javaType.import);
            return {
              constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
              type: javaType.name,
              javaExpression: this.fixtureResolver.resolve(attribute.type, index).javaExpression,
              accessorName: `get${toJavaTypeName(attribute.name)}`,
            };
          }),
          ...(entity.audited === true ? this.auditedDeclaredFixturesWithAccessor(entity.name) : []),
        ];
        const persistenceModel: JavaFindByIdPersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: imports.values(),
          className: `${entityType}FindByIdPersistenceTests`,
          activeProfile: "test",
          useCaseType,
          useCaseFieldName: toJavaFieldName(useCaseType),
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          domainEntityType: entityType,
          fixtures,
          identifierConstantName: toJavaConstantName(`${entity.name}_${identifier.name}`),
          missingIdentifierExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
          notFoundExceptionType: "NotFoundException",
        };
        return {
          templateId: "configuration-find-by-id-persistence-test",
          model: persistenceModel,
          outputVariables: { ...outputVariables, className: persistenceModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate create persistence test for entity '${entity.name}' without an identifier.`);
        const useCaseType = `Create${entityType}UseCase`;
        const commandType = `Create${entityType}Command`;
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.usecase.create.${commandType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.create.${useCaseType}`);
        imports.add(`${namespace}.core.common.exception.ConflictException`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.test.context.ActiveProfiles");
        const fixtures = entity.attributes.map((attribute, index) => {
          const javaType = this.typeResolver.resolve(attribute.type);
          imports.add(javaType.import);
          return {
            constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
            type: javaType.name,
            javaExpression: this.fixtureResolver.resolve(attribute.type, index).javaExpression,
            accessorName: `get${toJavaTypeName(attribute.name)}`,
          };
        });
        const persistenceModel: JavaCreatePersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: imports.values(),
          className: `${entityType}CreatePersistenceTests`,
          activeProfile: "test",
          useCaseType,
          useCaseFieldName: toJavaFieldName(useCaseType),
          commandType,
          commandArguments: fixtures.map((fixture) => fixture.constantName),
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          identifierType: this.typeResolver.resolve(identifier.type).name,
          identifierExpression: toJavaConstantName(`${entity.name}_${identifier.name}`),
          conflictExceptionType: "ConflictException",
          conflictMessageKey: `${domainName}.already-exists`,
          conflictDefaultMessage: `${entityType} already exists.`,
          conflictCommandArguments: entity.attributes.map((attribute, index) => attribute.identifier
            ? toJavaConstantName(`${entity.name}_${attribute.name}`)
            : this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression),
          fixtures,
        };
        return {
          templateId: "configuration-create-persistence-test",
          model: persistenceModel,
          outputVariables: { ...outputVariables, className: persistenceModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate HTTP find-by-id test for entity '${entity.name}' without an identifier.`);
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("com.fasterxml.jackson.databind.JsonNode");
        imports.add("com.fasterxml.jackson.databind.ObjectMapper");
        imports.add("java.net.URI");
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.boot.test.web.server.LocalServerPort");
        imports.add("org.springframework.test.context.ActiveProfiles");
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }
        const fixtures = [
          ...entity.attributes.map((attribute, index) => {
            const javaType = this.typeResolver.resolve(attribute.type);
            imports.add(javaType.import);
            return {
              constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
              type: javaType.name,
              javaExpression: this.fixtureResolver.resolve(attribute.type, index).javaExpression,
              jsonName: attribute.name,
            };
          }),
          ...(entity.audited === true ? this.auditedDeclaredFixturesWithJsonName(entity.name) : []),
        ];
        const httpModel: JavaHttpFindByIdTestTemplateModel = {
          packageName: `${namespace}.http`,
          imports: imports.values(),
          className: `${entityType}HttpFindByIdTests`,
          activeProfile: "test",
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          fixtures,
          identifierConstantName: toJavaConstantName(`${entity.name}_${identifier.name}`),
          missingIdentifierExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
          endpointPath: toRestCollectionPath(entity.name),
        };
        return {
          templateId: "configuration-http-find-by-id-test",
          model: httpModel,
          outputVariables: { ...outputVariables, className: httpModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const httpCreateModel = createJavaHttpCreateTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );
        return {
          templateId: "configuration-http-create-test",
          model: httpCreateModel,
          outputVariables: { ...outputVariables, className: httpCreateModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const httpUpdateModel = createJavaHttpUpdateTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );
        return {
          templateId: "configuration-http-update-test",
          model: httpUpdateModel,
          outputVariables: { ...outputVariables, className: httpUpdateModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const httpPatchModel = createJavaHttpPatchTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );
        return {
          templateId: "configuration-http-patch-test",
          model: httpPatchModel,
          outputVariables: { ...outputVariables, className: httpPatchModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const httpDeleteModel = createJavaHttpDeleteTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );
        return {
          templateId: "configuration-http-delete-test",
          model: httpDeleteModel,
          outputVariables: { ...outputVariables, className: httpDeleteModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const filterPersistenceModel = createJavaQuerydslFilterPersistenceTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );

        return {
          templateId: "configuration-querydsl-filter-persistence-test",
          model: filterPersistenceModel,
          outputVariables: {
            ...outputVariables,
            className: filterPersistenceModel.className,
          },
        };
      }),
      ...request.application.entities.map((entity) => {
        const httpFilterModel = createJavaHttpFilterTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );

        return {
          templateId: "configuration-http-filter-test",
          model: httpFilterModel,
          outputVariables: {
            ...outputVariables,
            className: httpFilterModel.className,
          },
        };
      }),
      ...request.application.entities.map((entity) => {
        const pagingPersistenceModel = createJavaPagingPersistenceTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );

        return {
          templateId: "configuration-paging-persistence-test",
          model: pagingPersistenceModel,
          outputVariables: {
            ...outputVariables,
            className: pagingPersistenceModel.className,
          },
        };
      }),
      ...request.application.entities.map((entity) => {
        const filteredPagingPersistenceModel = createJavaFilteredPagingPersistenceTestModel(
          entity,
          namespace,
          this.typeResolver,
          this.fixtureResolver,
        );
        return {
          templateId: "configuration-querydsl-filter-paging-persistence-test",
          model: filteredPagingPersistenceModel,
          outputVariables: { ...outputVariables, className: filteredPagingPersistenceModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate update persistence test for entity '${entity.name}' without an identifier.`);
        const useCaseType = `Update${entityType}UseCase`;
        const commandType = `Update${entityType}Command`;
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.usecase.update.${commandType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.update.${useCaseType}`);
        imports.add(`${namespace}.core.common.exception.NotFoundException`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.test.context.ActiveProfiles");

        const originalFixtures = entity.attributes.map((attribute, index) => {
          const javaType = this.typeResolver.resolve(attribute.type);
          imports.add(javaType.import);
          return {
            attribute,
            javaType,
            constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
            javaExpression: this.fixtureResolver.resolve(attribute.type, index).javaExpression,
            accessorName: `get${toJavaTypeName(attribute.name)}`,
          };
        });
        const updatedFixtures = entity.attributes.map((attribute, index) => {
          if (attribute.identifier) return originalFixtures[index]!;
          const javaType = this.typeResolver.resolve(attribute.type);
          return {
            attribute,
            javaType,
            constantName: toJavaConstantName(`${entity.name}_updated_${attribute.name}`),
            javaExpression: this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression,
            accessorName: `get${toJavaTypeName(attribute.name)}`,
          };
        });
        const missingIdentifierFixture = {
          constantName: toJavaConstantName(`${entity.name}_missing_${identifier.name}`),
          type: this.typeResolver.resolve(identifier.type).name,
          javaExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
        };
        const declaredFixtures = [
          ...originalFixtures.map((fixture) => ({ constantName: fixture.constantName, type: fixture.javaType.name, javaExpression: fixture.javaExpression })),
          ...updatedFixtures.filter((fixture) => !fixture.attribute.identifier).map((fixture) => ({ constantName: fixture.constantName, type: fixture.javaType.name, javaExpression: fixture.javaExpression })),
          missingIdentifierFixture,
        ];
        const identifierFixture = originalFixtures.find((fixture) => fixture.attribute.identifier)!;
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }

        const persistenceModel: JavaUpdatePersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: imports.values(),
          className: `${entityType}UpdatePersistenceTests`,
          activeProfile: "test",
          useCaseType,
          useCaseFieldName: toJavaFieldName(useCaseType),
          commandType,
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          declaredFixtures,
          originalEntityConstructorArguments: entity.audited === true
            ? [...originalFixtures.map((fixture) => fixture.constantName), ...this.auditedEntityFixtureArguments()]
            : originalFixtures.map((fixture) => fixture.constantName),
          commandArguments: updatedFixtures.map((fixture) => fixture.constantName),
          assertionFixtures: updatedFixtures.map((fixture) => ({ constantName: fixture.constantName, accessorName: fixture.accessorName })),
          identifierExpression: identifierFixture.constantName,
          notFoundExceptionType: "NotFoundException",
          notFoundMessageKey: `${domainName}.not-found`,
          notFoundDefaultMessage: `${entityType} was not found.`,
          missingIdentifierExpression: missingIdentifierFixture.constantName,
          missingCommandArguments: entity.attributes.map((attribute) => attribute.identifier
            ? missingIdentifierFixture.constantName
            : updatedFixtures.find((fixture) => fixture.attribute === attribute)!.constantName),
        };
        return {
          templateId: "configuration-update-persistence-test",
          model: persistenceModel,
          outputVariables: { ...outputVariables, className: persistenceModel.className },
        };
      }),
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate delete persistence test for entity '${entity.name}' without an identifier.`);
        const useCaseType = `Delete${entityType}UseCase`;
        const commandType = `Delete${entityType}Command`;
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.common.exception.NotFoundException`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.${commandType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.${useCaseType}`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.test.context.ActiveProfiles");
        const occurrenceCounts = new Map<string, number>();
        const fixtures = entity.attributes.map((attribute) => {
          const occurrenceIndex = occurrenceCounts.get(attribute.type) ?? 0;
          occurrenceCounts.set(attribute.type, occurrenceIndex + 1);
          const javaType = this.typeResolver.resolve(attribute.type);
          imports.add(javaType.import);
          return {
            constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
            type: javaType.name,
            javaExpression: this.fixtureResolver.resolve(attribute.type, occurrenceIndex).javaExpression,
          };
        });
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }
        const persistenceModel: JavaDeletePersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: imports.values(),
          className: `${entityType}DeletePersistenceTests`,
          activeProfile: "test",
          useCaseType,
          useCaseFieldName: toJavaFieldName(useCaseType),
          commandType,
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          declaredFixtures: fixtures,
          entityConstructorArguments: entity.audited === true
            ? [...fixtures.map((fixture) => fixture.constantName), ...this.auditedEntityFixtureArguments()]
            : fixtures.map((fixture) => fixture.constantName),
          identifierExpression: toJavaConstantName(`${entity.name}_${identifier.name}`),
          missingIdentifierExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
          notFoundExceptionType: "NotFoundException",
          notFoundMessageKey: `${domainName}.not-found`,
          notFoundDefaultMessage: `${entityType} was not found.`,
        };
        return {
          templateId: "configuration-delete-persistence-test",
          model: persistenceModel,
          outputVariables: { ...outputVariables, className: persistenceModel.className },
        };
      }),
      ...request.application.entities.flatMap((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const identifier = entity.attributes.find((attribute) => attribute.identifier);
        if (identifier === undefined) throw new Error(`Cannot generate deleted-query tests for entity '${entity.name}' without an identifier.`);
        const occurrenceCounts = new Map<string, number>();
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}Command`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}UseCase`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.FindDeleted${entityType}ByIdUseCase`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.FindDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        imports.add(`${namespace}.core.common.filter.FilterExpression`);
        imports.add(`${namespace}.core.common.paging.PageRequest`);
        imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}Tombstone`);
        imports.add("java.util.List");
        imports.add("org.junit.jupiter.api.AfterEach");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.beans.factory.annotation.Autowired");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.test.context.ActiveProfiles");
        const fixtures = entity.attributes.map((attribute) => {
          const occurrenceIndex = occurrenceCounts.get(attribute.type) ?? 0;
          occurrenceCounts.set(attribute.type, occurrenceIndex + 1);
          const javaType = this.typeResolver.resolve(attribute.type);
          imports.add(javaType.import);
          return { constantName: toJavaConstantName(`${entity.name}_${attribute.name}`), type: javaType.name, javaExpression: this.fixtureResolver.resolve(attribute.type, occurrenceIndex).javaExpression };
        });
        if (entity.audited === true) {
          imports.add("java.time.LocalDateTime");
        }
        const entityConstructorArguments = entity.audited === true
          ? [...fixtures.map((fixture) => fixture.constantName), ...this.auditedEntityFixtureArguments()]
          : fixtures.map((fixture) => fixture.constantName);
        const deletedModel: JavaDeletedQueryPersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: imports.values(),
          className: `${entityType}DeletedQueryPersistenceTests`,
          activeProfile: "test",
          deleteUseCaseType: `Delete${entityType}UseCase`,
          deleteUseCaseFieldName: toJavaFieldName(`Delete${entityType}UseCase`),
          deleteCommandType: `Delete${entityType}Command`,
          deletedByIdUseCaseType: `FindDeleted${entityType}ByIdUseCase`,
          deletedByIdUseCaseFieldName: toJavaFieldName(`FindDeleted${entityType}ByIdUseCase`),
          deletedByFilterPageUseCaseType: `FindDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`,
          deletedByFilterPageUseCaseFieldName: toJavaFieldName(`FindDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`),
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          declaredFixtures: fixtures,
          entityConstructorArguments,
          identifierExpression: toJavaConstantName(`${entity.name}_${identifier.name}`),
          missingIdentifierExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
          pageRequestExpression: "PageRequest.of(0, 20, List.of())",
          tombstoneType: `${entityType}Tombstone`,
        };

        const restoreImports = new JavaImportCollector();
        restoreImports.add(`${namespace}.core.common.exception.ConflictException`);
        restoreImports.add(`${namespace}.core.common.exception.NotFoundException`);
        restoreImports.add(`${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}Command`);
        restoreImports.add(`${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}UseCase`);
        restoreImports.add(`${namespace}.core.domains.${domainName}.usecase.restore.Restore${entityType}Command`);
        restoreImports.add(`${namespace}.core.domains.${domainName}.usecase.restore.Restore${entityType}UseCase`);
        restoreImports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        restoreImports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        restoreImports.add("org.junit.jupiter.api.AfterEach");
        restoreImports.add("org.junit.jupiter.api.Test");
        restoreImports.add("org.springframework.beans.factory.annotation.Autowired");
        restoreImports.add("org.springframework.boot.test.context.SpringBootTest");
        restoreImports.add("org.springframework.test.context.ActiveProfiles");
        for (const attribute of entity.attributes) restoreImports.add(this.typeResolver.resolve(attribute.type).import);
        if (entity.audited === true) {
          restoreImports.add("java.time.LocalDateTime");
        }
        const uniqueGroupAttributes = new Set((entity.uniqueGroups ?? []).flat());
        const conflictingEntityConstructorArguments = entity.audited === true
          ? [
              ...entity.attributes.map((attribute, index) => {
                if (attribute.identifier) return this.fixtureResolver.resolve(attribute.type, 1).javaExpression;
                if (attribute.unique || uniqueGroupAttributes.has(attribute.name)) return toJavaConstantName(`${entity.name}_${attribute.name}`);
                return this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression;
              }),
              ...this.auditedEntityFixtureArguments(),
            ]
          : entity.attributes.map((attribute, index) => {
              if (attribute.identifier) return this.fixtureResolver.resolve(attribute.type, 1).javaExpression;
              if (attribute.unique || uniqueGroupAttributes.has(attribute.name)) return toJavaConstantName(`${entity.name}_${attribute.name}`);
              return this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression;
            });
        const restoreModel: JavaRestorePersistenceTestTemplateModel = {
          packageName: `${namespace}.persistence`,
          imports: restoreImports.values(),
          className: `${entityType}RestorePersistenceTests`,
          activeProfile: "test",
          deleteUseCaseType: `Delete${entityType}UseCase`,
          deleteUseCaseFieldName: toJavaFieldName(`Delete${entityType}UseCase`),
          deleteCommandType: `Delete${entityType}Command`,
          restoreUseCaseType: `Restore${entityType}UseCase`,
          restoreUseCaseFieldName: toJavaFieldName(`Restore${entityType}UseCase`),
          restoreCommandType: `Restore${entityType}Command`,
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          persistenceEntityType: `${entityType}Entity`,
          declaredFixtures: fixtures,
          entityConstructorArguments,
          identifierExpression: toJavaConstantName(`${entity.name}_${identifier.name}`),
          missingIdentifierExpression: this.fixtureResolver.resolve(identifier.type, 1).javaExpression,
          conflictingEntityConstructorArguments,
          hasUniqueAttribute: entity.attributes.some((attribute) => attribute.unique === true)
            || (entity.uniqueGroups?.length ?? 0) > 0,
          notFoundExceptionType: "NotFoundException",
          conflictExceptionType: "ConflictException",
          conflictMessageKey: `${domainName}.already-exists`,
        };

        const httpImports = new JavaImportCollector();
        httpImports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
        httpImports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
        httpImports.add("com.fasterxml.jackson.databind.ObjectMapper");
        httpImports.add("java.net.http.HttpClient");
        httpImports.add("java.net.http.HttpRequest");
        httpImports.add("java.net.http.HttpResponse");
        httpImports.add("org.junit.jupiter.api.AfterEach");
        httpImports.add("org.junit.jupiter.api.Test");
        httpImports.add("org.springframework.beans.factory.annotation.Autowired");
        httpImports.add("org.springframework.boot.test.context.SpringBootTest");
        httpImports.add("org.springframework.boot.test.web.server.LocalServerPort");
        httpImports.add("org.springframework.test.context.ActiveProfiles");
        for (const fixture of fixtures) httpImports.add(fixture.type === "UUID" ? "java.util.UUID" : this.typeResolver.resolve(entity.attributes.find((attribute) => toJavaConstantName(`${entity.name}_${attribute.name}`) === fixture.constantName)!.type).import);
        if (entity.audited === true) {
          httpImports.add("java.time.LocalDateTime");
        }
        const httpDeletedModel: JavaHttpDeletedQueryTestTemplateModel = {
          packageName: `${namespace}.http`,
          imports: insertUriImport(httpImports.values()),
          className: `${entityType}HttpDeletedQueryTests`,
          activeProfile: "test",
          endpointPath: toRestCollectionPath(entity.name),
          persistenceEntityType: `${entityType}Entity`,
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          identifierConstantName: toJavaConstantName(`${entity.name}_${identifier.name}`),
          entityConstructorArguments,
          fixtures,
        };
        const httpRestoreModel: JavaHttpRestoreTestTemplateModel = {
          packageName: `${namespace}.http`,
          imports: insertUriImport(httpImports.values()),
          className: `${entityType}HttpRestoreTests`,
          activeProfile: "test",
          endpointPath: toRestCollectionPath(entity.name),
          persistenceEntityType: `${entityType}Entity`,
          repositoryType: `${entityType}Repository`,
          repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
          identifierConstantName: toJavaConstantName(`${entity.name}_${identifier.name}`),
          entityConstructorArguments,
          conflictingEntityConstructorArguments,
          fixtures,
          restoreResponseStatus: 204,
        };
        return [
          { templateId: "configuration-deleted-query-persistence-test", model: deletedModel, outputVariables: { ...outputVariables, className: deletedModel.className } },
          { templateId: "configuration-restore-persistence-test", model: restoreModel, outputVariables: { ...outputVariables, className: restoreModel.className } },
          { templateId: "configuration-http-deleted-query-test", model: httpDeletedModel, outputVariables: { ...outputVariables, className: httpDeletedModel.className } },
          { templateId: "configuration-http-restore-test", model: httpRestoreModel, outputVariables: { ...outputVariables, className: httpRestoreModel.className } },
        ];
      }),
    ];
  }
}

function insertUriImport(imports: readonly string[]): readonly string[] {
  const httpImportIndex = imports.findIndex((value) => value.startsWith("java.net.http."));
  if (httpImportIndex < 0) return [...imports, "java.net.URI"];
  return [
    ...imports.slice(0, httpImportIndex),
    "java.net.URI",
    ...imports.slice(httpImportIndex),
  ];
}
