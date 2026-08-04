import type { Entity, PrimitiveType } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver, type JavaTestFixtureValue } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaHttpFilterTestScenario, JavaHttpFilterTestTemplateModel } from "../model/JavaHttpFilterTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";
import { comparablePrimitiveTypes, selectDriverAttribute } from "./createJavaQuerydslFilterPersistenceTestModel.js";

const recordCount = 3;

/**
 * Builds the model for `<Entity>HttpFilterTests`, which drives the generated `RestFilterParser`
 * through real HTTP query parameters end to end (Milestone 6.15). The driver attribute reuses the
 * same selection as `<Entity>QuerydslFilterPersistenceTests` (Milestone 6.14) so both tests exercise
 * identical fixtures and only the transport differs.
 */
export function createJavaHttpFilterTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaHttpFilterTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);

  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) {
    throw new Error(
      `Cannot generate the HTTP filter test for entity '${entity.name}' because no identifier attribute was found.`,
    );
  }

  const driver = selectDriverAttribute(entity, identifier);
  const driverIsComparable = comparablePrimitiveTypes.has(driver.type);
  const driverLabel = toJavaTypeName(driver.name);

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
  imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
  imports.add("com.fasterxml.jackson.databind.JsonNode");
  imports.add("com.fasterxml.jackson.databind.ObjectMapper");
  imports.add("java.net.URI");
  imports.add("java.net.URLEncoder");
  imports.add("java.net.http.HttpClient");
  imports.add("java.net.http.HttpRequest");
  imports.add("java.net.http.HttpResponse");
  imports.add("java.nio.charset.StandardCharsets");
  imports.add("java.util.ArrayList");
  imports.add("java.util.List");
  imports.add("org.junit.jupiter.api.AfterEach");
  imports.add("org.junit.jupiter.api.BeforeEach");
  imports.add("org.junit.jupiter.api.Test");
  imports.add("org.springframework.beans.factory.annotation.Autowired");
  imports.add("org.springframework.boot.test.context.SpringBootTest");
  imports.add("org.springframework.boot.test.web.server.LocalServerPort");
  imports.add("org.springframework.test.context.ActiveProfiles");

  const identifierJavaType = typeResolver.resolve(identifier.type);
  imports.add(identifierJavaType.import);

  const identifierConstantNames: string[] = [];
  const identifierLiterals: string[] = [];

  const records = Array.from({ length: recordCount }, (unused, index) => {
    const identifierConstantName = toJavaConstantName(`${entity.name}_${identifier.name}_${index + 1}`);
    identifierConstantNames.push(identifierConstantName);
    identifierLiterals.push(toRawLiteral(fixtureResolver.resolve(identifier.type, index)));

    const constructorArguments = entity.attributes.map((attribute) => {
      const javaType = typeResolver.resolve(attribute.type);
      imports.add(javaType.import);
      if (attribute === identifier) return identifierConstantName;
      const varies = attribute === driver;
      return fixtureResolver.resolve(attribute.type, varies ? index : 0).javaExpression;
    });

    return {
      identifierConstantName,
      identifierExpression: fixtureResolver.resolve(identifier.type, index).javaExpression,
      constructorArguments,
    };
  });

  const driverLiterals = Array.from({ length: recordCount }, (unused, index) =>
    toRawLiteral(fixtureResolver.resolve(driver.type, index)),
  );

  const [firstLiteral, secondLiteral, thirdLiteral] = driverLiterals as [string, string, string];
  const [firstIdentifier, secondIdentifier, thirdIdentifier] = identifierConstantNames as [string, string, string];
  const [firstIdentifierLiteral, , thirdIdentifierLiteral] = identifierLiterals as [string, string, string];

  const scenarios: JavaHttpFilterTestScenario[] = [
    {
      methodName: "shouldReturnAllRecordsWhenFilterIsAbsent",
      filterLiterals: [],
      expectedStatusCode: 200,
      expectedIdentifierConstantNames: [firstIdentifier, secondIdentifier, thirdIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}Equals`,
      filterLiterals: [`${driver.name}:eq:${secondLiteral}`],
      expectedStatusCode: 200,
      expectedIdentifierConstantNames: [secondIdentifier],
    },
    {
      methodName: `shouldFilterBy${toJavaTypeName(identifier.name)}In`,
      filterLiterals: [`${identifier.name}:in:${firstIdentifierLiteral},${thirdIdentifierLiteral}`],
      expectedStatusCode: 200,
      expectedIdentifierConstantNames: [firstIdentifier, thirdIdentifier],
    },
    ...(driverIsComparable
      ? [
        {
          methodName: `shouldFilterBy${driverLabel}GreaterThan`,
          filterLiterals: [`${driver.name}:gt:${firstLiteral}`],
          expectedStatusCode: 200,
          expectedIdentifierConstantNames: [secondIdentifier, thirdIdentifier],
        },
        {
          methodName: "shouldCombineRepeatedFiltersWithAnd",
          filterLiterals: [`${driver.name}:gt:${firstLiteral}`, `${driver.name}:lt:${thirdLiteral}`],
          expectedStatusCode: 200,
          expectedIdentifierConstantNames: [secondIdentifier],
        },
      ]
      : []),
    {
      methodName: "shouldRejectUnknownField",
      filterLiterals: ["unknown:eq:1"],
      expectedStatusCode: 400,
      expectedIdentifierConstantNames: null,
    },
    {
      methodName: `shouldRejectDisallowedOperatorFor${driverLabel}`,
      filterLiterals: [`${driver.name}:contains:1`],
      expectedStatusCode: 400,
      expectedIdentifierConstantNames: null,
    },
    ...(driver.type !== "string"
      ? [
        {
          methodName: `shouldRejectInvalid${driverLabel}Value`,
          filterLiterals: [`${driver.name}:eq:not-a-valid-value`],
          expectedStatusCode: 400,
          expectedIdentifierConstantNames: null,
        },
      ]
      : []),
    {
      methodName: "shouldRejectInvalidFormat",
      filterLiterals: [`${driver.name}`],
      expectedStatusCode: 400,
      expectedIdentifierConstantNames: null,
    },
  ];

  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}HttpFilterTests`,
    activeProfile: "test",
    identifierType: identifierJavaType.name,
    identifierFromJsonExpression: identifierFromJsonExpression(identifier.name, identifier.type),
    entityType,
    persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    serverPortAnnotationType: "LocalServerPort",
    serverPortFieldName: "port",
    endpointPath: toRestCollectionPath(entity.name),
    filterParameterName: "filter",
    requestType: "HttpRequest",
    responseType: "HttpResponse",
    responseBodyType: "String",
    httpClientType: "HttpClient",
    objectMapperType: "ObjectMapper",
    jsonNodeType: "JsonNode",
    records,
    scenarios,
  };
}

/**
 * Converts a deterministic fixture into the raw (unquoted) text accepted as a REST filter value or
 * asserted against a JSON response field, regardless of the underlying primitive type.
 */
function toRawLiteral(value: JavaTestFixtureValue): string {
  return value.jsonLiteral.startsWith("\"") ? JSON.parse(value.jsonLiteral) as string : value.jsonLiteral;
}

function identifierFromJsonExpression(fieldName: string, type: PrimitiveType): string {
  const field = JSON.stringify(fieldName);
  switch (type) {
    case "uuid": return `UUID.fromString(node.get(${field}).asText())`;
    case "string": return `node.get(${field}).asText()`;
    case "int32": return `node.get(${field}).asInt()`;
    case "int64": return `node.get(${field}).asLong()`;
    case "decimal": return `new BigDecimal(node.get(${field}).asText())`;
    case "boolean": return `node.get(${field}).asBoolean()`;
    case "date": return `LocalDate.parse(node.get(${field}).asText())`;
    case "datetime": return `OffsetDateTime.parse(node.get(${field}).asText())`;
  }
}
