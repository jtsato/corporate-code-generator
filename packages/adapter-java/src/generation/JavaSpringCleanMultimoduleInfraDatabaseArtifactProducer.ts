import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaGatewayProviderTemplateModel } from "../model/JavaGatewayProviderTemplateModel.js";
import type { JavaPersistenceEntityTemplateModel } from "../model/JavaPersistenceEntityTemplateModel.js";
import type { JavaPersistenceMapperTemplateModel } from "../model/JavaPersistenceMapperTemplateModel.js";
import { toJavaDatabaseColumnName } from "../naming/JavaDatabaseColumnName.js";
import { toJavaDatabaseTableName } from "../naming/JavaDatabaseTableName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

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
    return request.application.entities.flatMap((entity) => {
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
      const imports = new JavaImportCollector();
      imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
      imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      imports.add("java.util.List");
      const model: JavaGatewayProviderTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}`,
        imports: imports.values(),
        className: `${gatewayType}Provider`,
        gatewayType,
        entityType,
        findAllMethodName: "findAll",
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
        }, {
          templateId: "infra-database-gateway-provider",
          model,
          outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: model.className },
        },
      ];
    });
  }
}
