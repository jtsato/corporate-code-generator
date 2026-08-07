import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleCoreArtifactProducer } from "../src/index.js";

function buildRequest({ audited = false }: { readonly audited?: boolean } = {}) {
  return {
    application: {
      schemaVersion: "1.0",
      name: "wallet-service",
      namespace: "io.github.jtsato.walletservice",
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "id", type: "uuid" as const, required: true, identifier: true },
          { name: "balance", type: "decimal" as const, required: true, identifier: false },
        ],
        audited,
      }],
    },
    profile: {
      id: "java-spring-clean-multimodule",
      version: "0.1.0",
      technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
      architecture: { style: "clean-architecture" },
      templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
      modules: [{ id: "core", requires: [] }],
    },
    modules: [{ id: "core", requires: [] }],
  };
}

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
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "balance", type: "decimal", required: true, identifier: false },
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

    const domainArtifact = artifacts.find((artifact) => artifact.templateId === "core-domain-entity");
    expect(domainArtifact).toMatchObject({
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "Wallet",
      },
      model: {
        packageName: "io.github.jtsato.walletservice.core.domains.wallet.model",
        fields: [
          { name: "id", type: "UUID", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
          { name: "balance", type: "BigDecimal", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
        ],
        imports: [
          "io.github.jtsato.walletservice.core.common.validation.SelfValidating",
          "jakarta.validation.constraints.NotNull",
          "java.math.BigDecimal",
          "java.util.UUID",
        ],
        extendsType: "SelfValidating<Wallet>",
        validateSelf: true,
      },
    });

    const gatewayArtifact = artifacts.find((artifact) => artifact.templateId === "core-gateway");
    expect(gatewayArtifact).toMatchObject({
      outputVariables: { className: "WalletGateway" },
      model: {
        packageName: "io.github.jtsato.walletservice.core.domains.wallet.gateway",
        imports: [
          "io.github.jtsato.walletservice.core.common.filter.FilterExpression",
          "io.github.jtsato.walletservice.core.common.paging.PageRequest",
          "io.github.jtsato.walletservice.core.common.paging.PageResult",
          "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
          "io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone",
          "java.util.List",
          "java.util.UUID",
        ],
        interfaceName: "WalletGateway",
        entityType: "Wallet",
        findAllMethodName: "findAll",
        findByFilterMethodName: "findByFilter",
        filterExpressionType: "FilterExpression",
        filterExpressionParameterName: "filterExpression",
        findPageMethodName: "findPage",
        findByFilterPageMethodName: "findByFilterPage",
        findDeletedByIdMethodName: "findDeletedById",
        findDeletedByFilterPageMethodName: "findDeletedByFilterPage",
        pageRequestType: "PageRequest",
        pageRequestParameterName: "pageRequest",
        pageResultType: "PageResult",
        deleteMethodName: "deleteById",
        deleteParameterName: "id",
        restoreMethodName: "restoreById",
      },
    });

    expect(artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-id",
        model: expect.objectContaining({
          interfaceName: "FindDeletedWalletByIdUseCase",
          identifierType: "UUID",
          identifierParameterName: "id",
          executeMethodName: "execute",
        }),
      }),
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-id-interactor",
        model: expect.objectContaining({
          className: "FindDeletedWalletByIdUseCaseInteractor",
          interfaceName: "FindDeletedWalletByIdUseCase",
          gatewayFindByIdMethodName: "findDeletedById",
        }),
      }),
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-id-interactor-test",
        model: expect.objectContaining({
          className: "FindDeletedWalletByIdUseCaseInteractorTests",
          gatewayFindByIdMethodName: "findDeletedById",
        }),
      }),
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-filter-page",
        model: expect.objectContaining({
          interfaceName: "FindDeletedWalletsByFilterPageUseCase",
          filterExpressionType: "FilterExpression",
          pageRequestType: "PageRequest",
          pageResultType: "PageResult",
        }),
      }),
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-filter-page-interactor",
        model: expect.objectContaining({
          className: "FindDeletedWalletsByFilterPageUseCaseInteractor",
          interfaceName: "FindDeletedWalletsByFilterPageUseCase",
          gatewayFindByFilterPageMethodName: "findDeletedByFilterPage",
        }),
      }),
      expect.objectContaining({
        templateId: "core-find-deleted-usecase-by-filter-page-interactor-test",
        model: expect.objectContaining({
          className: "FindDeletedWalletsByFilterPageUseCaseInteractorTests",
          gatewayFindByFilterPageMethodName: "findDeletedByFilterPage",
        }),
      }),
      expect.objectContaining({
        templateId: "core-restore-command",
        model: expect.objectContaining({
          className: "RestoreWalletCommand",
          fields: [{ name: "id", type: "UUID", requiredMessageKey: "common.identifier.required", requiredDefaultMessage: "Identifier is required." }],
        }),
      }),
      expect.objectContaining({
        templateId: "core-restore-usecase",
        model: expect.objectContaining({
          interfaceName: "RestoreWalletUseCase",
          commandType: "RestoreWalletCommand",
          executeMethodName: "execute",
        }),
      }),
      expect.objectContaining({
        templateId: "core-restore-usecase-interactor",
        model: expect.objectContaining({
          className: "RestoreWalletUseCaseInteractor",
          interfaceName: "RestoreWalletUseCase",
          commandType: "RestoreWalletCommand",
          gatewayRestoreMethodName: "restoreById",
        }),
      }),
      expect.objectContaining({
        templateId: "core-restore-usecase-interactor-test",
        model: expect.objectContaining({
          className: "RestoreWalletUseCaseInteractorTests",
          commandType: "RestoreWalletCommand",
          gatewayRestoreMethodName: "restoreById",
        }),
      }),
    ]));

    const patchCommandArtifact = artifacts.find((artifact) => artifact.templateId === "core-patch-command");
    expect(patchCommandArtifact).toMatchObject({
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "PatchWalletCommand",
      },
      model: {
        packageName: "io.github.jtsato.walletservice.core.domains.wallet.usecase.patch",
        className: "PatchWalletCommand",
        fields: [
          {
            name: "id",
            type: "UUID",
            requiredMessageKey: "common.identifier.required",
            requiredDefaultMessage: "Identifier is required.",
          },
          {
            name: "balance",
            type: "BigDecimal",
            requiredMessageKey: "wallet.balance.required",
            requiredDefaultMessage: "Balance is required.",
          },
          {
            name: "balanceProvided",
            type: "boolean",
          },
        ],
        atLeastOneFieldMessageKey: "common.patch.field.required",
        atLeastOneFieldDefaultMessage: "At least one field must be provided.",
      },
    });

    const patchInteractorArtifact = artifacts.find((artifact) => artifact.templateId === "core-patch-usecase-interactor");
    expect(patchInteractorArtifact).toMatchObject({
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        domainName: "wallet",
        className: "PatchWalletUseCaseInteractor",
      },
      model: {
        packageName: "io.github.jtsato.walletservice.core.domains.wallet.usecase.patch",
        className: "PatchWalletUseCaseInteractor",
        interfaceName: "PatchWalletUseCase",
        commandType: "PatchWalletCommand",
        gatewayType: "WalletGateway",
        gatewayFieldName: "walletGateway",
        entityType: "Wallet",
        executeMethodName: "execute",
        gatewayFindByIdMethodName: "findById",
        gatewayUpdateMethodName: "update",
        imports: [
          "io.github.jtsato.walletservice.core.common.exception.FieldViolation",
          "io.github.jtsato.walletservice.core.common.exception.ValidationException",
          "io.github.jtsato.walletservice.core.domains.wallet.gateway.WalletGateway",
          "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
          "io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand",
          "java.util.List",
        ],
      },
    });
  });

  it("models explicit null and omitted optional PATCH fields separately", () => {
    const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();
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
            { name: "status", type: "string", required: true, identifier: false },
          ],
        }],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "core", requires: [] }],
      },
      modules: [{ id: "core", requires: [] }],
    });

    const patchTestArtifact = artifacts.find((artifact) => artifact.templateId === "core-patch-usecase-interactor-test");
    expect(patchTestArtifact?.model).toMatchObject({
      hasOptionalNullScenario: true,
      optionalNullFieldName: "Label",
      hasOmittedFieldScenario: true,
      omittedFieldName: "Label",
    });
    expect(patchTestArtifact?.model.optionalNullCommandArguments).toHaveLength(5);
    expect(patchTestArtifact?.model.omittedCommandArguments).toHaveLength(5);
    expect(patchTestArtifact?.model.optionalNullCommandArguments).toContain("null");
    expect(patchTestArtifact?.model.omittedCommandArguments).toContain("false");
  });

  it("emits the GetLocalDateTime port and implementation only when an entity is audited", () => {
    const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();

    const withoutAudited = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{
          name: "Wallet",
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "balance", type: "decimal", required: true, identifier: false },
          ],
          audited: false,
        }],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "core", requires: [] }],
      },
      modules: [{ id: "core", requires: [] }],
    });
    expect(withoutAudited.some((artifact) => artifact.templateId === "core-get-local-date-time")).toBe(false);
    expect(withoutAudited.some((artifact) => artifact.templateId === "core-get-local-date-time-impl")).toBe(false);

    const withAudited = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{
          name: "Wallet",
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "balance", type: "decimal", required: true, identifier: false },
          ],
          audited: true,
        }],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "core", requires: [] }],
      },
      modules: [{ id: "core", requires: [] }],
    });
    const port = withAudited.find((artifact) => artifact.templateId === "core-get-local-date-time");
    const impl = withAudited.find((artifact) => artifact.templateId === "core-get-local-date-time-impl");
    expect(port?.model).toMatchObject({ packageName: "io.github.jtsato.walletservice.core.common.time" });
    expect(port?.outputVariables).toMatchObject({ className: "GetLocalDateTime" });
    expect(impl?.model).toMatchObject({ packageName: "io.github.jtsato.walletservice.core.common.time" });
    expect(impl?.outputVariables).toMatchObject({ className: "GetLocalDateTimeImpl" });
  });

  it("adds createdAt/updatedAt to the Wallet model and tombstone only when audited", () => {
    const producer = new JavaSpringCleanMultimoduleCoreArtifactProducer();
    const artifacts = producer.produce(buildRequest({ audited: true }));

    const domainEntity = artifacts.find((artifact) => artifact.templateId === "core-domain-entity");
    expect(domainEntity?.model).toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({ name: "createdAt", type: "LocalDateTime" }),
        expect.objectContaining({ name: "updatedAt", type: "LocalDateTime" }),
      ]),
    });
    expect((domainEntity?.model as { fields: { validationAnnotation?: string }[] }).fields.find((field) => field.name === "createdAt")?.validationAnnotation).toBeUndefined();

    const tombstone = artifacts.find((artifact) => artifact.templateId === "core-domain-tombstone");
    expect(tombstone?.model).toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({ name: "createdAt" }),
        expect.objectContaining({ name: "updatedAt" }),
        expect.objectContaining({ name: "deletedAt" }),
      ]),
    });
  });
});
