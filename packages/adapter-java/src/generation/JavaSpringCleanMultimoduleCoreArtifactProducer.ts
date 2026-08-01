import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { createJavaEntityTemplateModel } from "../transformers/createJavaEntityTemplateModel.js";

export class JavaSpringCleanMultimoduleCoreArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "core";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Java generation requires an application namespace.");
    }

    const entityArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = entity.name;
      const gatewayType = `${entityType}Gateway`;
      const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
      const interactorType = `${useCaseType}Interactor`;
      const domainPackage = `${namespace}.core.domains.${domainName}`;
      const entityImports = new JavaImportCollector();
      entityImports.add(`${domainPackage}.model.${entityType}`);
      entityImports.add("java.util.List");
      const outputVariables = {
        packagePath: namespace.replaceAll(".", "/"),
        domainName,
      };

      return [
        {
          templateId: "core-domain-entity",
          model: createJavaEntityTemplateModel(
            entity,
            `${domainPackage}.model`,
            undefined,
            true,
          ),
          outputVariables: { ...outputVariables, className: entityType },
        },
        {
          templateId: "core-gateway",
          model: {
            packageName: `${domainPackage}.gateway`,
            imports: entityImports.values(),
            interfaceName: gatewayType,
            entityType,
            findAllMethodName: "findAll",
          },
          outputVariables: { ...outputVariables, className: gatewayType },
        },
        {
          templateId: "core-find-usecase",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: entityImports.values(),
            interfaceName: useCaseType,
            entityType,
            executeMethodName: "execute",
          },
          outputVariables: { ...outputVariables, className: useCaseType },
        },
        {
          templateId: "core-find-usecase-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: [
              `${domainPackage}.gateway.${gatewayType}`,
              `${domainPackage}.model.${entityType}`,
              "java.util.List",
            ],
            className: interactorType,
            interfaceName: useCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
          },
          outputVariables: { ...outputVariables, className: interactorType },
        },
      ];
    });
    const packageName = `${namespace}.core.common.exception`;
    const pagingPackageName = `${namespace}.core.common.paging`;
    const pagingVariables = { packagePath: namespace.replaceAll(".", "/") };
    return [...entityArtifacts,
      { templateId: "core-application-exception", model: { packageName, className: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ApplicationException" } },
      { templateId: "core-field-violation", model: { packageName, className: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "FieldViolation" } },
      { templateId: "core-validation-exception", model: { packageName, className: "ValidationException", parentClassName: "ApplicationException", fieldViolationClassName: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ValidationException" } },
      { templateId: "core-not-found-exception", model: { packageName, className: "NotFoundException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "NotFoundException" } },
      { templateId: "core-self-validating", model: { packageName: `${namespace}.core.common.validation`, exceptionPackage: packageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "SelfValidating" } },
      ...["SortDirection", "SortOrder", "PageRequest", "PageResult"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...request.application.entities.filter((entity) => entity.attributes.some((attribute) => attribute.required)).map((entity) => { const domainName = toJavaPackageSegment(entity.name); return { templateId: "core-domain-validation-test", model: { packageName: `${namespace}.core.domains.${domainName}.model`, exceptionPackage: packageName, className: `${entity.name}ValidationTests`, entityType: entity.name, nullArguments: entity.attributes, requiredFieldNames: entity.attributes.filter((attribute) => attribute.required).map((attribute) => attribute.name).sort((left, right) => left.localeCompare(right)) }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entity.name}ValidationTests` } }; }),
      ...["SortOrder", "PageRequest", "PageResult"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
    ];
  }
}
