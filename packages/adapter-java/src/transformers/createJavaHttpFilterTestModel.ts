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
  imports.add(`${namespace}.infra.database.domains.${domainName}.entity.${entityType}Entity`);
  imports.add(`${namespace}.infra.database.domains.${domainName}.repository.${entityType}Repository`);
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

  if (entity.audited === true) {
    imports.add("java.time.LocalDateTime");
  }

  const identifierConstantNames: string[] = [];
  const identifierLiterals: string[] = [];

  const records = Array.from({ length: recordCount }, (unused, index) => {
    const identifierConstantName = toJavaConstantName(`${entity.name}_${identifier.name}_${index + 1}`);
    identifierConstantNames.push(identifierConstantName);
    identifierLiterals.push(toRawLiteral(fixtureResolver.resolve(identifier.type, index)));

    const attributeConstructorArguments = entity.attributes.map((attribute) => {
      const javaType = typeResolver.resolve(attribute.type);
      imports.add(javaType.import);
      if (attribute === identifier) return identifierConstantName;
      const varies = attribute === driver;
      return fixtureResolver.resolve(attribute.type, varies ? index : 0).javaExpression;
    });
    const constructorArguments = entity.audited === true
      ? [...attributeConstructorArguments, 'LocalDateTime.parse("2026-01-15T10:30:00")', 'LocalDateTime.parse("2026-01-15T10:31:00")']
      : attributeConstructorArguments;

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
    success({
      methodName: "shouldReturnAllRecordsWhenFilterIsAbsent",
      filterLiterals: [],
      expectedIdentifierConstantNames: [firstIdentifier, secondIdentifier, thirdIdentifier],
      pageExpression: "null",
      sizeExpression: "null",
      expectedPage: 0,
      expectedSize: 20,
      expectedTotalItems: 3,
      expectedTotalPages: 1,
    }),
    success({
      methodName: `shouldFilterBy${driverLabel}Equals`,
      filterLiterals: [`${driver.name}:eq:${secondLiteral}`],
      expectedIdentifierConstantNames: [secondIdentifier],
      pageExpression: "null",
      sizeExpression: "null",
      expectedPage: 0,
      expectedSize: 20,
      expectedTotalItems: 1,
      expectedTotalPages: 1,
    }),
    success({
      methodName: `shouldFilterBy${toJavaTypeName(identifier.name)}In`,
      filterLiterals: [`${identifier.name}:in:${firstIdentifierLiteral},${thirdIdentifierLiteral}`],
      expectedIdentifierConstantNames: [firstIdentifier, thirdIdentifier],
      pageExpression: "0",
      sizeExpression: "20",
      expectedPage: 0,
      expectedSize: 20,
      expectedTotalItems: 2,
      expectedTotalPages: 1,
    }),
    success({
      methodName: "shouldReturnFirstPage",
      filterLiterals: [],
      expectedIdentifierConstantNames: [firstIdentifier, secondIdentifier],
      pageExpression: "0",
      sizeExpression: "2",
      expectedPage: 0,
      expectedSize: 2,
      expectedTotalItems: 3,
      expectedTotalPages: 2,
    }),
    success({
      methodName: "shouldReturnSecondPage",
      filterLiterals: [],
      expectedIdentifierConstantNames: [thirdIdentifier],
      pageExpression: "1",
      sizeExpression: "2",
      expectedPage: 1,
      expectedSize: 2,
      expectedTotalItems: 3,
      expectedTotalPages: 2,
    }),
    success({
      methodName: `shouldSort${driverLabel}Ascending`,
      filterLiterals: [],
      expectedIdentifierConstantNames: [firstIdentifier, secondIdentifier, thirdIdentifier],
      pageExpression: "0",
      sizeExpression: "3",
      expectedPage: 0,
      expectedSize: 3,
      expectedTotalItems: 3,
      expectedTotalPages: 1,
      sortLiterals: [`${driver.name}:asc`],
      expectedOrdered: true,
    }),
    success({
      methodName: `shouldSort${driverLabel}Descending`,
      filterLiterals: [],
      expectedIdentifierConstantNames: [thirdIdentifier, secondIdentifier, firstIdentifier],
      pageExpression: "0",
      sizeExpression: "3",
      expectedPage: 0,
      expectedSize: 3,
      expectedTotalItems: 3,
      expectedTotalPages: 1,
      sortLiterals: [`${driver.name}:desc`],
      expectedOrdered: true,
    }),
    ...(driverIsComparable
      ? [
        success({
          methodName: `shouldFilterBy${driverLabel}GreaterThan`,
          filterLiterals: [`${driver.name}:gt:${firstLiteral}`],
          expectedIdentifierConstantNames: [secondIdentifier, thirdIdentifier],
          pageExpression: "0",
          sizeExpression: "2",
          expectedPage: 0,
          expectedSize: 2,
          expectedTotalItems: 2,
          expectedTotalPages: 1,
        }),
        success({
          methodName: "shouldCombineRepeatedFiltersWithAnd",
          filterLiterals: [`${driver.name}:gt:${firstLiteral}`, `${driver.name}:lt:${thirdLiteral}`],
          expectedIdentifierConstantNames: [secondIdentifier],
          pageExpression: "0",
          sizeExpression: "2",
          expectedPage: 0,
          expectedSize: 2,
          expectedTotalItems: 1,
          expectedTotalPages: 1,
        }),
        success({
          methodName: "shouldCombineFilterPagingAndSort",
          filterLiterals: [`${driver.name}:gt:${firstLiteral}`],
          expectedIdentifierConstantNames: [thirdIdentifier, secondIdentifier],
          pageExpression: "0",
          sizeExpression: "2",
          expectedPage: 0,
          expectedSize: 2,
          expectedTotalItems: 2,
          expectedTotalPages: 1,
          sortLiterals: [`${driver.name}:desc`],
          expectedOrdered: true,
        }),
      ]
      : []),
    success({
      methodName: "shouldAcceptRepeatedSort",
      filterLiterals: [],
      expectedIdentifierConstantNames: [thirdIdentifier, secondIdentifier, firstIdentifier],
      pageExpression: "0",
      sizeExpression: "3",
      expectedPage: 0,
      expectedSize: 3,
      expectedTotalItems: 3,
      expectedTotalPages: 1,
      sortLiterals: [`${driver.name}:desc`, `${identifier.name}:asc`],
      expectedOrdered: true,
    }),
    success({
      methodName: "shouldPreserveFilterInCommaWithSort",
      filterLiterals: [`${identifier.name}:in:${firstIdentifierLiteral},${thirdIdentifierLiteral}`],
      expectedIdentifierConstantNames: [firstIdentifier, thirdIdentifier],
      pageExpression: "0",
      sizeExpression: "20",
      expectedPage: 0,
      expectedSize: 20,
      expectedTotalItems: 2,
      expectedTotalPages: 1,
      sortLiterals: [`${driver.name}:asc`],
      expectedOrdered: true,
    }),
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
    packageName: `${namespace}.http`,
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

interface SuccessScenarioOptions {
  readonly methodName: string;
  readonly filterLiterals: readonly string[];
  readonly expectedIdentifierConstantNames: readonly string[];
  readonly pageExpression: string;
  readonly sizeExpression: string;
  readonly expectedPage: number;
  readonly expectedSize: number;
  readonly expectedTotalItems: number;
  readonly expectedTotalPages: number;
  readonly sortLiterals?: readonly string[];
  readonly expectedOrdered?: boolean;
}

function success(options: SuccessScenarioOptions): JavaHttpFilterTestScenario {
  const {
    methodName,
    filterLiterals,
    expectedIdentifierConstantNames,
    pageExpression,
    sizeExpression,
    expectedPage,
    expectedSize,
    expectedTotalItems,
    expectedTotalPages,
    sortLiterals = [],
    expectedOrdered = false,
  } = options;
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
