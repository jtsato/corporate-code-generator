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

    return request.application.entities.flatMap((entity) => {
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
  }
}
