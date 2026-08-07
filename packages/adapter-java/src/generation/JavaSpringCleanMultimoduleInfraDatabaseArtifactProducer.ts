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
import { toJavaDatabaseUniqueConstraintName } from "../naming/JavaDatabaseConstraintName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";

/**
 * Spring Data Querydsl executor used by generated repositories. `ListQuerydslPredicateExecutor`
 * returns `List` from `findAll(Predicate)`; `QuerydslPredicateExecutor` returns `Iterable` and
 * requires the provider to convert explicitly. See ADR-036.
 */
const querydslPredicateExecutorType = "ListQuerydslPredicateExecutor";
const requiresIterableConversion = false;

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
      persistenceImports.add("java.time.Instant");
      const uniqueAttributes = entity.attributes.filter((attribute) => attribute.unique === true);
      const uniqueGroups = entity.uniqueGroups ?? [];
      if (uniqueAttributes.length > 0 || uniqueGroups.length > 0) persistenceImports.add("jakarta.persistence.UniqueConstraint");
      const fields = entity.attributes.map((attribute) => {
        const javaType = typeResolver.resolve(attribute.type);
        persistenceImports.add(javaType.import);
        return {
          name: attribute.name,
          type: javaType.name,
          columnName: toJavaDatabaseColumnName(attribute.name),
          nullable: !attribute.required,
          identifier: attribute.identifier,
          ...(attribute.unique === true ? { unique: true } : {}),
        };
      });
      if (entity.audited === true) persistenceImports.add("java.time.LocalDateTime");
      const auditedFields = entity.audited === true
        ? [
            { name: "createdAt", type: "LocalDateTime", columnName: "created_at", nullable: false, identifier: false },
            { name: "updatedAt", type: "LocalDateTime", columnName: "updated_at", nullable: false, identifier: false },
          ]
        : [];
      const allFields = [...fields, ...auditedFields];
      const persistenceModel: JavaPersistenceEntityTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.entity`,
        imports: persistenceImports.values(),
        className: `${entityType}Entity`,
        tableName: toJavaDatabaseTableName(entityType),
        fields: allFields,
        constructorParameters: allFields.map(({ name, type }) => ({ name, type })),
        getters: allFields.map(({ name, type }) => ({ name: `get${toJavaTypeName(name)}`, returnType: type, fieldName: name })),
        deletionTimestampFieldName: "deletedAt",
        deletionTimestampColumnName: "deleted_at",
        deletionTimestampGetterName: "getDeletedAt",
        deletionScopeFieldName: "deletionScope",
        deletionScopeColumnName: "deletion_scope",
        activeScopeConstantName: "ACTIVE_SCOPE",
        activeScopeValue: "ACTIVE",
        markDeletedMethodName: "markDeleted",
        restoreMethodName: "restore",
        isActiveMethodName: "isActive",
        uniqueConstraints: [
          ...uniqueAttributes.map((attribute) => ({
          name: toJavaDatabaseUniqueConstraintName(
            toJavaDatabaseTableName(entityType),
            [toJavaDatabaseColumnName(attribute.name)],
          ),
          columnNames: [toJavaDatabaseColumnName(attribute.name), "deletion_scope"],
          })),
          ...uniqueGroups.map((group) => ({
            name: toJavaDatabaseUniqueConstraintName(
              toJavaDatabaseTableName(entityType),
              group.map((attributeName) => toJavaDatabaseColumnName(attributeName)),
            ),
            columnNames: [...group.map((attributeName) => toJavaDatabaseColumnName(attributeName)), "deletion_scope"],
          })),
        ],
        setters: entity.audited === true
          ? [{ name: "setCreatedAt", type: "LocalDateTime", parameterName: "createdAt", fieldName: "createdAt" }]
          : [],
      };
      const gatewayType = `${entityType}Gateway`;
      const mapperImports = new JavaImportCollector();
      mapperImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      mapperImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}Tombstone`);
      mapperImports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
      const domainParameterName = toJavaFieldName(entityType);
      const entityParameterName = toJavaFieldName(`${entityType}Entity`);
      const mapperModel: JavaPersistenceMapperTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.mapper`, imports: mapperImports.values(), className: `${entityType}PersistenceMapper`, constructorName: `${entityType}PersistenceMapper`,
        domainType: entityType, entityType: `${entityType}Entity`, tombstoneType: `${entityType}Tombstone`, domainParameterName, entityParameterName, toEntityMethodName: "toEntity", toDomainMethodName: "toDomain", toTombstoneMethodName: "toTombstone",
        toEntityArguments: entity.attributes.map((attribute) => `${domainParameterName}.get${toJavaTypeName(attribute.name)}()`),
        toDomainArguments: entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`),
        toTombstoneArguments: [...entity.attributes.map((attribute) => `${entityParameterName}.get${toJavaTypeName(attribute.name)}()`), `${entityParameterName}.getDeletedAt()`],
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
      repositoryImports.add(`org.springframework.data.querydsl.${querydslPredicateExecutorType}`);
      const repositoryModel: JavaSpringDataRepositoryTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}.repository`,
        imports: repositoryImports.values(),
        interfaceName: `${entityType}Repository`,
        entityType: `${entityType}Entity`,
        identifierType: identifierType.name,
        baseRepositoryType: "JpaRepository",
        additionalInterfaces: [`${querydslPredicateExecutorType}<${entityType}Entity>`],
      };
      const imports = new JavaImportCollector();
      imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
        imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
        imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}Tombstone`);
      imports.add(`${namespace}.core.common.exception.NotFoundException`);
      imports.add(`${namespace}.core.common.exception.ConflictException`);
      imports.add(identifierType.import);
      imports.add(`${namespace}.infra.domains.${domainName}.mapper.${mapperModel.className}`);
      imports.add(`${namespace}.infra.domains.${domainName}.repository.${repositoryModel.interfaceName}`);
      imports.add(`${namespace}.core.common.filter.FilterExpression`);
      imports.add(`${namespace}.infra.domains.${domainName}.entity.${entityType}Entity`);
      imports.add(`${namespace}.infra.database.common.filter.QuerydslFilterMapper`);
      imports.add(`${namespace}.infra.database.domains.${domainName}.filter.${entityType}QuerydslFilterDefinition`);
      imports.add(`${namespace}.core.common.paging.PageRequest`);
      imports.add(`${namespace}.core.common.paging.PageResult`);
      imports.add(`${namespace}.infra.database.common.paging.SpringDataPageRequestMapper`);
      imports.add(`${namespace}.infra.database.common.paging.SpringDataPageResultMapper`);
      imports.add("com.querydsl.core.types.dsl.BooleanExpression");
      imports.add(`${namespace}.infra.domains.${domainName}.entity.Q${entityType}Entity`);
      imports.add("java.util.List");
      imports.add("java.util.Map");
      imports.add("java.util.Objects");
      imports.add("java.util.Optional");
      imports.add("org.springframework.data.domain.Page");
      imports.add("org.springframework.data.domain.Pageable");
      imports.add("org.springframework.transaction.annotation.Transactional");
      if (requiresIterableConversion) {
        imports.add("java.util.stream.StreamSupport");
      }
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
        mapperToTombstoneMethodName: "toTombstone",
        tombstoneType: `${entityType}Tombstone`,
        identifierType: identifierType.name,
        identifierParameterName: identifiers[0]!.name,
        findByIdMethodName: "findById",
        repositoryFindByIdMethodName: "findById",
        notFoundExceptionType: "NotFoundException",
        notFoundMessageKey: `${toJavaPackageSegment(entity.name)}.not-found`,
        notFoundDefaultMessage: `${entityType} was not found.`,
        findByFilterMethodName: "findByFilter",
        filterExpressionType: "FilterExpression",
        filterExpressionParameterName: "filterExpression",
        filterMapperType: "QuerydslFilterMapper",
        filterMapperMethodName: "toPredicate",
        filterDefinitionType: `${entityType}QuerydslFilterDefinition`,
        filterDefinitionFactoryMethodName: "create",
        findByFilterPageMethodName: "findByFilterPage",
        findDeletedByIdMethodName: "findDeletedById",
        findDeletedByFilterPageMethodName: "findDeletedByFilterPage",
        deletedPredicateMethodName: "deletedPredicate",
        restoreMethodName: "restoreById",
        persistenceEntityType: `${entityType}Entity`,
        persistenceEntitiesVariableName: toJavaFieldName(`${entityType}Entities`),
        requiresIterableConversion,
        findPageMethodName: "findPage",
        pageRequestType: "PageRequest",
        pageRequestParameterName: "pageRequest",
        pageResultType: "PageResult",
        pageableType: "Pageable",
        pageableVariableName: "pageable",
        pageType: "Page",
        pageVariableName: "page",
        pageRequestMapperType: "SpringDataPageRequestMapper",
        pageRequestMapperMethodName: "toPageable",
        pageResultMapperType: "SpringDataPageResultMapper",
        pageResultMapperMethodName: "toPageResult",
        createMethodName: "create",
        createParameterName: toJavaFieldName(entityType),
        repositorySaveMethodName: "save",
        mapperToEntityMethodName: "toEntity",
        identifierAccessorName: `get${toJavaTypeName(identifiers[0]!.name)}`,
        repositoryExistsByIdMethodName: "existsById",
        conflictExceptionType: "ConflictException",
        conflictMessageKey: `${toJavaPackageSegment(entity.name)}.already-exists`,
        conflictDefaultMessage: `${entityType} already exists.`,
        updateMethodName: "update",
        updateParameterName: toJavaFieldName(entityType),
        deleteMethodName: "deleteById",
        deleteParameterName: identifiers[0]!.name,
        repositoryDeleteByIdMethodName: "deleteById",
        querydslEntityVariableName: toJavaFieldName(`${entityType}Entity`),
        activeScopeConstantReference: `${entityType}Entity.ACTIVE_SCOPE`,
        activePredicateMethodName: "activePredicate",
        uniqueChecks: uniqueAttributes.map((attribute) => ({
          domainAccessorName: `get${toJavaTypeName(attribute.name)}`,
          persistenceFieldName: toJavaFieldName(attribute.name),
        })),
        uniqueGroupChecks: uniqueGroups.map((group) => ({
          members: group.map((attributeName) => ({
            domainAccessorName: `get${toJavaTypeName(attributeName)}`,
            persistenceFieldName: toJavaFieldName(attributeName),
          })),
        })),
        identifierPersistenceFieldName: toJavaFieldName(identifiers[0]!.name),
        persistenceEntityActiveMethodName: "isActive",
        persistenceEntityMarkDeletedMethodName: "markDeleted",
        persistenceEntityRestoreMethodName: "restore",
        repositoryExistsMethodName: "exists",
        sortPropertyMapping: entity.attributes.map((attribute) => ({
          domainName: attribute.name,
          persistenceName: toJavaFieldName(attribute.name),
        })),
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
          let operatorsForType: string[];
          if (attribute.type === "decimal" || attribute.type === "int32" || attribute.type === "int64" || attribute.type === "date" || attribute.type === "datetime") {
            operatorsForType = comparisonOperators;
          } else if (attribute.type === "string") {
            operatorsForType = stringOperators;
          } else {
            operatorsForType = equalityOperators;
          }
          const operators = operatorsForType.map((operator) => ({
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
