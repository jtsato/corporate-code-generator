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
import type { JavaArchUnitTestTemplateModel } from "../model/JavaArchUnitTestTemplateModel.js";
import type { JavaDomainConfigurationTemplateModel } from "../model/JavaDomainConfigurationTemplateModel.js";
import type { JavaHttpPersistenceReadTestTemplateModel } from "../model/JavaHttpPersistenceReadTestTemplateModel.js";
import type { JavaHttpSmokeTestTemplateModel } from "../model/JavaHttpSmokeTestTemplateModel.js";
import type { JavaSpringBootApplicationTestTemplateModel } from "../model/JavaSpringBootApplicationTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export class JavaSpringCleanMultimoduleConfigurationArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "configuration";

  public constructor(
    private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver(),
    private readonly fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
  ) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java bootstrap generation requires an application namespace.");
    const className = `${toJavaTypeName(request.application.name)}Application`;
    const model: JavaBootstrapTemplateModel = { packageName: namespace, className };
    const outputVariables = { packagePath: namespace.replaceAll(".", "/") };

    const applicationTest: JavaSpringBootApplicationTestTemplateModel = {
      packageName: namespace,
      imports: ["org.junit.jupiter.api.Test", "org.springframework.boot.test.context.SpringBootTest", "org.springframework.test.context.ActiveProfiles"],
      className: `${className}Tests`,
      testMethodName: "contextLoads",
      activeProfile: "test",
    };
    const applicationYaml: JavaApplicationYamlTemplateModel = { applicationName: request.application.name };
    const corsProperties: JavaCorsPropertiesTemplateModel = {
      packageName: `${namespace}.configuration.web`, className: "CorsProperties",
    };
    const corsWebConfiguration: JavaCorsWebConfigurationTemplateModel = {
      packageName: `${namespace}.configuration.web`, className: "CorsWebConfiguration", propertiesClassName: corsProperties.className,
    };
    const architectureTest: JavaArchUnitTestTemplateModel = {
      packageName: `${namespace}.architecture`,
      className: "ArchitectureTests",
      basePackage: namespace,
    };
    const exceptionPackage = `${namespace}.configuration.exception`;
    const messages = [
      { key: "common.error.invalid-request", value: "Invalid request." },
      { key: "common.error.not-found", value: "Resource not found." },
      { key: "common.error.internal-server-error", value: "Internal server error." },
    ];
    const portugueseMessages = [
      { key: "common.error.invalid-request", value: "Requisição inválida." },
      { key: "common.error.not-found", value: "Recurso não encontrado." },
      { key: "common.error.internal-server-error", value: "Erro interno do servidor." },
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
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}Interactor`);
        imports.add(`${namespace}.infra.domains.${domainName}.${gatewayType}Provider`);
        imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.springframework.context.annotation.Bean");
        imports.add("org.springframework.context.annotation.Configuration");
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
      { templateId: "configuration-global-exception-handler", model: { packageName: exceptionPackage, responseStatusPackageName: `${namespace}.entrypoint.rest.common`, coreExceptionPackageName: `${namespace}.core.common.exception` }, outputVariables: { ...outputVariables, className: "GlobalExceptionHandler" } },
      { templateId: "configuration-cors-properties", model: corsProperties, outputVariables: { ...outputVariables, className: corsProperties.className } },
      { templateId: "configuration-cors-web-configuration", model: corsWebConfiguration, outputVariables: { ...outputVariables, className: corsWebConfiguration.className } },
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
        templateId: "configuration-architecture-test",
        model: architectureTest,
        outputVariables: { ...outputVariables, className: architectureTest.className },
      },
      { templateId: "configuration-global-exception-handler-test", model: { packageName: exceptionPackage, className: "GlobalExceptionHandlerTests", basePackage: namespace }, outputVariables: { ...outputVariables, className: "GlobalExceptionHandlerTests" } },
      ...request.application.entities.map((entity) => {
        const corsSmokeModel: JavaCorsSmokeTestTemplateModel = {
          packageName: namespace,
          className: `${toJavaTypeName(entity.name)}CorsSmokeTests`,
          endpointPath: toRestCollectionPath(entity.name),
          allowedOrigin: "http://localhost:3000",
          expectedStatusCode: 200,
        };
        return { templateId: "configuration-cors-smoke-test", model: corsSmokeModel, outputVariables: { ...outputVariables, className: corsSmokeModel.className } };
      }),
      ...request.application.entities.map((entity) => {
        const entityType = toJavaTypeName(entity.name);
        const imports = new JavaImportCollector();
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
        imports.add("org.junit.jupiter.api.Test");
        imports.add("org.springframework.boot.test.context.SpringBootTest");
        imports.add("org.springframework.boot.test.web.server.LocalServerPort");
        imports.add("org.springframework.test.context.ActiveProfiles");
        const httpSmokeModel: JavaHttpSmokeTestTemplateModel = {
          packageName: namespace,
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
          expectedStatusCode: 200,
          expectedBody: "[]",
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
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const persistenceEntityType = `${entityType}Entity`;
        const repositoryType = `${entityType}Repository`;
        const repositoryFieldName = toJavaFieldName(repositoryType);
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.infra.domains.${domainName}.entity.${persistenceEntityType}`);
        imports.add(`${namespace}.infra.domains.${domainName}.repository.${repositoryType}`);
        imports.add("java.net.http.HttpClient");
        imports.add("java.net.http.HttpRequest");
        imports.add("java.net.http.HttpResponse");
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
        const expectedBody = `[{${
          fixtureValues.map(({ attribute, value }) =>
            `${JSON.stringify(attribute.name)}:${value.jsonLiteral}`,
          ).join(",")
        }}]`;
        const persistenceReadModel: JavaHttpPersistenceReadTestTemplateModel = {
          packageName: namespace,
          imports: insertUriImport(imports.values()),
          className: `${entityType}HttpPersistenceReadTests`,
          fixtures: fixtureValues.map(({ javaType, value, constantName }) => ({
            constantName,
            type: javaType.name,
            javaExpression: value.javaExpression,
          })),
          entityType: persistenceEntityType,
          entityConstructorArguments: fixtureValues.map(({ constantName }) => constantName),
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
          expectedStatusCode: 200,
          expectedBodyExpression: JSON.stringify(expectedBody),
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
