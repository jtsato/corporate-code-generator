import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaHttpCreateTestTemplateModel } from "../model/JavaHttpCreateTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaHttpCreateTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaHttpCreateTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) throw new Error(`Cannot generate the HTTP create test for entity '${entity.name}' without an identifier.`);
  const valueAttribute = entity.attributes.find((attribute) => !attribute.identifier);
  if (valueAttribute === undefined) throw new Error(`Cannot generate the HTTP create test for entity '${entity.name}' without a non-identifier attribute.`);
  const hasUniqueAttribute = entity.attributes.some((attribute) => attribute.unique === true)
    || (entity.uniqueGroups?.length ?? 0) > 0;

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
  imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
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

  const occurrenceCounts = new Map<string, number>();
  const fixtures = entity.attributes.map((attribute) => {
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
      accessorName: `get${toJavaTypeName(attribute.name)}`,
      jsonLiteral: value.jsonLiteral,
    };
  });

  const duplicateValues = entity.attributes.map((attribute, index) => {
    if (attribute === identifier) return fixtures[index]!.jsonLiteral;
    return fixtureResolver.resolve(attribute.type, (occurrenceCounts.get(attribute.type) ?? 1)).jsonLiteral;
  });
  const validValues = fixtures.map((fixture) => fixture.jsonLiteral);
  const uniqueReuseValues = entity.attributes.map((attribute, index) => {
    if (attribute.identifier) return fixtureResolver.resolve(attribute.type, occurrenceCounts.get(attribute.type) ?? 1).jsonLiteral;
    return fixtures[index]!.jsonLiteral;
  });
  const nullIdentifierValues = fixtures.map((fixture, index) => index === entity.attributes.indexOf(identifier) ? "null" : fixture.jsonLiteral);
  const nullValueValues = fixtures.map((fixture, index) => index === entity.attributes.indexOf(valueAttribute) ? "null" : fixture.jsonLiteral);
  const invalidIdentifierValues = fixtures.map((fixture, index) => index === entity.attributes.indexOf(identifier) ? JSON.stringify("not-a-uuid") : fixture.jsonLiteral);

  // The "reject duplicate" scenario seeds an already-persisted WalletEntity directly (not through the
  // create use case), so createdAt/updatedAt are NOT server-generated here — fixed literals are required
  // to satisfy the audited entity's constructor arity. This must stay separate from `fixtures`, which also
  // drives createdAt/updatedAt-free per-field JSON/accessor assertions against the actually-created record
  // (whose real timestamps come from GetLocalDateTime.now() at test time, not these fixtures).
  if (entity.audited === true) {
    imports.add("java.time.LocalDateTime");
  }
  const entityConstructorArguments = entity.audited === true
    ? [...fixtures.map((fixture) => fixture.constantName), 'LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']
    : fixtures.map((fixture) => fixture.constantName);

  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}HttpCreateTests`,
    activeProfile: "test",
    endpointPath: toRestCollectionPath(entity.name),
    findByIdEndpointPath: toRestCollectionPath(entity.name),
    entityType: `${entityType}Entity`,
    persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    identifierType: typeResolver.resolve(identifier.type).name,
    identifierConstantName: toJavaConstantName(`${entity.name}_${identifier.name}`),
    entityConstructorArguments,
    validPayloadExpression: toJsonStringLiteral(entity.attributes, validValues),
    duplicatePayloadExpression: toJsonStringLiteral(entity.attributes, duplicateValues),
    hasUniqueAttribute,
    uniqueReusePayloadExpression: toJsonStringLiteral(entity.attributes, uniqueReuseValues),
    nullIdentifierPayloadExpression: toJsonStringLiteral(entity.attributes, nullIdentifierValues),
    nullValuePayloadExpression: toJsonStringLiteral(entity.attributes, nullValueValues),
    invalidIdentifierPayloadExpression: toJsonStringLiteral(entity.attributes, invalidIdentifierValues),
    invalidJsonPayloadExpression: JSON.stringify("{not-json"),
    conflictDefaultMessage: `${entityType} already exists.`,
    fixtures,
  };
}

function toJsonStringLiteral(
  attributes: readonly { readonly name: string }[],
  values: readonly string[],
): string {
  const fields = attributes.map((attribute, index) => toJsonFieldLiteral(attribute.name, values[index]!));
  const json = `{${fields.join(",")}}`;
  return JSON.stringify(json);
}

function toJsonFieldLiteral(name: string, value: string): string {
  return `${JSON.stringify(name)}:${value}`;
}
