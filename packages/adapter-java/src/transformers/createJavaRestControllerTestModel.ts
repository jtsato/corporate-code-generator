import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaRestControllerTestTemplateModel } from "../model/JavaRestControllerTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaRestControllerTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaRestControllerTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const pluralType = `${entityType}s`;
  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) {
    throw new Error(`Cannot generate the REST controller test for entity '${entity.name}' without an identifier.`);
  }

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}Tombstone`);
  imports.add(`${namespace}.core.common.paging.PageResult`);
  imports.add("java.util.List");
  imports.add("java.time.Instant");
  imports.add("org.junit.jupiter.api.Test");
  imports.add("org.springframework.beans.factory.annotation.Autowired");
  imports.add("org.springframework.boot.test.context.TestConfiguration");
  imports.add("org.springframework.context.annotation.Bean");
  imports.add("org.springframework.context.annotation.Import");
  imports.add("org.springframework.context.annotation.Primary");
  imports.add("org.springframework.http.MediaType");
  imports.add("org.springframework.test.web.servlet.MockMvc");

  const useCases = [
    { type: `Create${entityType}UseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.create.Create${entityType}UseCase` },
    { type: `Update${entityType}UseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.update.Update${entityType}UseCase` },
    { type: `Patch${entityType}UseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.patch.Patch${entityType}UseCase` },
    { type: `Delete${entityType}UseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}UseCase` },
    { type: `Restore${entityType}UseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.restore.Restore${entityType}UseCase` },
    { type: `Find${entityType}ByIdUseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.find.Find${entityType}ByIdUseCase` },
    { type: `FindDeleted${entityType}ByIdUseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.find.FindDeleted${entityType}ByIdUseCase` },
    { type: `Find${pluralType}ByFilterPageUseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.find.Find${pluralType}ByFilterPageUseCase` },
    { type: `FindDeleted${pluralType}ByFilterPageUseCase`, importPath: `${namespace}.core.domains.${domainName}.usecase.find.FindDeleted${pluralType}ByFilterPageUseCase` },
  ].map((useCase) => {
    imports.add(useCase.importPath);
    return { type: useCase.type, fieldName: toJavaFieldName(useCase.type) };
  });

  imports.add(`${namespace}.core.domains.${domainName}.usecase.create.Create${entityType}Command`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.update.Update${entityType}Command`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.patch.Patch${entityType}Command`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.delete.Delete${entityType}Command`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.restore.Restore${entityType}Command`);

  const occurrenceCounts = new Map<string, number>();
  const fields = entity.attributes.map((attribute) => {
    const occurrenceIndex = occurrenceCounts.get(attribute.type) ?? 0;
    occurrenceCounts.set(attribute.type, occurrenceIndex + 1);
    const javaType = typeResolver.resolve(attribute.type);
    const value = fixtureResolver.resolve(attribute.type, occurrenceIndex);
    imports.add(javaType.import);
    return {
      constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
      type: javaType.name,
      javaExpression: value.javaExpression,
      jsonName: attribute.name,
      jsonLiteral: value.jsonLiteral,
    };
  });

  const identifierIndex = entity.attributes.indexOf(identifier);
  const entityConstructorArguments = fields.map((field) => field.constantName);
  if (entity.audited === true) {
    imports.add("java.time.OffsetDateTime");
    entityConstructorArguments.push('OffsetDateTime.parse("2026-01-15T10:30:00Z")', 'OffsetDateTime.parse("2026-01-15T10:31:00Z")');
  }

  const body = (values: readonly string[]): string => `{${entity.attributes
    .map((attribute, index) => `\\"${attribute.name}\\":${values[index]}`)
    .join(",")}}`;
  const allValues = fields.map((field) => field.jsonLiteral.replaceAll('"', '\\"'));
  const nonIdentifierOnly = allValues.map((value, index) => index === identifierIndex ? undefined : value);

  return {
    packageName: `${namespace}.entrypoint.rest.domains.${domainName}`,
    imports: imports.values(),
    className: `${entityType}ControllerTests`,
    controllerType: `${entityType}Controller`,
    entityType,
    entityVariableName: toJavaFieldName(entityType),
    tombstoneType: `${entityType}Tombstone`,
    responseType: `${entityType}Response`,
    tombstoneResponseType: `${entityType}TombstoneResponse`,
    collectionPath: toRestCollectionPath(entity.name),
    identifierJsonName: identifier.name,
    identifierConstantName: fields[identifierIndex]!.constantName,
    useCases,
    fields,
    entityConstructorArguments,
    tombstoneConstructorArguments: [...fields.map((field) => field.constantName), "DELETED_AT"],
    createCommandArguments: fields.map((field) => field.constantName),
    updateCommandArguments: fields.map((field) => field.constantName),
    patchCommandArguments: [
      fields[identifierIndex]!.constantName,
      ...fields.flatMap((field, index) => index === identifierIndex ? [] : [field.constantName, "true"]),
    ],
    createRequestBody: body(allValues),
    updateRequestBody: body(allValues),
    patchRequestBody: `{${entity.attributes
      .map((attribute, index) => nonIdentifierOnly[index] === undefined ? undefined : `\\"${attribute.name}\\":${nonIdentifierOnly[index]}`)
      .filter((entry) => entry !== undefined)
      .join(",")}}`,
  };
}
