import type { Attribute, Entity, PrimitiveType } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver, type JavaTestFixtureValue } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaQuerydslFilterPersistenceTestTemplateModel } from "../model/JavaQuerydslFilterPersistenceTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

/** Types whose Querydsl filter definition exposes ordering operators. */
export const comparablePrimitiveTypes: ReadonlySet<PrimitiveType> = new Set<PrimitiveType>([
  "decimal",
  "int32",
  "int64",
  "date",
  "datetime",
]);

/**
 * Types whose deterministic fixtures repeat within the three arranged records. A driver attribute
 * must yield three distinct values, otherwise the expected result sets stop being unambiguous.
 */
const repeatingFixturePrimitiveTypes: ReadonlySet<PrimitiveType> = new Set<PrimitiveType>([
  "boolean",
]);

const recordCount = 3;

/**
 * Selects the attribute whose values distinguish the arranged records. Prefers a comparable
 * non-identifier attribute so ordering scenarios can be generated, then any non-identifier
 * attribute with distinct fixtures, and finally the identifier, which is always distinct.
 */
export function selectDriverAttribute(entity: Entity, identifier: Attribute): Attribute {
  const comparable = entity.attributes.find(
    (attribute) => !attribute.identifier && comparablePrimitiveTypes.has(attribute.type),
  );
  if (comparable !== undefined) return comparable;

  const distinct = entity.attributes.find(
    (attribute) => !attribute.identifier && !repeatingFixturePrimitiveTypes.has(attribute.type),
  );
  if (distinct !== undefined) return distinct;

  return identifier;
}

export function createJavaQuerydslFilterPersistenceTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaQuerydslFilterPersistenceTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const useCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterUseCase`;

  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) {
    throw new Error(
      `Cannot generate the Querydsl filter persistence test for entity '${entity.name}' because no identifier attribute was found.`,
    );
  }

  const driver = selectDriverAttribute(entity, identifier);
  const driverIsComparable = comparablePrimitiveTypes.has(driver.type);
  const driverFieldName = driver.name;
  const driverLabel = toJavaTypeName(driver.name);

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.common.filter.FilterCondition`);
  imports.add(`${namespace}.core.common.filter.FilterExpression`);
  imports.add(`${namespace}.core.common.filter.FilterGroup`);
  imports.add(`${namespace}.core.common.filter.FilterGroupOperator`);
  imports.add(`${namespace}.core.common.filter.FilterOperator`);
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
  imports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
  imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
  imports.add("java.util.List");
  imports.add("org.junit.jupiter.api.AfterEach");
  imports.add("org.junit.jupiter.api.BeforeEach");
  imports.add("org.junit.jupiter.api.Test");
  imports.add("org.springframework.beans.factory.annotation.Autowired");
  imports.add("org.springframework.boot.test.context.SpringBootTest");
  imports.add("org.springframework.test.context.ActiveProfiles");

  const identifierJavaType = typeResolver.resolve(identifier.type);
  const identifierConstantNames: string[] = [];

  const records = Array.from({ length: recordCount }, (unused, index) => {
    const identifierConstantName = toJavaConstantName(
      `${entity.name}_${identifier.name}_${index + 1}`,
    );
    identifierConstantNames.push(identifierConstantName);

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
    toFilterLiteral(fixtureResolver.resolve(driver.type, index)),
  );

  const [firstLiteral, secondLiteral, thirdLiteral] = driverLiterals as [string, string, string];
  const [firstIdentifier, secondIdentifier, thirdIdentifier] = identifierConstantNames as [
    string,
    string,
    string,
  ];

  const scenarios = [
    {
      methodName: "shouldReturnAllRecordsWhenFilterExpressionIsEmpty",
      expression: "FilterExpression.empty()",
      expectedIdentifiers: [firstIdentifier, secondIdentifier, thirdIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}Equals`,
      expression: expressionOf(andGroup([condition(driverFieldName, "EQUALS", secondLiteral)])),
      expectedIdentifiers: [secondIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}In`,
      expression: expressionOf(andGroup([inCondition(driverFieldName, [firstLiteral, thirdLiteral])])),
      expectedIdentifiers: [firstIdentifier, thirdIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}OrGroup`,
      expression: expressionOf(
        orGroup([
          condition(driverFieldName, "EQUALS", firstLiteral),
          condition(driverFieldName, "EQUALS", thirdLiteral),
        ]),
      ),
      expectedIdentifiers: [firstIdentifier, thirdIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}AndGroup`,
      expression: expressionOf(
        andGroup([
          condition(driverFieldName, "EQUALS", secondLiteral),
          condition(driverFieldName, "NOT_EQUALS", firstLiteral),
        ]),
      ),
      expectedIdentifiers: [secondIdentifier],
    },
    {
      methodName: `shouldFilterBy${driverLabel}NestedGroup`,
      expression: expressionOf(
        nestedGroup(
          [condition(driverFieldName, "NOT_EQUALS", firstLiteral)],
          [
            orGroup([
              condition(driverFieldName, "EQUALS", secondLiteral),
              condition(driverFieldName, "EQUALS", thirdLiteral),
            ]),
          ],
        ),
      ),
      expectedIdentifiers: [secondIdentifier, thirdIdentifier],
    },
    ...(driverIsComparable
      ? [
        {
          methodName: `shouldFilterBy${driverLabel}GreaterThan`,
          expression: expressionOf(
            andGroup([condition(driverFieldName, "GREATER_THAN", firstLiteral)]),
          ),
          expectedIdentifiers: [secondIdentifier, thirdIdentifier],
        },
        {
          methodName: `shouldFilterBy${driverLabel}Range`,
          expression: expressionOf(
            andGroup([
              condition(driverFieldName, "GREATER_THAN", firstLiteral),
              condition(driverFieldName, "LESS_THAN", thirdLiteral),
            ]),
          ),
          expectedIdentifiers: [secondIdentifier],
        },
      ]
      : []),
  ];

  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}QuerydslFilterPersistenceTests`,
    activeProfile: "test",
    identifierType: identifierJavaType.name,
    identifierGetterName: `get${toJavaTypeName(identifier.name)}`,
    entityType,
    persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    useCaseType,
    useCaseFieldName: toJavaFieldName(useCaseType),
    executeMethodName: "execute",
    filterExpressionType: "FilterExpression",
    filterExpressionParameterName: "filterExpression",
    identifiersMethodName: "identifiersOf",
    records,
    scenarios,
  };
}

/**
 * Converts a deterministic fixture into the raw text form accepted by `FilterCondition`, which
 * carries every value as a string regardless of the underlying primitive type.
 */
function toFilterLiteral(value: JavaTestFixtureValue): string {
  return value.jsonLiteral.startsWith("\"")
    ? value.jsonLiteral
    : JSON.stringify(value.jsonLiteral);
}

function condition(field: string, operator: string, literal: string): string {
  return `FilterCondition.of(${JSON.stringify(field)}, FilterOperator.${operator}, ${literal})`;
}

function inCondition(field: string, literals: readonly string[]): string {
  return `FilterCondition.of(${JSON.stringify(field)}, FilterOperator.IN, List.of(${literals.join(", ")}))`;
}

function andGroup(conditions: readonly string[]): string {
  return `FilterGroup.and(List.of(${conditions.join(", ")}))`;
}

function orGroup(conditions: readonly string[]): string {
  return `FilterGroup.or(List.of(${conditions.join(", ")}))`;
}

function nestedGroup(conditions: readonly string[], groups: readonly string[]): string {
  return `FilterGroup.of(FilterGroupOperator.AND, List.of(${conditions.join(", ")}), List.of(${groups.join(", ")}))`;
}

function expressionOf(group: string): string {
  return `FilterExpression.of(${group})`;
}
