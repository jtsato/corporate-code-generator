import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GenerationPlanner,
  ModuleResolver,
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  ProfileResolver,
  SchemaValidator,
  SchemaVersionDetector,
  SemanticValidator,
  TemplatePackResolver,
} from "@corporate-code-generator/core";
import { JavaSpringCleanMultimoduleBuildArtifactProducer } from "@corporate-code-generator/adapter-java";
import { JavaSpringCleanMultimoduleConfigurationArtifactProducer } from "@corporate-code-generator/adapter-java";
import { JavaSpringCleanMultimoduleCoreArtifactProducer } from "@corporate-code-generator/adapter-java";
import { JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer } from "@corporate-code-generator/adapter-java";
import { JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer } from "@corporate-code-generator/adapter-java";
import { NunjucksTemplateEngine } from "@corporate-code-generator/template-engine-nunjucks";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("Java multi-module generation", () => {
  it("renders the sixty-three complete Maven reactor artifacts", async () => {
    const modelPath = resolve(rootDirectory, "examples", "wallet-service", "model.yaml");
    const document = await new ModelLoader().load(modelPath);
    const schemaVersion = new SchemaVersionDetector().detect(document);
    if (schemaVersion === undefined) throw new Error("Expected schema version.");
    new SchemaValidator(await new ModelSchemaRegistry().get(schemaVersion)).validate(document);
    const application = new ModelParser().parse(document);
    new SemanticValidator().validate(application);
    const profile = await new ProfileResolver(resolve(rootDirectory, "profiles")).resolve("java-spring-clean-multimodule");
    const modules = new ModuleResolver().resolveAll(profile.modules);
    const resolvedPack = await new TemplatePackResolver(resolve(rootDirectory, "template-packs")).resolve(profile.templatePack);
    const buildPlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleBuildArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const corePlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleCoreArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const restPlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const infraDatabasePlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const configurationPlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleConfigurationArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const operations = [
      ...buildPlan.operations,
      ...corePlan.operations,
      ...restPlan.operations,
      ...infraDatabasePlan.operations,
      ...configurationPlan.operations,
    ];

    expect(operations).toHaveLength(63);
    expect(operations.map((operation) => operation.targetPath)).toEqual([
      "pom.xml", "core/pom.xml", "entrypoints/rest/pom.xml", "infra/database/pom.xml", "configuration/pom.xml", ".github/workflows/java-ci.yml",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/gateway/WalletGateway.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCaseInteractor.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ApplicationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/FieldViolation.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ValidationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/NotFoundException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/validation/SelfValidating.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/SortDirection.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/SortOrder.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/PageRequest.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/paging/PageResult.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/model/WalletValidationTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/SortOrderTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/PageRequestTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/paging/PageResultTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterOperator.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterCondition.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupOperator.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterGroup.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/filter/FilterExpression.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterConditionTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterGroupTests.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/common/filter/FilterExpressionTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/ResponseStatus.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/entity/WalletEntity.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/mapper/WalletPersistenceMapper.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/repository/WalletRepository.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/domains/wallet/WalletGatewayProvider.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapper.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapper.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapperTests.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapperTests.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilder.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilderTests.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/domains/wallet/WalletConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandler.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsProperties.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsWebConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/openapi/OpenApiConfiguration.java",
      "configuration/src/main/resources/application.yaml",
      "configuration/src/main/resources/application-local.yaml",
      "configuration/src/main/resources/application-test.yaml",
      "configuration/src/main/resources/application-prod.yaml",
      "configuration/src/main/resources/messages.properties",
      "configuration/src/main/resources/messages_pt_BR.properties",
      "configuration/src/test/java/io/github/jtsato/walletservice/WalletServiceApplicationTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/architecture/ArchitectureTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandlerTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/WalletCorsSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/WalletOpenApiSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/WalletHttpSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/WalletHttpPersistenceReadTests.java",
    ]);
    for (const operation of operations) {
      const goldenModule = goldenModuleFor(operation.targetPath);
      const golden = await readFile(resolve(
        rootDirectory,
        "tests",
        "golden",
        "java-spring-clean-multimodule",
        goldenModule,
        operation.targetPath,
      ), "utf8");
      expect(normalize(operation.content)).toBe(normalize(golden));
    }
  });
});

function normalize(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

function goldenModuleFor(targetPath: string): string {
  if (targetPath.startsWith("core/src/")) return "core";
  if (targetPath.startsWith("entrypoints/rest/src/")) return "entrypoints-rest";
  if (targetPath.startsWith("infra/database/src/")) return "infra-database";
  if (targetPath.startsWith("configuration/src/")) return "configuration";
  return "build";
}
