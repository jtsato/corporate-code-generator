import type { Entity } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaPagingPersistenceTestScenario, JavaPagingPersistenceTestTemplateModel } from "../model/JavaPagingPersistenceTestTemplateModel.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

const recordCount = 5;
const pageSize = 2;
const totalPages = Math.ceil(recordCount / pageSize);

/**
 * Builds the model for `<Entity>PagingPersistenceTests` (Milestone 6.16). Every attribute varies
 * per record so the identifier is always distinct, but scenarios only assert page metadata and
 * item counts, never content order — `findAll(Pageable)` without an explicit `Sort` does not
 * guarantee a stable order.
 */
export function createJavaPagingPersistenceTestModel(
  entity: Entity,
  namespace: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaPagingPersistenceTestTemplateModel {
  const domainName = toJavaPackageSegment(entity.name);
  const entityType = toJavaTypeName(entity.name);
  const pageUseCaseType = `Find${toJavaPluralTypeName(entityType)}PageUseCase`;

  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.common.paging.PageRequest`);
  imports.add(`${namespace}.core.common.paging.PageResult`);
  imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
  imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${pageUseCaseType}`);
  imports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
  imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
  imports.add("java.util.List");
  imports.add("org.junit.jupiter.api.AfterEach");
  imports.add("org.junit.jupiter.api.BeforeEach");
  imports.add("org.junit.jupiter.api.Test");
  imports.add("org.springframework.beans.factory.annotation.Autowired");
  imports.add("org.springframework.boot.test.context.SpringBootTest");
  imports.add("org.springframework.test.context.ActiveProfiles");

  const records = Array.from({ length: recordCount }, (unused, index) => ({
    constructorArguments: entity.attributes.map((attribute) => {
      const javaType = typeResolver.resolve(attribute.type);
      imports.add(javaType.import);
      return fixtureResolver.resolve(attribute.type, index).javaExpression;
    }),
  }));

  const scenarios: JavaPagingPersistenceTestScenario[] = [
    scenario("shouldReturnFirstPage", 0),
    scenario("shouldReturnSecondPage", 1),
    scenario("shouldReturnLastPage", 2),
    scenario("shouldReturnEmptyPageOutOfRange", 10),
  ];

  return {
    packageName: namespace,
    imports: imports.values(),
    className: `${entityType}PagingPersistenceTests`,
    activeProfile: "test",
    entityType,
    persistenceEntityType: `${entityType}Entity`,
    repositoryType: `${entityType}Repository`,
    repositoryFieldName: toJavaFieldName(`${entityType}Repository`),
    useCaseType: pageUseCaseType,
    useCaseFieldName: toJavaFieldName(pageUseCaseType),
    executeMethodName: "execute",
    pageRequestType: "PageRequest",
    pageRequestFactoryMethodName: "of",
    pageResultType: "PageResult",
    records,
    scenarios,
  };
}

function scenario(methodName: string, page: number): JavaPagingPersistenceTestScenario {
  const remaining = recordCount - page * pageSize;
  const expectedItemCount = Math.max(0, Math.min(pageSize, remaining));
  return {
    methodName,
    page,
    size: pageSize,
    expectedItemCount,
    expectedTotalItems: recordCount,
    expectedTotalPages: totalPages,
  };
}
