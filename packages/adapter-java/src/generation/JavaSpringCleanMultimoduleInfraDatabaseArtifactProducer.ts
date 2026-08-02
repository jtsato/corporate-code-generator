import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaGatewayProviderTemplateModel } from "../model/JavaGatewayProviderTemplateModel.js";
import type { JavaPersistenceEntityTemplateModel } from "../model/JavaPersistenceEntityTemplateModel.js";
import type { JavaPersistenceMapperTemplateModel } from "../model/JavaPersistenceMapperTemplateModel.js";
import type { JavaSpringDataRepositoryTemplateModel } from "../model/JavaSpringDataRepositoryTemplateModel.js";
import { toJavaDatabaseColumnName } from "../naming/JavaDatabaseColumnName.js";
import { toJavaDatabaseTableName } from "../naming/JavaDatabaseTableName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";

export class JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "infra-database";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Infrastructure generation requires an application namespace.");
    }

    const typeResolver = new JavaTypeResolver();
    const fixtureResolver = new JavaTestFixtureValueResolver();
    const entityArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = toJavaTypeName(entity.name);
      const persistenceImports = new JavaImportCollector();
      persistenceImports.add("jakarta.persistence.Column");
      persistenceImports.add("jakarta.persistence.Entity");
      persistenceImports.add("jakarta.persistence.Id");
      persistenceImports.add("jakarta.persistence.Table");
      const fields = entity.attributes.map((attribute) => {
        const javaType = typeResolver.resolve(attribute.type);
        persistenceImports.add(javaType.import);
        return {
          name: attribute.name,
          type: javaType.name,
          columnName: toJavaDatabaseColumnName(attribute.name),
          nullable: !attribute.required,
          identifier: attribute.identifier,
        };
      });
      const persistenceModel: JavaPersistenceEntityTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.entity`,
        imports: persistenceImports.values(),
        className: `${entityType}Entity`,
        tableName: toJavaDatabaseTableName(entityType),
        fields,
        constructorParameters: fields.map(({ name, type }) => ({ name, type })),
        getters: fields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })),
      };
      const gatewayType = `${entityType}Gateway`;
      const mapperImports = new JavaImportCollector();
      mapperImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      mapperImports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
      const domainParameterName = toJavaFieldName(entityType);
      const entityParameterName = toJavaFieldName(`${entityType}Entity`);
      const mapperModel: JavaPersistenceMapperTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.mapper`, imports: mapperImports.values(), className: `${entityType}PersistenceMapper`, constructorName: `${entityType}PersistenceMapper`,
        domainType: entityType, entityType: `${entityType}Entity`, domainParameterName, entityParameterName, toEntityMethodName: "toEntity", toDomainMethodName: "toDomain",
        toEntityArguments: entity.attributes.map((attribute) => `${domainParameterName}.get${toJavaTypeName(attribute.name)}()`),
        toDomainArguments: entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`),
      };
      const identifiers = entity.attributes.filter((attribute) => attribute.identifier);
      if (identifiers.length === 0) {
        throw new Error(`Cannot generate Spring Data repository for entity '${entity.name}' because no identifier attribute was found.`);
      }
      if (identifiers.length > 1) {
        throw new Error(`Cannot generate Spring Data repository for entity '${entity.name}' because multiple identifier attributes were found.`);
      }
      const identifierType = typeResolver.resolve(identifiers[0]!.type);
      const repositoryImports = new JavaImportCollector();
      repositoryImports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
      repositoryImports.add(identifierType.import);
      repositoryImports.add("org.springframework.data.jpa.repository.JpaRepository");
      const repositoryModel: JavaSpringDataRepositoryTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.repository`,
        imports: repositoryImports.values(),
        interfaceName: `${entityType}Repository`,
        entityType: `${entityType}Entity`,
        identifierType: identifierType.name,
        baseRepositoryType: "JpaRepository",
      };
      const imports = new JavaImportCollector();
      imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
      imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      imports.add(`${namespace}.infra.domains.${domainName}.mapper.${mapperModel.className}`);
      imports.add(`${namespace}.infra.domains.${domainName}.repository.${repositoryModel.interfaceName}`);
      imports.add("java.util.List");
      const repositoryFieldName = toJavaFieldName(repositoryModel.interfaceName);
      const model: JavaGatewayProviderTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}`,
        imports: imports.values(),
        className: `${gatewayType}Provider`,
        gatewayType,
        entityType,
        findAllMethodName: "findAll",
        repositoryType: repositoryModel.interfaceName,
        repositoryFieldName,
        constructorName: `${gatewayType}Provider`,
        mapperType: mapperModel.className,
        repositoryFindAllMethodName: "findAll",
        mapperToDomainMethodName: "toDomain",
      };

      return [
        {
          templateId: "infra-database-persistence-entity",
          model: persistenceModel,
          outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: persistenceModel.className },
        },
        {
          templateId: "infra-database-persistence-mapper", model: mapperModel,
          outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: mapperModel.className },
        },
        {
          templateId: "infra-database-repository",
          model: repositoryModel,
          outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: repositoryModel.interfaceName },
        },
        {
          templateId: "infra-database-gateway-provider",
          model,
          outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: model.className },
        },
      ];
    });
    const pagingPackageName = `${namespace}.infra.database.common.paging`;
    const filterPackageName = `${namespace}.infra.database.common.filter`;
    const pagingVariables = { packagePath: namespace.replaceAll(".", "/") };
    return [
      ...entityArtifacts,
      ...["QuerydslFilterFieldDefinition", "QuerydslFilterDefinition", "QuerydslFilterValueConverter", "QuerydslFilterMapper"].map((className) => ({ templateId: `infra-database-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: filterPackageName, exceptionPackage: `${namespace}.core.common.exception`, filterPackage: `${namespace}.core.common.filter` }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className } })),
      ...["QuerydslFilterValueConverter", "QuerydslFilterMapper"].map((className) => ({ templateId: `infra-database-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: filterPackageName, filterPackage: `${namespace}.core.common.filter` }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: `${className}Tests` } })),
      ...request.application.entities.flatMap((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const packageName = `${namespace}.infra.database.domains.${domainName}.filter`;
        const fields = entity.attributes.map((attribute) => {
          const javaType = typeResolver.resolve(attribute.type);
          const comparisonOperators = ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUALS", "LESS_THAN", "LESS_THAN_OR_EQUALS", "IN", "IS_NULL", "IS_NOT_NULL"];
          const stringOperators = ["EQUALS", "NOT_EQUALS", "CONTAINS", "STARTS_WITH", "ENDS_WITH", "IN", "IS_NULL", "IS_NOT_NULL"];
          const equalityOperators = ["EQUALS", "NOT_EQUALS", "IN", "IS_NULL", "IS_NOT_NULL"];
          const operators = (attribute.type === "decimal" || attribute.type === "int32" || attribute.type === "int64" || attribute.type === "date" || attribute.type === "datetime"
            ? comparisonOperators
            : attribute.type === "string"
              ? stringOperators
              : equalityOperators).map((operator) => ({
            operator,
            method: ({
              EQUALS: "eq",
              NOT_EQUALS: "ne",
              GREATER_THAN: "gt",
              GREATER_THAN_OR_EQUALS: "goe",
              LESS_THAN: "lt",
              LESS_THAN_OR_EQUALS: "loe",
              CONTAINS: "contains",
              STARTS_WITH: "startsWith",
              ENDS_WITH: "endsWith",
              IN: "in",
              IS_NULL: "isNull",
              IS_NOT_NULL: "isNotNull",
            } as const)[operator],
          }));
          return { name: toJavaFieldName(attribute.name), domainName: attribute.name, type: javaType.name, import: javaType.import, operators };
        });
        const filterModel = { packageName, commonPackage: filterPackageName, filterPackage: `${namespace}.core.common.filter`, entityPackage: `${namespace}.infra.domains.${domainName}.entity`, entityType, qVariableName: toJavaFieldName(`${entityType}Entity`), imports: [...new Set(fields.flatMap((field) => field.import === undefined ? [] : [field.import]))], fields };
        return [
          { templateId: "infra-database-querydsl-domain-filter-definition", model: filterModel, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entityType}QuerydslFilterDefinition` } },
          { templateId: "infra-database-querydsl-domain-filter-definition-test", model: { packageName, entityType, imports: filterModel.imports, fields }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entityType}QuerydslFilterDefinitionTests` } },
        ];
      }),
      {
        templateId: "infra-database-spring-data-page-request-mapper",
        model: { packageName: pagingPackageName, exceptionPackageName: `${namespace}.core.common.exception`, pagingPackageName: `${namespace}.core.common.paging`, className: "SpringDataPageRequestMapper" },
        outputVariables: { ...pagingVariables, className: "SpringDataPageRequestMapper" },
      },
      {
        templateId: "infra-database-spring-data-page-result-mapper",
        model: { packageName: pagingPackageName, exceptionPackageName: `${namespace}.core.common.exception`, pagingPackageName: `${namespace}.core.common.paging`, className: "SpringDataPageResultMapper" },
        outputVariables: { ...pagingVariables, className: "SpringDataPageResultMapper" },
      },
      ...["SpringDataPageRequestMapper", "SpringDataPageResultMapper"].map((className) => ({
        templateId: `infra-database-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`,
        model: { packageName: pagingPackageName, exceptionPackageName: `${namespace}.core.common.exception`, pagingPackageName: `${namespace}.core.common.paging`, className: `${className}Tests` },
        outputVariables: { ...pagingVariables, className: `${className}Tests` },
      })),
      ...request.application.entities.flatMap((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const packageName = `${namespace}.infra.database.domains.${domainName}.query`;
        const predicateMethods = entity.attributes.map((attribute, index) => {
          const javaType = typeResolver.resolve(attribute.type);
          return { name: attribute.name, type: javaType.name, import: javaType.import, fixture: fixtureResolver.resolve(attribute.type, index).javaExpression, methodName: `${attribute.name}Equals`, testSuffix: toJavaTypeName(attribute.name) };
        });
        return [
          { templateId: "infra-database-querydsl-predicate-builder", model: { packageName, exceptionPackage: `${namespace}.core.common.exception`, entityPackage: `${namespace}.infra.domains.${domainName}.entity`, entityType, entityName: entity.name, qVariableName: toJavaFieldName(`${entityType}Entity`), methods: predicateMethods, imports: [...new Set(predicateMethods.flatMap((method) => method.import === undefined ? [] : [method.import]))] }, outputVariables: { ...pagingVariables, domainName, className: `${entityType}PredicateBuilder` } },
          { templateId: "infra-database-querydsl-predicate-builder-test", model: { packageName, exceptionPackage: `${namespace}.core.common.exception`, entityType, className: `${entityType}PredicateBuilderTests`, methods: predicateMethods, imports: [...new Set(predicateMethods.flatMap((method) => method.import === undefined ? [] : [method.import]))] }, outputVariables: { ...pagingVariables, domainName, className: `${entityType}PredicateBuilderTests` } },
        ];
      }),
    ];
  }
}
