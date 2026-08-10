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
  it("renders composite active uniqueness constraints and conflict predicates", async () => {
    const profile = await new ProfileResolver(resolve(rootDirectory, "profiles")).resolve("java-spring-clean-multimodule");
    const modules = new ModuleResolver().resolveAll(profile.modules);
    const resolvedPack = await new TemplatePackResolver(resolve(rootDirectory, "template-packs")).resolve(profile.templatePack);
    const plan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({
      application: {
        schemaVersion: "1.0",
        name: "catalog-service",
        namespace: "example.catalog",
        entities: [{
          name: "Product",
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true, unique: false },
            { name: "tenantId", type: "uuid", required: true, identifier: false, unique: false },
            { name: "externalId", type: "string", required: true, identifier: false, unique: false },
          ],
          uniqueGroups: [["tenantId", "externalId"]],
        }],
      },
      profile,
      modules,
    });

    const entity = plan.operations.find((operation) => operation.targetPath.endsWith("ProductEntity.java"));
    const provider = plan.operations.find((operation) => operation.targetPath.endsWith("ProductGatewayProvider.java"));
    expect(entity?.content).toContain('@UniqueConstraint(name = "uk_product_g2_tenant_id_external_id_active_scope", columnNames = { "tenant_id", "external_id", "deletion_scope" })');
    expect(provider?.content).toContain("product.getTenantId() != null && product.getExternalId() != null");
    expect(provider?.content).toContain("ENTITY.tenantId.eq(product.getTenantId())");
    expect(provider?.content).toContain("ENTITY.externalId.eq(product.getExternalId())");
  });

  it("preserves createdAt across update only when the entity is audited", async () => {
    const profile = await new ProfileResolver(resolve(rootDirectory, "profiles")).resolve("java-spring-clean-multimodule");
    const modules = new ModuleResolver().resolveAll(profile.modules);
    const resolvedPack = await new TemplatePackResolver(resolve(rootDirectory, "template-packs")).resolve(profile.templatePack);
    const buildPlan = async (audited: boolean) => new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{
          name: "Wallet",
          audited,
          attributes: [
            { name: "id", type: "uuid", identifier: true, required: true },
            { name: "balance", type: "decimal", identifier: false, required: true },
          ],
        }],
      },
      profile,
      modules,
    });

    const auditedPlan = await buildPlan(true);
    const auditedProvider = auditedPlan.operations.find((operation) => operation.targetPath.endsWith("WalletGatewayProvider.java"));
    const auditedContent = auditedProvider?.content ?? "";
    expect(auditedContent).toContain("WalletEntity existing = walletRepository.findById(wallet.getId())");
    expect(auditedContent).toContain("entity.setCreatedAt(existing.getCreatedAt());");

    const updateMethodStart = auditedContent.indexOf("public Wallet update(Wallet wallet)");
    expect(updateMethodStart).toBeGreaterThan(-1);
    const updateMethodBody = auditedContent.slice(updateMethodStart);

    const mapperCallIndex = updateMethodBody.indexOf("WalletPersistenceMapper.toEntity(wallet)");
    const setCreatedAtIndex = updateMethodBody.indexOf("entity.setCreatedAt(existing.getCreatedAt());");
    const saveCallIndex = updateMethodBody.indexOf("walletRepository.save(entity)");
    expect(mapperCallIndex).toBeGreaterThan(-1);
    expect(setCreatedAtIndex).toBeGreaterThan(-1);
    expect(saveCallIndex).toBeGreaterThan(-1);
    expect(setCreatedAtIndex).toBeGreaterThan(mapperCallIndex);
    expect(setCreatedAtIndex).toBeLessThan(saveCallIndex);

    const notAuditedPlan = await buildPlan(false);
    const notAuditedProvider = notAuditedPlan.operations.find((operation) => operation.targetPath.endsWith("WalletGatewayProvider.java"));
    const notAuditedContent = notAuditedProvider?.content ?? "";
    expect(notAuditedContent).not.toContain("setCreatedAt");
    expect(notAuditedContent).not.toContain("existing");
  });

  it("renders the one hundred and sixty-eight complete Maven reactor artifacts", async () => {
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

    expect(operations).toHaveLength(168);
    expect(operations.map((operation) => operation.targetPath)).toEqual([
      "pom.xml",
      "core/pom.xml",
      "entrypoints/rest/pom.xml",
      "infra/database/pom.xml",
      "configuration/pom.xml",
      ".github/workflows/java-ci.yml",
      ".gitignore",
      "README.md",
      "Dockerfile",
      ".dockerignore",
      "docker-compose.yml",
      "run.sh",
      "run.cmd",
      "Smoke.http",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/WalletTombstone.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/gateway/WalletGateway.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletCommand.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/create/CreateWalletUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletCommand.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/update/UpdateWalletUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/patch/PatchWalletCommand.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/patch/PatchWalletUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/patch/PatchWalletUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/patch/PatchWalletUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletCommand.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/delete/DeleteWalletUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/restore/RestoreWalletCommand.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/restore/RestoreWalletUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/restore/RestoreWalletUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/restore/RestoreWalletUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsUseCaseInteractor.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletByIdUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletByIdUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletByIdUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletByIdUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsByFilterPageUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletsByFilterPageUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletsByFilterPageUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindDeletedWalletsByFilterPageUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCase.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCaseInteractor.java",
      "core/src/test/java/io/github/jtsato/walletservice/core/domains/wallet/usecase/find/FindWalletsPageUseCaseInteractorTests.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ApplicationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/FieldViolation.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ValidationException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/NotFoundException.java",
      "core/src/main/java/io/github/jtsato/walletservice/core/common/exception/ConflictException.java",
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
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletApi.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/request/CreateWalletRequest.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/request/UpdateWalletRequest.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/request/PatchWalletRequest.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletTombstoneResponse.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletControllerTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/filter/RestFilterOperator.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/filter/RestFilterFieldDefinition.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/filter/RestFilterDefinition.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/filter/RestFilterParser.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/common/filter/RestFilterParserTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/filter/WalletRestFilterDefinition.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/filter/WalletRestFilterDefinitionTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortFieldDefinition.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortDefinition.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortParser.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/common/sort/RestSortParserTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/sort/WalletRestSortDefinition.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/sort/WalletRestSortDefinitionTests.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/ResponseStatus.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/WalletPageResponse.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/common/WalletTombstonePageResponse.java",
      "entrypoints/rest/src/test/java/io/github/jtsato/walletservice/RestTestApplication.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/entity/WalletEntity.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/mapper/WalletPersistenceMapper.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/repository/WalletRepository.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProvider.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderTests.java",
      "infra/database/src/test/resources/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderTests.sql",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/WalletGatewayProviderIT.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterFieldDefinition.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterDefinition.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterValueConverter.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterMapper.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterValueConverterTests.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/filter/QuerydslFilterMapperTests.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/filter/WalletQuerydslFilterDefinition.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/filter/WalletQuerydslFilterDefinitionTests.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapper.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapper.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageRequestMapperTests.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/common/paging/SpringDataPageResultMapperTests.java",
      "infra/database/src/main/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilder.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/infra/database/domains/wallet/query/WalletPredicateBuilderTests.java",
      "infra/database/src/test/java/io/github/jtsato/walletservice/PersistenceTestApplication.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/domains/wallet/WalletConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandler.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/i18n/LocaleConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsProperties.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/CorsWebConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/web/RestFilterWebConfiguration.java",
      "configuration/src/main/java/io/github/jtsato/walletservice/configuration/openapi/OpenApiConfiguration.java",
      "configuration/src/main/resources/application.yaml",
      "configuration/src/main/resources/application-local.yaml",
      "configuration/src/main/resources/application-test.yaml",
      "configuration/src/main/resources/application-prod.yaml",
      "configuration/src/main/resources/messages.properties",
      "configuration/src/main/resources/messages_pt_BR.properties",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletServiceApplicationTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/architecture/LayerDependencyArchitectureTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/architecture/FrameworkIsolationArchitectureTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/architecture/PackageStructureArchitectureTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/configuration/exception/GlobalExceptionHandlerTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/LocaleNegotiationTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletCorsSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletOpenApiSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/WalletHttpSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/smoke/ActuatorHealthSmokeTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpPersistenceReadTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletFindByIdPersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletCreatePersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpFindByIdTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpCreateTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpUpdateTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpPatchTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpDeleteTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletQuerydslFilterPersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpFilterTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletPagingPersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletQuerydslFilterPagingPersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletUpdatePersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletDeletePersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletDeletedQueryPersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/persistence/WalletRestorePersistenceTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpDeletedQueryTests.java",
      "configuration/src/test/java/io/github/jtsato/walletservice/http/WalletHttpRestoreTests.java",
    ]);

    const controller = operations.find((operation) => operation.targetPath.endsWith("/WalletController.java"));
    expect(controller?.content).toContain('@PutMapping("/{id}")');
    expect(controller?.content).toContain("UpdateWalletRequest request");
    expect(controller?.content).toContain("return WalletResponse.from(updated);");
    expect(controller?.content).toContain('@PatchMapping("/{id}")');
    expect(controller?.content).toContain("PatchWalletRequest request");
    expect(controller?.content).toContain("return WalletResponse.from(patched);");
    expect(controller?.content).toContain('@DeleteMapping("/{id}")');
    expect(controller?.content).toContain("new DeleteWalletCommand(id)");
    expect(controller?.content).toContain("return ResponseEntity.noContent().build();");
    for (const operation of operations) {
      const goldenModule = goldenModuleFor(operation.targetPath);
      const golden = await readFile(resolve(
        rootDirectory,
        "tests",
        "golden",
        "java-spring-clean-multimodule",
        goldenModule,
        goldenPathFor(operation.targetPath),
      ), "utf8");
      expect(normalize(operation.content)).toBe(normalize(golden));
    }
  });
});

function normalize(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

// The generated `.gitignore` is stored without its leading dot so that it does
// not act as a live ignore file over the golden tree itself. `.dockerignore`
// follows the same convention so both root ignore files read alike in the
// golden tree.
const dotlessGoldenPaths = new Map([
  [".gitignore", "gitignore"],
  [".dockerignore", "dockerignore"],
]);

function goldenPathFor(targetPath: string): string {
  return dotlessGoldenPaths.get(targetPath) ?? targetPath;
}

function goldenModuleFor(targetPath: string): string {
  if (targetPath.startsWith("core/src/")) return "core";
  if (targetPath.startsWith("entrypoints/rest/src/")) return "entrypoints-rest";
  if (targetPath.startsWith("infra/database/src/")) return "infra-database";
  if (targetPath.startsWith("configuration/src/")) return "configuration";
  return "build";
}
