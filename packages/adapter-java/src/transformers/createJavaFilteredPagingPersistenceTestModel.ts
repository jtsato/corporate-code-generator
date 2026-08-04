import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver, type JavaTestFixtureValue } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaFilteredPagingPersistenceTestTemplateModel } from "../model/JavaFilteredPagingPersistenceTestTemplateModel.js";
import { toJavaConstantName } from "../naming/JavaConstantName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { selectDriverAttribute } from "./createJavaQuerydslFilterPersistenceTestModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

const recordCount = 5;

export function createJavaFilteredPagingPersistenceTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaFilteredPagingPersistenceTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const useCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
  const identifier = entity.attributes.find((attribute) => attribute.identifier);
  if (identifier === undefined) throw new Error(`Cannot generate filtered paging persistence test for '${entity.name}' without an identifier.`);
  const driver = selectDriverAttribute(entity, identifier);
  const driverLabel = toJavaTypeName(driver.name);
  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.common.filter.FilterCondition`);
  imports.add(`${namespace}.core.common.filter.FilterExpression`);
  imports.add(`${namespace}.core.common.filter.FilterGroup`);
  imports.add(`${namespace}.core.common.filter.FilterOperator`);
  imports.add(`${namespace}.core.common.exception.ValidationException`);
  imports.add(`${namespace}.core.common.paging.PageRequest`);
  imports.add(`${namespace}.core.common.paging.PageResult`);
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
  const records = Array.from({ length: recordCount }, (_, index) => {
    const identifierConstantName = toJavaConstantName(`${entity.name}_${identifier.name}_${index + 1}`);
    const constructorArguments = entity.attributes.map((attribute) => {
      const javaType = typeResolver.resolve(attribute.type);
      imports.add(javaType.import);
      if (attribute === identifier) return identifierConstantName;
      return fixtureResolver.resolve(attribute.type, attribute === driver ? index : 0).javaExpression;
    });
    return {
      identifierConstantName,
      identifierExpression: fixtureResolver.resolve(identifier.type, index).javaExpression,
      constructorArguments,
    };
  });

  const driverValues = Array.from({ length: recordCount }, (_, index) => fixtureResolver.resolve(driver.type, index));
  const first = toFilterLiteral(driverValues[0]!);
  const second = toFilterLiteral(driverValues[1]!);
  const third = toFilterLiteral(driverValues[2]!);
  const greaterThanSecond = condition(driver.name, "GREATER_THAN", second);
  const greaterThanFirst = condition(driver.name, "GREATER_THAN", first);
  const lessThanThird = condition(driver.name, "LESS_THAN", third);
  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}QuerydslFilterPagingPersistenceTests`,
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
    pageRequestType: "PageRequest",
    pageResultType: "PageResult",
    identifiersMethodName: "identifiersOf",
    records,
    scenarios: [
      {
        methodName: "shouldReturnFirstPageForEmptyFilter",
        expression: "FilterExpression.empty()",
        page: 0, size: 2, expectedItemCount: 2, expectedTotalItems: 5, expectedTotalPages: 3,
      },
      {
        methodName: `shouldFilterBy${driverLabel}AndReturnFirstPage`,
        expression: expressionOf(andGroup([greaterThanSecond])),
        page: 0, size: 2, expectedItemCount: 2, expectedTotalItems: 3, expectedTotalPages: 2,
      },
      {
        methodName: `shouldFilterBy${driverLabel}AndReturnSecondPage`,
        expression: expressionOf(andGroup([greaterThanSecond])),
        page: 1, size: 2, expectedItemCount: 1, expectedTotalItems: 3, expectedTotalPages: 2,
      },
      {
        methodName: `shouldApply${driverLabel}AndFilterWithPaging`,
        expression: expressionOf(andGroup([greaterThanFirst, lessThanThird])),
        page: 0, size: 2, expectedItemCount: 1, expectedTotalItems: 1, expectedTotalPages: 1,
      },
      {
        methodName: `shouldReturnEmptyPageFor${driverLabel}FilterOutOfRange`,
        expression: expressionOf(andGroup([greaterThanSecond])),
        page: 5, size: 2, expectedItemCount: 0, expectedTotalItems: 3, expectedTotalPages: 2,
      },
      {
        methodName: "shouldPropagateInvalidFilter",
        expression: expressionOf(andGroup([condition("unsupported", "EQUALS", JSON.stringify("value"))])),
        page: 0, size: 2, expectedItemCount: 0, expectedTotalItems: 0, expectedTotalPages: 0, invalid: true,
      },
    ],
  };
}

function toFilterLiteral(value: JavaTestFixtureValue): string {
  return value.jsonLiteral.startsWith("\"") ? value.jsonLiteral : JSON.stringify(value.jsonLiteral);
}

function condition(field: string, operator: string, literal: string): string {
  return `FilterCondition.of(${JSON.stringify(field)}, FilterOperator.${operator}, ${literal})`;
}

function andGroup(conditions: readonly string[]): string {
  return `FilterGroup.and(List.of(${conditions.join(", ")}))`;
}

function expressionOf(group: string): string {
  return `FilterExpression.of(${group})`;
}
