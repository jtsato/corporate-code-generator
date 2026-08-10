import type { Attribute, Entity, PrimitiveType } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaPersistenceProviderTestTemplateModel } from "../model/JavaPersistenceProviderTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaDatabaseColumnName } from "../naming/JavaDatabaseColumnName.js";
import { toJavaDatabaseTableName } from "../naming/JavaDatabaseTableName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

const quotedSqlTypes: ReadonlySet<PrimitiveType> = new Set<PrimitiveType>(["string", "uuid", "date", "datetime"]);

export function createJavaPersistenceProviderTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaPersistenceProviderTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) {
    throw new Error(`Cannot generate the persistence provider test for entity '${entity.name}' without an identifier.`);
  }

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.common.exception.ConflictException`);
  imports.add(`${namespace}.core.common.exception.NotFoundException`);
  imports.add(`${namespace}.core.common.filter.FilterExpression`);
  imports.add(`${namespace}.core.common.paging.PageRequest`);
  imports.add(`${namespace}.core.common.paging.PageResult`);
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}Tombstone`);
  imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
  imports.add("java.util.List");
  imports.add("org.junit.jupiter.api.Test");
  imports.add("org.springframework.beans.factory.annotation.Autowired");
  imports.add("org.springframework.context.annotation.Import");
  imports.add("org.springframework.test.context.jdbc.Sql");

  const resolveFields = (occurrenceOffset: number, suffix: string) => {
    const occurrenceCounts = new Map<string, number>();
    return entity.attributes.map((attribute: Attribute) => {
      const occurrenceIndex = (occurrenceCounts.get(attribute.type) ?? 0) + occurrenceOffset;
      occurrenceCounts.set(attribute.type, (occurrenceCounts.get(attribute.type) ?? 0) + 1);
      const javaType = typeResolver.resolve(attribute.type);
      const value = fixtureResolver.resolve(attribute.type, occurrenceIndex);
      imports.add(javaType.import);
      return {
        constantName: toJavaConstantName(`${suffix}_${attribute.name}`),
        type: javaType.name,
        javaExpression: value.javaExpression,
        accessorName: `get${toJavaTypeName(attribute.name)}`,
        rawValue: value.jsonLiteral,
        attribute,
      };
    });
  };

  const seededFields = resolveFields(0, `seeded_${entity.name}`);
  const createdFields = resolveFields(10, `created_${entity.name}`);
  const updatedFields = resolveFields(20, `updated_${entity.name}`);

  const seededColumns = seededFields.map((field) => ({
    columnName: toJavaDatabaseColumnName(field.attribute.name),
    sqlLiteral: quotedSqlTypes.has(field.attribute.type)
      ? `'${field.rawValue.replaceAll('"', "")}'`
      : field.rawValue,
  }));

  const identifierIndex = entity.attributes.indexOf(identifier);
  const auditedArguments = entity.audited === true
    ? ['OffsetDateTime.parse("2026-01-15T10:30:00Z")', 'OffsetDateTime.parse("2026-01-15T10:31:00Z")']
    : [];
  if (entity.audited === true) imports.add("java.time.OffsetDateTime");

  const strip = ({ constantName }: { constantName: string; }) => constantName;

  return {
    packageName: `${namespace}.infra.database.domains.${domainName}`,
    imports: imports.values(),
    className: `${entityType}GatewayProviderTests`,
    providerType: `${entityType}GatewayProvider`,
    providerFieldName: toJavaFieldName(`${entityType}GatewayProvider`),
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    entityType,
    persistenceEntityType: `${entityType}Entity`,
    domainVariableName: toJavaFieldName(entityType),
    tableName: toJavaDatabaseTableName(entity.name),
    activeScope: "ACTIVE",
    deletionScopeColumn: "deletion_scope",
    seededColumns,
    seededFields: seededFields.map(({ attribute, rawValue, ...field }) => field),
    createdFields: createdFields.map(({ attribute, rawValue, ...field }) => field),
    updatedFields: updatedFields.map(({ attribute, rawValue, ...field }) => field),
    seededConstructorArguments: [...seededFields.map(strip), ...auditedArguments],
    createdConstructorArguments: [...createdFields.map(strip), ...auditedArguments],
    updatedConstructorArguments: [
      ...updatedFields.map((field, index) => index === identifierIndex ? seededFields[index]!.constantName : field.constantName),
      ...auditedArguments,
    ],
    identifierConstantName: seededFields[identifierIndex]!.constantName,
    createdIdentifierConstantName: createdFields[identifierIndex]!.constantName,
  };
}
