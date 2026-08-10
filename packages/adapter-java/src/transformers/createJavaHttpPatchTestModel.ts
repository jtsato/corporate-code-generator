import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaHttpPatchTestFixture, JavaHttpPatchTestTemplateModel } from "../model/JavaHttpPatchTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaHttpPatchTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaHttpPatchTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const identifierIndex = entity.attributes.findIndex((attribute) => attribute.identifier);
  const identifier = entity.attributes[identifierIndex];
  if (identifier === undefined) throw new Error(`Cannot generate the HTTP PATCH test for entity '${entity.name}' without an identifier.`);
  const valueAttributes = entity.attributes.filter((attribute) => !attribute.identifier);
  if (valueAttributes.length === 0) throw new Error(`Cannot generate the HTTP PATCH test for entity '${entity.name}' without a non-identifier attribute.`);

  const imports = new JavaImportCollector();
  for (const value of [
    `${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`,
    `${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`,
    "com.fasterxml.jackson.databind.JsonNode", "com.fasterxml.jackson.databind.ObjectMapper", "java.net.URI",
    "java.net.http.HttpClient", "java.net.http.HttpRequest", "java.net.http.HttpResponse", "org.junit.jupiter.api.AfterEach",
    "org.junit.jupiter.api.Test", "org.springframework.beans.factory.annotation.Autowired", "org.springframework.boot.test.context.SpringBootTest",
    "org.springframework.boot.test.web.server.LocalServerPort", "org.springframework.test.context.ActiveProfiles",
  ]) imports.add(value);

  const occurrences = new Map<string, number>();
  const fixtures = entity.attributes.map((attribute) => {
    const occurrence = occurrences.get(attribute.type) ?? 0;
    occurrences.set(attribute.type, occurrence + 1);
    const javaType = typeResolver.resolve(attribute.type);
    imports.add(javaType.import);
    const fixture = fixtureResolver.resolve(attribute.type, occurrence);
    return {
      constantName: toJavaConstantName(`${entity.name}_${attribute.name}`), type: javaType.name,
      javaExpression: fixture.javaExpression, jsonLiteral: fixture.jsonLiteral, jsonName: attribute.name,
      accessorName: `get${toJavaTypeName(attribute.name)}`,
      updatedConstantName: attribute.identifier ? undefined : toJavaConstantName(`${entity.name}_updated_${attribute.name}`),
    } satisfies JavaHttpPatchTestFixture;
  });
  const updatedFixtures = entity.attributes.map((attribute, index) => {
    if (attribute.identifier) return fixtures[index]!;
    const javaType = typeResolver.resolve(attribute.type);
    const fixture = fixtureResolver.resolve(attribute.type, occurrences.get(attribute.type) ?? 1);
    return {
      constantName: toJavaConstantName(`${entity.name}_updated_${attribute.name}`), type: javaType.name,
      javaExpression: fixture.javaExpression, jsonLiteral: fixture.jsonLiteral, jsonName: attribute.name,
      accessorName: `get${toJavaTypeName(attribute.name)}`,
      updatedConstantName: toJavaConstantName(`${entity.name}_updated_${attribute.name}`),
    } satisfies JavaHttpPatchTestFixture;
  });
  const originalByName = new Map(entity.attributes.map((attribute, index) => [attribute.name, fixtures[index]! ]));
  const updatedByName = new Map(entity.attributes.map((attribute, index) => [attribute.name, updatedFixtures[index]! ]));
  const jsonField = (attribute: typeof entity.attributes[number], value: (attribute: typeof entity.attributes[number]) => string) =>
    `${JSON.stringify(attribute.name)}:${value(attribute)}`;
  const json = (attributes: readonly typeof entity.attributes[number][], value: (attribute: typeof entity.attributes[number]) => string) =>
    JSON.stringify(`{${attributes.map((attribute) => jsonField(attribute, value)).join(",")}}`);
  const requiredAttribute = valueAttributes.find((attribute) => attribute.required);
  const optionalAttribute = valueAttributes.find((attribute) => !attribute.required);
  const omittedAttribute = valueAttributes.length > 1 ? valueAttributes[0] : undefined;
  const value = (attribute: typeof entity.attributes[number]) => updatedByName.get(attribute.name)!.jsonLiteral;

  // Seeds the pre-existing WalletEntity the PATCH targets; updatedAt is server-recomputed on patch, so
  // only entityConstructorArguments needs the audited extension (fixtures/updatedFixtures, which drive
  // the JSON/accessor assertions, are intentionally left untouched).
  if (entity.audited === true) {
    imports.add("java.time.LocalDateTime");
  }
  const entityConstructorArguments = entity.audited === true
    ? [...fixtures.map((fixture) => fixture.constantName), 'LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']
    : fixtures.map((fixture) => fixture.constantName);

  return {
    packageName: `${namespace}.http`, imports: imports.values(), className: `${entityType}HttpPatchTests`, activeProfile: "test",
    endpointPath: toRestCollectionPath(entity.name), entityType: `${entityType}Entity`, persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`, repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    identifierConstantName: fixtures[identifierIndex]!.constantName,
    missingIdentifierExpression: fixtureResolver.resolve(identifier.type, occurrences.get(identifier.type) ?? 1).javaExpression,
    entityConstructorArguments,
    validPatchPayloadExpression: json(valueAttributes, value), emptyPatchPayloadExpression: JSON.stringify("{}"),
    requiredNullPayloadExpression: requiredAttribute === undefined ? JSON.stringify("{}") : json(valueAttributes, (attribute) => attribute === requiredAttribute ? "null" : value(attribute)),
    hasRequiredNullScenario: requiredAttribute !== undefined,
    optionalNullPayloadExpression: optionalAttribute === undefined ? JSON.stringify("{}") : json(valueAttributes, (attribute) => attribute === optionalAttribute ? "null" : value(attribute)),
    hasOptionalNullScenario: optionalAttribute !== undefined,
    omittedPayloadExpression: omittedAttribute === undefined ? JSON.stringify("{}") : json(valueAttributes.filter((attribute) => attribute !== omittedAttribute), value),
    omittedFieldName: omittedAttribute?.name ?? "field",
    omittedAccessorName: omittedAttribute === undefined ? "getField" : `get${toJavaTypeName(omittedAttribute.name)}`,
    omittedExpectedConstantName: omittedAttribute === undefined ? "null" : originalByName.get(omittedAttribute.name)!.constantName,
    hasOmittedFieldScenario: omittedAttribute !== undefined,
    invalidJsonPayloadExpression: JSON.stringify("{not-json"), fixtures,
    updatedFixtures: updatedFixtures.filter((fixture, index) => !entity.attributes[index]!.identifier),
  };
}
