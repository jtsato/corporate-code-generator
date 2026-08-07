import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaCreateCommandTemplateModel } from "../model/JavaCreateCommandTemplateModel.js";
import type { JavaCreateUseCaseInteractorTemplateModel } from "../model/JavaCreateUseCaseInteractorTemplateModel.js";
import type { JavaCreateUseCaseInteractorTestTemplateModel } from "../model/JavaCreateUseCaseInteractorTestTemplateModel.js";
import type { JavaCreateUseCaseTemplateModel } from "../model/JavaCreateUseCaseTemplateModel.js";
import type { JavaDeleteCommandTemplateModel } from "../model/JavaDeleteCommandTemplateModel.js";
import type { JavaDeleteUseCaseInteractorTemplateModel } from "../model/JavaDeleteUseCaseInteractorTemplateModel.js";
import type { JavaDeleteUseCaseInteractorTestTemplateModel } from "../model/JavaDeleteUseCaseInteractorTestTemplateModel.js";
import type { JavaDeleteUseCaseTemplateModel } from "../model/JavaDeleteUseCaseTemplateModel.js";
import type { JavaFindDeletedUseCaseTemplateModel } from "../model/JavaFindDeletedUseCaseTemplateModel.js";
import type { JavaUpdateCommandTemplateModel } from "../model/JavaUpdateCommandTemplateModel.js";
import type { JavaUpdateUseCaseInteractorTemplateModel } from "../model/JavaUpdateUseCaseInteractorTemplateModel.js";
import type { JavaUpdateUseCaseInteractorTestTemplateModel } from "../model/JavaUpdateUseCaseInteractorTestTemplateModel.js";
import type { JavaUpdateUseCaseTemplateModel } from "../model/JavaUpdateUseCaseTemplateModel.js";
import type { JavaPatchCommandTemplateModel } from "../model/JavaPatchCommandTemplateModel.js";
import type { JavaPatchUseCaseInteractorTemplateModel } from "../model/JavaPatchUseCaseInteractorTemplateModel.js";
import type { JavaPatchUseCaseInteractorTestTemplateModel } from "../model/JavaPatchUseCaseInteractorTestTemplateModel.js";
import type { JavaPatchUseCaseTemplateModel } from "../model/JavaPatchUseCaseTemplateModel.js";
import type { JavaRestoreCommandTemplateModel } from "../model/JavaRestoreCommandTemplateModel.js";
import type { JavaRestoreUseCaseInteractorTemplateModel } from "../model/JavaRestoreUseCaseInteractorTemplateModel.js";
import type { JavaRestoreUseCaseInteractorTestTemplateModel } from "../model/JavaRestoreUseCaseInteractorTestTemplateModel.js";
import type { JavaRestoreUseCaseTemplateModel } from "../model/JavaRestoreUseCaseTemplateModel.js";
import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { createJavaEntityTemplateModel } from "../transformers/createJavaEntityTemplateModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export class JavaSpringCleanMultimoduleCoreArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "core";

  public constructor(
    private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver(),
    private readonly fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
  ) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Java generation requires an application namespace.");
    }

    const entityArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = entity.name;
      const gatewayType = `${entityType}Gateway`;
      const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
      const interactorType = `${useCaseType}Interactor`;
      const byFilterUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterUseCase`;
      const byFilterInteractorType = `${byFilterUseCaseType}Interactor`;
      const pageUseCaseType = `Find${toJavaPluralTypeName(entityType)}PageUseCase`;
      const pageInteractorType = `${pageUseCaseType}Interactor`;
      const byFilterPageUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
      const byFilterPageInteractorType = `${byFilterPageUseCaseType}Interactor`;
      const deletedByFilterPageUseCaseType = `FindDeleted${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
      const deletedByFilterPageInteractorType = `${deletedByFilterPageUseCaseType}Interactor`;
      const byIdUseCaseType = `Find${entityType}ByIdUseCase`;
      const byIdInteractorType = `${byIdUseCaseType}Interactor`;
      const deletedByIdUseCaseType = `FindDeleted${entityType}ByIdUseCase`;
      const deletedByIdInteractorType = `${deletedByIdUseCaseType}Interactor`;
      const createCommandType = `Create${entityType}Command`;
      const createUseCaseType = `Create${entityType}UseCase`;
      const createInteractorType = `${createUseCaseType}Interactor`;
      const updateCommandType = `Update${entityType}Command`;
      const updateUseCaseType = `Update${entityType}UseCase`;
      const updateInteractorType = `${updateUseCaseType}Interactor`;
      const patchCommandType = `Patch${entityType}Command`;
      const patchUseCaseType = `Patch${entityType}UseCase`;
      const patchInteractorType = `${patchUseCaseType}Interactor`;
      const deleteCommandType = `Delete${entityType}Command`;
      const deleteUseCaseType = `Delete${entityType}UseCase`;
      const deleteInteractorType = `${deleteUseCaseType}Interactor`;
      const restoreCommandType = `Restore${entityType}Command`;
      const restoreUseCaseType = `Restore${entityType}UseCase`;
      const restoreInteractorType = `${restoreUseCaseType}Interactor`;
      const domainPackage = `${namespace}.core.domains.${domainName}`;
      const filterPackage = `${namespace}.core.common.filter`;
      const pagingPackage = `${namespace}.core.common.paging`;
      const exceptionPackage = `${namespace}.core.common.exception`;
      const identifiers = entity.attributes.filter((attribute) => attribute.identifier);
      if (identifiers.length !== 1) {
        throw new Error(`Cannot generate find-by-id use case for entity '${entity.name}' without exactly one identifier attribute.`);
      }
      const identifier = identifiers[0]!;
      const identifierType = this.typeResolver.resolve(identifier.type);
      const entityImports = new JavaImportCollector();
      entityImports.add(`${domainPackage}.model.${entityType}`);
      entityImports.add("java.util.List");
      const gatewayImports = new JavaImportCollector();
      gatewayImports.add(`${filterPackage}.FilterExpression`);
      gatewayImports.add(`${pagingPackage}.PageRequest`);
      gatewayImports.add(`${pagingPackage}.PageResult`);
      gatewayImports.add(`${domainPackage}.model.${entityType}`);
      gatewayImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      gatewayImports.add(identifierType.import);
      gatewayImports.add("java.util.List");
      const pageUseCaseImports = new JavaImportCollector();
      pageUseCaseImports.add(`${pagingPackage}.PageRequest`);
      pageUseCaseImports.add(`${pagingPackage}.PageResult`);
      pageUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      const pageInteractorImports = new JavaImportCollector();
      pageInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      pageInteractorImports.add(`${exceptionPackage}.ValidationException`);
      pageInteractorImports.add(`${pagingPackage}.PageRequest`);
      pageInteractorImports.add(`${pagingPackage}.PageResult`);
      pageInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      pageInteractorImports.add(`${domainPackage}.model.${entityType}`);
      pageInteractorImports.add("java.util.List");
      const pageInteractorTestImports = new JavaImportCollector();
      pageInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      pageInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      pageInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      pageInteractorTestImports.add(`${pagingPackage}.PageResult`);
      pageInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      pageInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      pageInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      pageInteractorTestImports.add("java.util.List");
      pageInteractorTestImports.add("org.junit.jupiter.api.Test");
      pageInteractorTestImports.add(identifierType.import);
      const byFilterPageUseCaseImports = new JavaImportCollector();
      byFilterPageUseCaseImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageUseCaseImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageUseCaseImports.add(`${pagingPackage}.PageResult`);
      byFilterPageUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      byFilterPageUseCaseImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      const byFilterPageInteractorImports = new JavaImportCollector();
      byFilterPageInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      byFilterPageInteractorImports.add(`${exceptionPackage}.ValidationException`);
      byFilterPageInteractorImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageInteractorImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageInteractorImports.add(`${pagingPackage}.PageResult`);
      byFilterPageInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterPageInteractorImports.add(`${domainPackage}.model.${entityType}`);
      byFilterPageInteractorImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byFilterPageInteractorImports.add("java.util.List");
      const byFilterPageInteractorTestImports = new JavaImportCollector();
      byFilterPageInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterCondition`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterGroup`);
      byFilterPageInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageInteractorTestImports.add(`${pagingPackage}.PageResult`);
      byFilterPageInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterPageInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      byFilterPageInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byFilterPageInteractorTestImports.add("java.util.ArrayList");
      byFilterPageInteractorTestImports.add("java.util.List");
      byFilterPageInteractorTestImports.add("org.junit.jupiter.api.Test");
      byFilterPageInteractorTestImports.add(identifierType.import);
      const byFilterUseCaseImports = new JavaImportCollector();
      byFilterUseCaseImports.add(`${filterPackage}.FilterExpression`);
      byFilterUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      byFilterUseCaseImports.add("java.util.List");
      const byFilterInteractorImports = new JavaImportCollector();
      byFilterInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      byFilterInteractorImports.add(`${exceptionPackage}.ValidationException`);
      byFilterInteractorImports.add(`${filterPackage}.FilterExpression`);
      byFilterInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterInteractorImports.add(`${domainPackage}.model.${entityType}`);
      byFilterInteractorImports.add("java.util.List");
      const byFilterInteractorTestImports = new JavaImportCollector();
      byFilterInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterCondition`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterGroup`);
      byFilterInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      byFilterInteractorTestImports.add(`${pagingPackage}.PageResult`);
      byFilterInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      byFilterInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byFilterInteractorTestImports.add("java.util.ArrayList");
      byFilterInteractorTestImports.add("java.util.List");
      byFilterInteractorTestImports.add("org.junit.jupiter.api.Test");
      byFilterInteractorTestImports.add(identifierType.import);
      const byIdUseCaseImports = new JavaImportCollector();
      byIdUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      byIdUseCaseImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byIdUseCaseImports.add(identifierType.import);
      const byIdInteractorImports = new JavaImportCollector();
      byIdInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      byIdInteractorImports.add(`${exceptionPackage}.ValidationException`);
      byIdInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byIdInteractorImports.add(`${domainPackage}.model.${entityType}`);
      byIdInteractorImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byIdInteractorImports.add("java.util.List");
      byIdInteractorImports.add(identifierType.import);
      const byIdInteractorTestImports = new JavaImportCollector();
      byIdInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      byIdInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      byIdInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      byIdInteractorTestImports.add(`${pagingPackage}.PageResult`);
      byIdInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byIdInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      byIdInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      byIdInteractorTestImports.add("java.util.List");
      byIdInteractorTestImports.add(identifierType.import);
      byIdInteractorTestImports.add("org.junit.jupiter.api.Test");
      for (const attribute of entity.attributes) {
        byIdInteractorTestImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const createCommandImports = new JavaImportCollector();
      createCommandImports.add(`${exceptionPackage}.FieldViolation`);
      createCommandImports.add(`${exceptionPackage}.ValidationException`);
      for (const attribute of entity.attributes) {
        createCommandImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const createUseCaseImports = new JavaImportCollector();
      createUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      createUseCaseImports.add(`${domainPackage}.usecase.create.${createCommandType}`);
      const createInteractorImports = new JavaImportCollector();
      createInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      createInteractorImports.add(`${exceptionPackage}.ValidationException`);
      createInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      createInteractorImports.add(`${domainPackage}.model.${entityType}`);
      createInteractorImports.add(`${domainPackage}.usecase.create.${createCommandType}`);
      createInteractorImports.add("java.util.List");
      const createInteractorTestImports = new JavaImportCollector();
      createInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      createInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      createInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      createInteractorTestImports.add(`${pagingPackage}.PageResult`);
      createInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      createInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      createInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      createInteractorTestImports.add(`${domainPackage}.usecase.create.${createCommandType}`);
      createInteractorTestImports.add("java.util.List");
      createInteractorTestImports.add("org.junit.jupiter.api.Test");
      for (const attribute of entity.attributes) {
        createInteractorTestImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const updateCommandImports = new JavaImportCollector();
      updateCommandImports.add(`${exceptionPackage}.FieldViolation`);
      updateCommandImports.add(`${exceptionPackage}.ValidationException`);
      for (const attribute of entity.attributes) {
        updateCommandImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const updateUseCaseImports = new JavaImportCollector();
      updateUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      updateUseCaseImports.add(`${domainPackage}.usecase.update.${updateCommandType}`);
      const updateInteractorImports = new JavaImportCollector();
      updateInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      updateInteractorImports.add(`${exceptionPackage}.ValidationException`);
      updateInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      updateInteractorImports.add(`${domainPackage}.model.${entityType}`);
      updateInteractorImports.add(`${domainPackage}.usecase.update.${updateCommandType}`);
      updateInteractorImports.add("java.util.List");
      const updateInteractorTestImports = new JavaImportCollector();
      updateInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      updateInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      updateInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      updateInteractorTestImports.add(`${pagingPackage}.PageResult`);
      updateInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      updateInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      updateInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      updateInteractorTestImports.add(`${domainPackage}.usecase.update.${updateCommandType}`);
      updateInteractorTestImports.add("java.util.List");
      updateInteractorTestImports.add("org.junit.jupiter.api.Test");
      for (const attribute of entity.attributes) {
        updateInteractorTestImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const patchCommandImports = new JavaImportCollector();
      patchCommandImports.add(`${exceptionPackage}.FieldViolation`);
      patchCommandImports.add(`${exceptionPackage}.ValidationException`);
      for (const attribute of entity.attributes) patchCommandImports.add(this.typeResolver.resolve(attribute.type).import);
      const patchUseCaseImports = new JavaImportCollector();
      patchUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      patchUseCaseImports.add(`${domainPackage}.usecase.patch.${patchCommandType}`);
      const patchInteractorImports = new JavaImportCollector();
      patchInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      patchInteractorImports.add(`${exceptionPackage}.ValidationException`);
      patchInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      patchInteractorImports.add(`${domainPackage}.model.${entityType}`);
      patchInteractorImports.add(`${domainPackage}.usecase.patch.${patchCommandType}`);
      patchInteractorImports.add("java.util.List");
      const patchInteractorTestImports = new JavaImportCollector();
      patchInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      patchInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      patchInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      patchInteractorTestImports.add(`${pagingPackage}.PageResult`);
      patchInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      patchInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      patchInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      patchInteractorTestImports.add(`${domainPackage}.usecase.patch.${patchCommandType}`);
      patchInteractorTestImports.add("java.util.List");
      patchInteractorTestImports.add("org.junit.jupiter.api.Test");
      for (const attribute of entity.attributes) patchInteractorTestImports.add(this.typeResolver.resolve(attribute.type).import);
      const deleteCommandImports = new JavaImportCollector();
      deleteCommandImports.add(`${exceptionPackage}.FieldViolation`);
      deleteCommandImports.add(`${exceptionPackage}.ValidationException`);
      deleteCommandImports.add(identifierType.import);
      const deleteUseCaseImports = new JavaImportCollector();
      deleteUseCaseImports.add(`${domainPackage}.usecase.delete.${deleteCommandType}`);
      const deleteInteractorImports = new JavaImportCollector();
      deleteInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      deleteInteractorImports.add(`${exceptionPackage}.ValidationException`);
      deleteInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      deleteInteractorImports.add(`${domainPackage}.usecase.delete.${deleteCommandType}`);
      deleteInteractorImports.add("java.util.List");
      const deleteInteractorTestImports = new JavaImportCollector();
      deleteInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      deleteInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      deleteInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      deleteInteractorTestImports.add(`${pagingPackage}.PageResult`);
      deleteInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      deleteInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      deleteInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      deleteInteractorTestImports.add(`${domainPackage}.usecase.delete.${deleteCommandType}`);
      deleteInteractorTestImports.add("java.util.List");
      deleteInteractorTestImports.add("org.junit.jupiter.api.Test");
      deleteInteractorTestImports.add(identifierType.import);
      const restoreCommandImports = new JavaImportCollector();
      restoreCommandImports.add(`${exceptionPackage}.FieldViolation`);
      restoreCommandImports.add(`${exceptionPackage}.ValidationException`);
      restoreCommandImports.add(identifierType.import);
      const restoreUseCaseImports = new JavaImportCollector();
      restoreUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      restoreUseCaseImports.add(`${domainPackage}.usecase.restore.${restoreCommandType}`);
      const restoreInteractorImports = new JavaImportCollector();
      restoreInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      restoreInteractorImports.add(`${exceptionPackage}.ValidationException`);
      restoreInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      restoreInteractorImports.add(`${domainPackage}.model.${entityType}`);
      restoreInteractorImports.add(`${domainPackage}.usecase.restore.${restoreCommandType}`);
      restoreInteractorImports.add("java.util.List");
      const restoreInteractorTestImports = new JavaImportCollector();
      restoreInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      restoreInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      restoreInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      restoreInteractorTestImports.add(`${pagingPackage}.PageResult`);
      restoreInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      restoreInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      restoreInteractorTestImports.add(`${domainPackage}.model.${entityType}Tombstone`);
      restoreInteractorTestImports.add(`${domainPackage}.usecase.restore.${restoreCommandType}`);
      restoreInteractorTestImports.add("java.util.List");
      restoreInteractorTestImports.add("org.junit.jupiter.api.Test");
      restoreInteractorTestImports.add(identifierType.import);
      for (const attribute of entity.attributes) {
        restoreInteractorTestImports.add(this.typeResolver.resolve(attribute.type).import);
      }
      const createCommandFields = entity.attributes.map((attribute) => {
        const required = attribute.required
          ? {
              requiredMessageKey: attribute.identifier ? "common.identifier.required" : `${domainName}.${attribute.name}.required`,
              requiredDefaultMessage: attribute.identifier ? "Identifier is required." : `${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)} is required.`,
            }
          : {};
        return {
          name: attribute.name,
          type: this.typeResolver.resolve(attribute.type).name,
          ...required,
        };
      });
      const createCommandModel: JavaCreateCommandTemplateModel = {
        packageName: `${domainPackage}.usecase.create`,
        imports: createCommandImports.values(),
        className: createCommandType,
        fields: createCommandFields,
      };
      const createUseCaseModel: JavaCreateUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.create`,
        imports: createUseCaseImports.values(),
        interfaceName: createUseCaseType,
        commandType: createCommandType,
        entityType,
        executeMethodName: "execute",
      };
      const createInteractorModel: JavaCreateUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.create`,
        imports: createInteractorImports.values(),
        className: createInteractorType,
        interfaceName: createUseCaseType,
        commandType: createCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        entityConstructorArguments: entity.attributes.map((attribute) => `command.${attribute.name}()`),
        executeMethodName: "execute",
        gatewayCreateMethodName: "create",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
      };
      const fixtureArguments = entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression);
      const requiredFields = entity.attributes.filter((attribute) => attribute.required).map((attribute) => ({
        fieldName: attribute.name,
        messageKey: attribute.identifier ? "common.identifier.required" : `${domainName}.${attribute.name}.required`,
        testMethodSuffix: toJavaTypeName(attribute.name),
        nullArguments: entity.attributes.map((candidate, index) => candidate === attribute ? "null" : fixtureArguments[index]!),
      }));
      const createInteractorTestModel: JavaCreateUseCaseInteractorTestTemplateModel = {
        packageName: `${domainPackage}.usecase.create`,
        imports: createInteractorTestImports.values(),
        className: `${createInteractorType}Tests`,
        interactorType: createInteractorType,
        fakeGatewayType: `Fake${gatewayType}`,
        gatewayType,
        entityType,
        commandType: createCommandType,
        identifierType: identifierType.name,
        entityConstructorArguments: fixtureArguments,
        commandArguments: fixtureArguments,
        fieldAssertions: entity.attributes.map((attribute, index) => ({
          accessorName: `get${toJavaTypeName(attribute.name)}`,
          expectedExpression: fixtureArguments[index]!,
        })),
        requiredFields,
        executeMethodName: "execute",
        gatewayCreateMethodName: "create",
        commandRequiredMessageKey: "common.command.required",
      };
      const updateCommandModel: JavaUpdateCommandTemplateModel = {
        packageName: `${domainPackage}.usecase.update`,
        imports: updateCommandImports.values(),
        className: updateCommandType,
        fields: createCommandFields,
      };
      const updateUseCaseModel: JavaUpdateUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.update`,
        imports: updateUseCaseImports.values(),
        interfaceName: updateUseCaseType,
        commandType: updateCommandType,
        entityType,
        executeMethodName: "execute",
      };
      const updateInteractorModel: JavaUpdateUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.update`,
        imports: updateInteractorImports.values(),
        className: updateInteractorType,
        interfaceName: updateUseCaseType,
        commandType: updateCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        entityConstructorArguments: entity.attributes.map((attribute) => `command.${attribute.name}()`),
        executeMethodName: "execute",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
      };
      const updateInteractorTestModel: JavaUpdateUseCaseInteractorTestTemplateModel = {
        packageName: `${domainPackage}.usecase.update`,
        imports: updateInteractorTestImports.values(),
        className: `${updateInteractorType}Tests`,
        interactorType: updateInteractorType,
        fakeGatewayType: `Fake${gatewayType}`,
        gatewayType,
        entityType,
        commandType: updateCommandType,
        identifierType: identifierType.name,
        entityConstructorArguments: fixtureArguments,
        commandArguments: fixtureArguments,
        fieldAssertions: entity.attributes.map((attribute, index) => ({
          accessorName: `get${toJavaTypeName(attribute.name)}`,
          expectedExpression: fixtureArguments[index]!,
        })),
        requiredFields,
        executeMethodName: "execute",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
      };
      const patchValueFields = entity.attributes.filter((attribute) => !attribute.identifier).map((attribute) => {
        const javaType = this.typeResolver.resolve(attribute.type);
        return {
          name: attribute.name,
          type: javaType.name,
          ...(attribute.required ? {
            requiredMessageKey: `${domainName}.${attribute.name}.required`,
            requiredDefaultMessage: `${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)} is required.`,
          } : {}),
        };
      });
      if (patchValueFields.length === 0) {
        throw new Error(`Cannot generate PATCH use case for entity '${entity.name}' without a non-identifier attribute.`);
      }
      const patchCommandFields = [
        {
          name: identifier.name,
          type: identifierType.name,
          requiredMessageKey: "common.identifier.required",
          requiredDefaultMessage: "Identifier is required.",
        },
        ...patchValueFields.flatMap((field) => [field, { name: `${field.name}Provided`, type: "boolean" }]),
      ];
      const patchCommandModel: JavaPatchCommandTemplateModel = {
        packageName: `${domainPackage}.usecase.patch`,
        imports: patchCommandImports.values(),
        className: patchCommandType,
        fields: patchCommandFields,
        valueFields: patchValueFields,
        identifierFieldName: identifier.name,
        atLeastOneFieldMessageKey: "common.patch.field.required",
        atLeastOneFieldDefaultMessage: "At least one field must be provided.",
      };
      const patchUseCaseModel: JavaPatchUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.patch`,
        imports: patchUseCaseImports.values(),
        interfaceName: patchUseCaseType,
        commandType: patchCommandType,
        entityType,
        executeMethodName: "execute",
      };
      const patchInteractorModel: JavaPatchUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.patch`,
        imports: patchInteractorImports.values(),
        className: patchInteractorType,
        interfaceName: patchUseCaseType,
        commandType: patchCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        entityType,
        mergedEntityArguments: entity.attributes.map((attribute) => attribute.identifier
          ? `command.${attribute.name}()`
          : `command.${attribute.name}Provided() ? command.${attribute.name}() : current.get${toJavaTypeName(attribute.name)}()`),
        executeMethodName: "execute",
        gatewayFindByIdMethodName: "findById",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
      };
      const patchFixtureArguments = entity.attributes.map((attribute, index) => this.fixtureResolver.resolve(attribute.type, index).javaExpression);
      const patchCommandArguments = entity.attributes.flatMap((attribute, index) => attribute.identifier ? [patchFixtureArguments[index]!] : [patchFixtureArguments[index]!, "true"]);
      const patchUpdatedArguments = entity.attributes.flatMap((attribute, index) => attribute.identifier
        ? [patchFixtureArguments[index]!]
        : [this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression, "true"]);
      const patchUpdatedAssertions = entity.attributes.map((attribute, index) => ({
        accessorName: `get${toJavaTypeName(attribute.name)}`,
        expectedExpression: attribute.identifier ? patchFixtureArguments[index]! : this.fixtureResolver.resolve(attribute.type, index + 1).javaExpression,
      }));
      const optionalAttribute = entity.attributes.find((attribute) => !attribute.identifier && !attribute.required);
      const patchOptionalNullArguments = optionalAttribute === undefined ? [] : entity.attributes.flatMap((attribute, index) => {
        if (attribute.identifier) return [patchFixtureArguments[index]!];
        if (attribute === optionalAttribute) return ["null", "true"];
        return [patchFixtureArguments[index]!, "true"];
      });
      const omittedAttribute = entity.attributes.find((attribute) => !attribute.identifier);
      const hasOmittedFieldScenario = entity.attributes.filter((attribute) => !attribute.identifier).length > 1;
      const patchOmittedArguments = !hasOmittedFieldScenario || omittedAttribute === undefined ? [] : entity.attributes.flatMap((attribute, index) => {
        if (attribute.identifier) return [patchFixtureArguments[index]!];
        if (attribute === omittedAttribute) return ["null", "false"];
        return [patchFixtureArguments[index]!, "true"];
      });
      const patchEmptyCommandArguments = entity.attributes.flatMap((attribute, index) => attribute.identifier ? [patchFixtureArguments[index]!] : ["null", "false"]);
      const patchInteractorTestModel: JavaPatchUseCaseInteractorTestTemplateModel = {
        packageName: `${domainPackage}.usecase.patch`,
        imports: patchInteractorTestImports.values(),
        className: `${patchInteractorType}Tests`,
        interactorType: patchInteractorType,
        fakeGatewayType: `Fake${gatewayType}`,
        gatewayType,
        entityType,
        commandType: patchCommandType,
        identifierType: identifierType.name,
        currentEntityArguments: patchFixtureArguments,
        commandArguments: patchCommandArguments,
        updatedCommandArguments: patchUpdatedArguments,
        fieldAssertions: entity.attributes.map((attribute, index) => ({ accessorName: `get${toJavaTypeName(attribute.name)}`, expectedExpression: patchFixtureArguments[index]! })),
        updatedFieldAssertions: patchUpdatedAssertions,
        requiredFields: entity.attributes.filter((attribute) => attribute.required).map((attribute, index) => ({
          fieldName: attribute.name,
          messageKey: attribute.identifier ? "common.identifier.required" : `${domainName}.${attribute.name}.required`,
          testMethodSuffix: toJavaTypeName(attribute.name),
          nullArguments: entity.attributes.flatMap((candidate, candidateIndex) => {
            if (candidate === attribute) return ["null", ...(candidate.identifier ? [] : ["true"])];
            if (candidate.identifier) return [patchFixtureArguments[candidateIndex]!];
            return [patchFixtureArguments[candidateIndex]!, "true"];
          }),
        })),
        emptyCommandArguments: patchEmptyCommandArguments,
        executeMethodName: "execute",
        gatewayFindByIdMethodName: "findById",
        gatewayUpdateMethodName: "update",
        commandRequiredMessageKey: "common.command.required",
        atLeastOneFieldMessageKey: "common.patch.field.required",
        hasOptionalNullScenario: optionalAttribute !== undefined,
        optionalNullFieldName: optionalAttribute === undefined ? "Field" : toJavaTypeName(optionalAttribute.name),
        optionalNullCommandArguments: patchOptionalNullArguments,
        hasOmittedFieldScenario,
        omittedFieldName: omittedAttribute === undefined ? "Field" : toJavaTypeName(omittedAttribute.name),
        omittedExpectedExpression: omittedAttribute === undefined ? "null" : patchFixtureArguments[entity.attributes.indexOf(omittedAttribute)]!,
        omittedCommandArguments: patchOmittedArguments,
      };
      const deleteCommandModel: JavaDeleteCommandTemplateModel = {
        packageName: `${domainPackage}.usecase.delete`,
        imports: deleteCommandImports.values(),
        className: deleteCommandType,
        fields: [{
          name: identifier.name,
          type: identifierType.name,
          requiredMessageKey: "common.identifier.required",
          requiredDefaultMessage: "Identifier is required.",
        }],
      };
      const deleteUseCaseModel: JavaDeleteUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.delete`,
        imports: deleteUseCaseImports.values(),
        interfaceName: deleteUseCaseType,
        commandType: deleteCommandType,
        executeMethodName: "execute",
      };
      const deleteInteractorModel: JavaDeleteUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.delete`,
        imports: deleteInteractorImports.values(),
        className: deleteInteractorType,
        interfaceName: deleteUseCaseType,
        commandType: deleteCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        executeMethodName: "execute",
        gatewayDeleteMethodName: "deleteById",
        identifierAccessorName: identifier.name,
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
      };
      const deleteInteractorTestModel: JavaDeleteUseCaseInteractorTestTemplateModel = {
        packageName: `${domainPackage}.usecase.delete`,
        imports: deleteInteractorTestImports.values(),
        className: `${deleteInteractorType}Tests`,
        interactorType: deleteInteractorType,
        fakeGatewayType: `Fake${gatewayType}`,
        gatewayType,
        entityType,
        identifierType: identifierType.name,
        identifierParameterName: identifier.name,
        commandType: deleteCommandType,
        executeMethodName: "execute",
        gatewayDeleteMethodName: "deleteById",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
        identifierRequiredMessageKey: "common.identifier.required",
        identifierRequiredDefaultMessage: "Identifier is required.",
        identifierValueExpression: this.fixtureResolver.resolve(identifier.type, 0).javaExpression,
        deleteCallCountFieldName: "deleteCallCount",
        receivedIdFieldName: "receivedId",
      };
      const restoreCommandModel: JavaRestoreCommandTemplateModel = {
        packageName: `${domainPackage}.usecase.restore`,
        imports: restoreCommandImports.values(),
        className: restoreCommandType,
        fields: [
          {
            name: identifier.name,
            type: identifierType.name,
            requiredMessageKey: "common.identifier.required",
            requiredDefaultMessage: "Identifier is required.",
          },
        ],
      };
      const restoreUseCaseModel: JavaRestoreUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.restore`,
        imports: restoreUseCaseImports.values(),
        interfaceName: restoreUseCaseType,
        commandType: restoreCommandType,
        executeMethodName: "execute",
      };
      const restoreInteractorModel: JavaRestoreUseCaseInteractorTemplateModel = {
        packageName: `${domainPackage}.usecase.restore`,
        imports: restoreInteractorImports.values(),
        className: restoreInteractorType,
        interfaceName: restoreUseCaseType,
        commandType: restoreCommandType,
        gatewayType,
        gatewayFieldName: `${domainName}Gateway`,
        executeMethodName: "execute",
        gatewayRestoreMethodName: "restoreById",
        identifierAccessorName: identifier.name,
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
      };
      const restoreInteractorTestModel: JavaRestoreUseCaseInteractorTestTemplateModel = {
        packageName: `${domainPackage}.usecase.restore`,
        imports: restoreInteractorTestImports.values(),
        className: `${restoreInteractorType}Tests`,
        interactorType: restoreInteractorType,
        fakeGatewayType: `Fake${gatewayType}`,
        gatewayType,
        entityType,
        identifierType: identifierType.name,
        identifierParameterName: identifier.name,
        commandType: restoreCommandType,
        executeMethodName: "execute",
        gatewayRestoreMethodName: "restoreById",
        commandRequiredMessageKey: "common.command.required",
        commandRequiredDefaultMessage: "Command is required.",
        identifierRequiredMessageKey: "common.identifier.required",
        identifierRequiredDefaultMessage: "Identifier is required.",
        identifierValueExpression: this.fixtureResolver.resolve(identifier.type, 0).javaExpression,
        restoreCallCountFieldName: "restoreCallCount",
        receivedIdFieldName: "receivedId",
      };
      const deletedByIdUseCaseModel: JavaFindDeletedUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.find`,
        imports: byIdUseCaseImports.values(),
        interfaceName: deletedByIdUseCaseType,
        entityType: `${entityType}Tombstone`,
        tombstoneType: `${entityType}Tombstone`,
        identifierType: identifierType.name,
        identifierParameterName: identifier.name,
        executeMethodName: "execute",
      };
      const deletedByFilterPageUseCaseModel: JavaFindDeletedUseCaseTemplateModel = {
        packageName: `${domainPackage}.usecase.find`,
        imports: byFilterPageUseCaseImports.values(),
        interfaceName: deletedByFilterPageUseCaseType,
        entityType: `${entityType}Tombstone`,
        tombstoneType: `${entityType}Tombstone`,
        executeMethodName: "execute",
        filterExpressionType: "FilterExpression",
        filterExpressionParameterName: "filterExpression",
        pageRequestType: "PageRequest",
        pageRequestParameterName: "pageRequest",
        pageResultType: "PageResult",
      };
      const tombstoneImports = new JavaImportCollector();
      const tombstoneFields = entity.attributes.map((attribute) => {
        const type = this.typeResolver.resolve(attribute.type);
        tombstoneImports.add(type.import);
        return { name: attribute.name, type: type.name, modifiers: ["private", "final"] };
      });
      tombstoneImports.add("java.time.Instant");
      const tombstoneModel: JavaEntityTemplateModel = {
        packageName: `${domainPackage}.model`,
        imports: tombstoneImports.values(),
        className: `${entityType}Tombstone`,
        modifiers: ["public"],
        fields: [...tombstoneFields, { name: "deletedAt", type: "Instant", modifiers: ["private", "final"] }],
        constructorParameters: [...tombstoneFields.map(({ name, type }) => ({ name, type })), { name: "deletedAt", type: "Instant" }],
        getters: [...tombstoneFields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })), { name: "getDeletedAt", returnType: "Instant", fieldName: "deletedAt" }],
      };
      const outputVariables = {
        packagePath: namespace.replaceAll(".", "/"),
        domainName,
      };

      return [
        {
          templateId: "core-domain-entity",
          model: createJavaEntityTemplateModel(
            entity,
            `${domainPackage}.model`,
            undefined,
            true,
          ),
          outputVariables: { ...outputVariables, className: entityType },
        },
        {
          templateId: "core-domain-tombstone",
          model: tombstoneModel,
          outputVariables: { ...outputVariables, className: `${entityType}Tombstone` },
        },
        {
          templateId: "core-gateway",
          model: {
            packageName: `${domainPackage}.gateway`,
            imports: gatewayImports.values(),
            interfaceName: gatewayType,
            entityType,
            tombstoneType: `${entityType}Tombstone`,
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
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            findByIdMethodName: "findById",
            createMethodName: "create",
            createParameterName: domainName,
            updateMethodName: "update",
            updateParameterName: domainName,
            deleteMethodName: "deleteById",
            deleteParameterName: identifier.name,
            restoreMethodName: "restoreById",
          },
          outputVariables: { ...outputVariables, className: gatewayType },
        },
        {
          templateId: "core-create-command",
          model: createCommandModel,
          outputVariables: { ...outputVariables, className: createCommandType },
        },
        {
          templateId: "core-create-usecase",
          model: createUseCaseModel,
          outputVariables: { ...outputVariables, className: createUseCaseType },
        },
        {
          templateId: "core-create-usecase-interactor",
          model: createInteractorModel,
          outputVariables: { ...outputVariables, className: createInteractorType },
        },
        {
          templateId: "core-create-usecase-interactor-test",
          model: createInteractorTestModel,
          outputVariables: { ...outputVariables, className: createInteractorTestModel.className },
        },
        {
          templateId: "core-update-command",
          model: updateCommandModel,
          outputVariables: { ...outputVariables, className: updateCommandType },
        },
        {
          templateId: "core-update-usecase",
          model: updateUseCaseModel,
          outputVariables: { ...outputVariables, className: updateUseCaseType },
        },
        {
          templateId: "core-update-usecase-interactor",
          model: updateInteractorModel,
          outputVariables: { ...outputVariables, className: updateInteractorType },
        },
        {
          templateId: "core-update-usecase-interactor-test",
          model: updateInteractorTestModel,
          outputVariables: { ...outputVariables, className: updateInteractorTestModel.className },
        },
        {
          templateId: "core-patch-command",
          model: patchCommandModel,
          outputVariables: { ...outputVariables, className: patchCommandType },
        },
        {
          templateId: "core-patch-usecase",
          model: patchUseCaseModel,
          outputVariables: { ...outputVariables, className: patchUseCaseType },
        },
        {
          templateId: "core-patch-usecase-interactor",
          model: patchInteractorModel,
          outputVariables: { ...outputVariables, className: patchInteractorType },
        },
        {
          templateId: "core-patch-usecase-interactor-test",
          model: patchInteractorTestModel,
          outputVariables: { ...outputVariables, className: patchInteractorTestModel.className },
        },
        {
          templateId: "core-delete-command",
          model: deleteCommandModel,
          outputVariables: { ...outputVariables, className: deleteCommandType },
        },
        {
          templateId: "core-delete-usecase",
          model: deleteUseCaseModel,
          outputVariables: { ...outputVariables, className: deleteUseCaseType },
        },
        {
          templateId: "core-delete-usecase-interactor",
          model: deleteInteractorModel,
          outputVariables: { ...outputVariables, className: deleteInteractorType },
        },
        {
          templateId: "core-delete-usecase-interactor-test",
          model: deleteInteractorTestModel,
          outputVariables: { ...outputVariables, className: deleteInteractorTestModel.className },
        },
        {
          templateId: "core-restore-command",
          model: restoreCommandModel,
          outputVariables: { ...outputVariables, className: restoreCommandType },
        },
        {
          templateId: "core-restore-usecase",
          model: restoreUseCaseModel,
          outputVariables: { ...outputVariables, className: restoreUseCaseType },
        },
        {
          templateId: "core-restore-usecase-interactor",
          model: restoreInteractorModel,
          outputVariables: { ...outputVariables, className: restoreInteractorType },
        },
        {
          templateId: "core-restore-usecase-interactor-test",
          model: restoreInteractorTestModel,
          outputVariables: { ...outputVariables, className: restoreInteractorTestModel.className },
        },
        {
          templateId: "core-find-usecase",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: entityImports.values(),
            interfaceName: useCaseType,
            entityType,
            executeMethodName: "execute",
          },
          outputVariables: { ...outputVariables, className: useCaseType },
        },
        {
          templateId: "core-find-usecase-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: [
              `${domainPackage}.gateway.${gatewayType}`,
              `${domainPackage}.model.${entityType}`,
              "java.util.List",
            ],
            className: interactorType,
            interfaceName: useCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
          },
          outputVariables: { ...outputVariables, className: interactorType },
        },
        {
          templateId: "core-find-usecase-by-id",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byIdUseCaseImports.values(),
            interfaceName: byIdUseCaseType,
            entityType,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            executeMethodName: "execute",
          },
          outputVariables: { ...outputVariables, className: byIdUseCaseType },
        },
        {
          templateId: "core-find-usecase-by-id-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byIdInteractorImports.values(),
            className: byIdInteractorType,
            interfaceName: byIdUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            executeMethodName: "execute",
            gatewayFindByIdMethodName: "findById",
            requiredMessageKey: "common.identifier.required",
            requiredDefaultMessage: "Identifier is required.",
          },
          outputVariables: { ...outputVariables, className: byIdInteractorType },
        },
        {
          templateId: "core-find-usecase-by-id-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byIdInteractorTestImports.values(),
            className: `${byIdInteractorType}Tests`,
            interactorType: byIdInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            identifierValueExpression: this.fixtureResolver.resolve(identifier.type, 0).javaExpression,
            entityConstructorArguments: entity.attributes.map((attribute, index) =>
              this.fixtureResolver.resolve(attribute.type, index).javaExpression,
            ),
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            gatewayFindByIdMethodName: "findById",
            filterExpressionType: "FilterExpression",
            gatewayCreateMethodName: "create",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.identifier.required",
          },
          outputVariables: { ...outputVariables, className: `${byIdInteractorType}Tests` },
        },
        {
          templateId: "core-find-deleted-usecase-by-id",
          model: deletedByIdUseCaseModel,
          outputVariables: { ...outputVariables, className: deletedByIdUseCaseType },
        },
        {
          templateId: "core-find-deleted-usecase-by-id-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byIdInteractorImports.values(),
            className: deletedByIdInteractorType,
            interfaceName: deletedByIdUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            tombstoneType: `${entityType}Tombstone`,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            executeMethodName: "execute",
            gatewayFindByIdMethodName: "findDeletedById",
            requiredMessageKey: "common.identifier.required",
            requiredDefaultMessage: "Identifier is required.",
          },
          outputVariables: { ...outputVariables, className: deletedByIdInteractorType },
        },
        {
          templateId: "core-find-deleted-usecase-by-id-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byIdInteractorTestImports.values(),
            className: `${deletedByIdInteractorType}Tests`,
            interactorType: deletedByIdInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            deletedUseCase: true,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            identifierValueExpression: this.fixtureResolver.resolve(identifier.type, 0).javaExpression,
            entityConstructorArguments: entity.attributes.map((attribute, index) =>
              this.fixtureResolver.resolve(attribute.type, index).javaExpression,
            ),
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            gatewayFindByIdMethodName: "findDeletedById",
            filterExpressionType: "FilterExpression",
            gatewayCreateMethodName: "create",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.identifier.required",
          },
          outputVariables: { ...outputVariables, className: `${deletedByIdInteractorType}Tests` },
        },
        {
          templateId: "core-find-usecase-by-filter",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterUseCaseImports.values(),
            interfaceName: byFilterUseCaseType,
            entityType,
            executeMethodName: "execute",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
          },
          outputVariables: { ...outputVariables, className: byFilterUseCaseType },
        },
        {
          templateId: "core-find-usecase-by-filter-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterInteractorImports.values(),
            className: byFilterInteractorType,
            interfaceName: byFilterUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindByFilterMethodName: "findByFilter",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            requiredMessageKey: "common.filter.expression.required",
            requiredDefaultMessage: "Filter expression is required.",
          },
          outputVariables: { ...outputVariables, className: byFilterInteractorType },
        },
        {
          templateId: "core-find-usecase-by-filter-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterInteractorTestImports.values(),
            className: `${byFilterInteractorType}Tests`,
            interactorType: byFilterInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            requiredMessageKey: "common.filter.expression.required",
            sampleFieldName: entity.attributes[0]!.name,
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            gatewayFindByIdMethodName: "findById",
          },
          outputVariables: { ...outputVariables, className: `${byFilterInteractorType}Tests` },
        },
        {
          templateId: "core-find-usecase-by-filter-page",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageUseCaseImports.values(),
            interfaceName: byFilterPageUseCaseType,
            entityType,
            executeMethodName: "execute",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: byFilterPageUseCaseType },
        },
        {
          templateId: "core-find-usecase-by-filter-page-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorImports.values(),
            className: byFilterPageInteractorType,
            interfaceName: byFilterPageUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredFilterDefaultMessage: "Filter expression is required.",
            requiredPageMessageKey: "common.paging.page-request.required",
            requiredPageDefaultMessage: "Page request is required.",
          },
          outputVariables: { ...outputVariables, className: byFilterPageInteractorType },
        },
        {
          templateId: "core-find-usecase-by-filter-page-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorTestImports.values(),
            className: `${byFilterPageInteractorType}Tests`,
            interactorType: byFilterPageInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredPageMessageKey: "common.paging.page-request.required",
            sampleFieldName: entity.attributes[0]!.name,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            gatewayFindByIdMethodName: "findById",
          },
          outputVariables: { ...outputVariables, className: `${byFilterPageInteractorType}Tests` },
        },
        {
          templateId: "core-find-deleted-usecase-by-filter-page",
          model: deletedByFilterPageUseCaseModel,
          outputVariables: { ...outputVariables, className: deletedByFilterPageUseCaseType },
        },
        {
          templateId: "core-find-deleted-usecase-by-filter-page-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorImports.values(),
            className: deletedByFilterPageInteractorType,
            interfaceName: deletedByFilterPageUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            tombstoneType: `${entityType}Tombstone`,
            executeMethodName: "execute",
            gatewayFindByFilterPageMethodName: "findDeletedByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredFilterDefaultMessage: "Filter expression is required.",
            requiredPageMessageKey: "common.paging.page-request.required",
            requiredPageDefaultMessage: "Page request is required.",
          },
          outputVariables: { ...outputVariables, className: deletedByFilterPageInteractorType },
        },
        {
          templateId: "core-find-deleted-usecase-by-filter-page-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorTestImports.values(),
            className: `${deletedByFilterPageInteractorType}Tests`,
            interactorType: deletedByFilterPageInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            deletedUseCase: true,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findDeletedByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredPageMessageKey: "common.paging.page-request.required",
            sampleFieldName: entity.attributes[0]!.name,
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            gatewayFindByIdMethodName: "findById",
          },
          outputVariables: { ...outputVariables, className: `${deletedByFilterPageInteractorType}Tests` },
        },
        {
          templateId: "core-find-usecase-page",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageUseCaseImports.values(),
            interfaceName: pageUseCaseType,
            entityType,
            executeMethodName: "execute",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: pageUseCaseType },
        },
        {
          templateId: "core-find-usecase-page-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageInteractorImports.values(),
            className: pageInteractorType,
            interfaceName: pageUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindPageMethodName: "findPage",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.paging.page-request.required",
            requiredDefaultMessage: "Page request is required.",
          },
          outputVariables: { ...outputVariables, className: pageInteractorType },
        },
        {
          templateId: "core-find-usecase-page-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageInteractorTestImports.values(),
            className: `${pageInteractorType}Tests`,
            interactorType: pageInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.paging.page-request.required",
            identifierType: identifierType.name,
            identifierParameterName: identifier.name,
            gatewayFindByIdMethodName: "findById",
          },
          outputVariables: { ...outputVariables, className: `${pageInteractorType}Tests` },
        },
      ];
    });
    const packageName = `${namespace}.core.common.exception`;
    const pagingPackageName = `${namespace}.core.common.paging`;
    const filterPackageName = `${namespace}.core.common.filter`;
    const pagingVariables = { packagePath: namespace.replaceAll(".", "/") };
    return [...entityArtifacts,
      { templateId: "core-application-exception", model: { packageName, className: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ApplicationException" } },
      { templateId: "core-field-violation", model: { packageName, className: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "FieldViolation" } },
      { templateId: "core-validation-exception", model: { packageName, className: "ValidationException", parentClassName: "ApplicationException", fieldViolationClassName: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ValidationException" } },
      { templateId: "core-not-found-exception", model: { packageName, className: "NotFoundException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "NotFoundException" } },
      { templateId: "core-conflict-exception", model: { packageName, className: "ConflictException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ConflictException" } },
      { templateId: "core-self-validating", model: { packageName: `${namespace}.core.common.validation`, exceptionPackage: packageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "SelfValidating" } },
      ...["SortDirection", "SortOrder", "PageRequest", "PageResult"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...request.application.entities.filter((entity) => entity.attributes.some((attribute) => attribute.required)).map((entity) => { const domainName = toJavaPackageSegment(entity.name); return { templateId: "core-domain-validation-test", model: { packageName: `${namespace}.core.domains.${domainName}.model`, exceptionPackage: packageName, className: `${entity.name}ValidationTests`, entityType: entity.name, nullArguments: entity.attributes, requiredFieldNames: entity.attributes.filter((attribute) => attribute.required).map((attribute) => attribute.name).sort((left, right) => left.localeCompare(right)) }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entity.name}ValidationTests` } }; }),
      ...["SortOrder", "PageRequest", "PageResult"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
      ...["FilterOperator", "FilterCondition", "FilterGroupOperator", "FilterGroup", "FilterExpression"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: filterPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...["FilterCondition", "FilterGroup", "FilterExpression"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: filterPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
    ];
  }
}
