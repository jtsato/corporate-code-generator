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
    success("shouldReturnAllRecordsWhenFilterIsAbsent", [], [firstIdentifier, secondIdentifier, thirdIdentifier], "null", "null", 0, 20, 3, 1),
    success(`shouldFilterBy${driverLabel}Equals`, [`${driver.name}:eq:${secondLiteral}`], [secondIdentifier], "null", "null", 0, 20, 1, 1),
    success(`shouldFilterBy${toJavaTypeName(identifier.name)}In`, [`${identifier.name}:in:${firstIdentifierLiteral},${thirdIdentifierLiteral}`], [firstIdentifier, thirdIdentifier], "0", "20", 0, 20, 2, 1),
    success("shouldReturnFirstPage", [], [firstIdentifier, secondIdentifier], "0", "2", 0, 2, 3, 2),
    success("shouldReturnSecondPage", [], [thirdIdentifier], "1", "2", 1, 2, 3, 2),
    success(`shouldSort${driverLabel}Ascending`, [], [firstIdentifier, secondIdentifier, thirdIdentifier], "0", "3", 0, 3, 3, 1, [`${driver.name}:asc`], true),
    success(`shouldSort${driverLabel}Descending`, [], [thirdIdentifier, secondIdentifier, firstIdentifier], "0", "3", 0, 3, 3, 1, [`${driver.name}:desc`], true),
    ...(driverIsComparable
      ? [
        success(`shouldFilterBy${driverLabel}GreaterThan`, [`${driver.name}:gt:${firstLiteral}`], [secondIdentifier, thirdIdentifier], "0", "2", 0, 2, 2, 1),
        success("shouldCombineRepeatedFiltersWithAnd", [`${driver.name}:gt:${firstLiteral}`, `${driver.name}:lt:${thirdLiteral}`], [secondIdentifier], "0", "2", 0, 2, 1, 1),
        success("shouldCombineFilterPagingAndSort", [`${driver.name}:gt:${firstLiteral}`], [thirdIdentifier, secondIdentifier], "0", "2", 0, 2, 2, 1, [`${driver.name}:desc`], true),
      ]
      : []),
    success("shouldAcceptRepeatedSort", [], [thirdIdentifier, secondIdentifier, firstIdentifier], "0", "3", 0, 3, 3, 1, [`${driver.name}:desc`, `${identifier.name}:asc`], true),
    success("shouldPreserveFilterInCommaWithSort", [`${identifier.name}:in:${firstIdentifierLiteral},${thirdIdentifierLiteral}`], [firstIdentifier, thirdIdentifier], "0", "20", 0, 20, 2, 1, [`${driver.name}:asc`], true),
    failure("shouldRejectUnknownField", ["unknown:eq:1"], "null", "null"),
    failure(`shouldRejectDisallowedOperatorFor${driverLabel}`, [`${driver.name}:contains:1`], "null", "null"),
    ...(driver.type !== "string"
      ? [failure(`shouldRejectInvalid${driverLabel}Value`, [`${driver.name}:eq:not-a-valid-value`], "0", "2")]
      : []),
    failure("shouldRejectInvalidFormat", [`${driver.name}`], "null", "null"),
    failure("shouldRejectUnknownSortField", [], "null", "null", ["unknown:asc"]),
    failure("shouldRejectInvalidSortDirection", [], "null", "null", [`${driver.name}:invalid`]),
    failure("shouldRejectInvalidSortFormat", [], "null", "null", ["balance"]),
    failure("shouldRejectSortWithSpaces", [], "null", "null", [`${driver.name}: desc`]),
    failure("shouldRejectNonNumericPage", [], '"abc"', "2"),
    failure("shouldRejectNonNumericSize", [], "0", '"abc"'),
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

function success(
  methodName: string,
  filterLiterals: readonly string[],
  expectedIdentifierConstantNames: readonly string[],
  pageExpression: string,
  sizeExpression: string,
  expectedPage: number,
  expectedSize: number,
  expectedTotalItems: number,
  expectedTotalPages: number,
  sortLiterals: readonly string[] = [],
  expectedOrdered = false,
): JavaHttpFilterTestScenario {
  return { methodName, filterLiterals, sortLiterals, pageExpression, sizeExpression, expectedStatusCode: 200, expectedIdentifierConstantNames, expectedPage, expectedSize, expectedTotalItems, expectedTotalPages, expectedOrdered };
}

function failure(
  methodName: string,
  filterLiterals: readonly string[],
  pageExpression: string,
  sizeExpression: string,
  sortLiterals: readonly string[] = [],
): JavaHttpFilterTestScenario {
  return { methodName, filterLiterals, sortLiterals, pageExpression, sizeExpression, expectedStatusCode: 400, expectedIdentifierConstantNames: null, expectedPage: null, expectedSize: null, expectedTotalItems: null, expectedTotalPages: null, expectedOrdered: false };
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
