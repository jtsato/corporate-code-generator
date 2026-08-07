import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaHttpDeleteTestTemplateModel, JavaHttpDeleteTestFixture } from "../model/JavaHttpDeleteTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaHttpDeleteTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaHttpDeleteTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const identifierIndex = entity.attributes.findIndex((attribute) => attribute.identifier);
  const identifier = entity.attributes[identifierIndex];
  if (identifier === undefined) throw new Error(`Cannot generate the HTTP delete test for entity '${entity.name}' without an identifier.`);

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

  const occurrences = new Map<string, number>();
  const fixtures = entity.attributes.map((attribute) => {
    const occurrenceIndex = occurrences.get(attribute.type) ?? 0;
    occurrences.set(attribute.type, occurrenceIndex + 1);
    const javaType = typeResolver.resolve(attribute.type);
    imports.add(javaType.import);
    return {
      constantName: toJavaConstantName(`${entity.name}_${attribute.name}`),
      type: javaType.name,
      javaExpression: fixtureResolver.resolve(attribute.type, occurrenceIndex).javaExpression,
    } satisfies JavaHttpDeleteTestFixture;
  });

  if (entity.audited === true) {
    imports.add("java.time.LocalDateTime");
  }
  const entityConstructorArguments = entity.audited === true
    ? [...fixtures.map((fixture) => fixture.constantName), 'LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']
    : fixtures.map((fixture) => fixture.constantName);

  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}HttpDeleteTests`,
    activeProfile: "test",
    endpointPath: toRestCollectionPath(entity.name),
    entityType: `${entityType}Entity`,
    persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    identifierConstantName: fixtures[identifierIndex]!.constantName,
    missingIdentifierExpression: fixtureResolver.resolve(identifier.type, (occurrences.get(identifier.type) ?? 1)).javaExpression,
    entityConstructorArguments,
    fixtures,
  };
}
