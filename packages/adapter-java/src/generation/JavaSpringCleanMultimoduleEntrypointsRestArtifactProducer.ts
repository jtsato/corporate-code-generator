import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaDelegatingRestControllerTemplateModel } from "../model/JavaDelegatingRestControllerTemplateModel.js";
import type { JavaFactoryRestResponseTemplateModel } from "../model/JavaFactoryRestResponseTemplateModel.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export class JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "entrypoints-rest";

  public constructor(private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver()) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("REST generation requires an application namespace.");
    return request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const packageName = `${namespace}.entrypoint.rest.domains.${domainName}`;
      const entityType = toJavaTypeName(entity.name);
      const controllerName = `${entityType}Controller`;
      const responseName = `${entityType}Response`;
      const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
      const controllerImports = new JavaImportCollector();
      controllerImports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
      controllerImports.add("java.util.List");
      controllerImports.add("org.springframework.web.bind.annotation.GetMapping");
      controllerImports.add("org.springframework.web.bind.annotation.RequestMapping");
      controllerImports.add("org.springframework.web.bind.annotation.RestController");
      const controller: JavaDelegatingRestControllerTemplateModel = {
        packageName,
        imports: controllerImports.values(),
        className: controllerName,
        requestMapping: toRestCollectionPath(entity.name),
        responseClassName: responseName,
        findAllMethodName: "findAll",
        useCaseType,
        useCaseFieldName: toJavaFieldName(useCaseType),
        useCaseExecuteMethodName: "execute",
        responseFactoryMethodName: "from",
      };
      const responseImports = new JavaImportCollector();
      responseImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      const components = entity.attributes.map((attribute) => {
        const type = this.typeResolver.resolve(attribute.type);
        responseImports.add(type.import);
        return { name: attribute.name, type: type.name };
      });
      const response: JavaFactoryRestResponseTemplateModel = {
        packageName,
        imports: responseImports.values(),
        recordName: responseName,
        components,
        factoryMethodName: "from",
        factoryParameterType: entityType,
        factoryParameterName: toJavaFieldName(entityType),
        factoryArguments: entity.attributes.map((attribute) =>
          `${toJavaFieldName(entityType)}.get${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)}()`,
        ),
      };
      const variables = { packagePath: namespace.replaceAll(".", "/"), domainName };
      return [
        { templateId: "entrypoints-rest-controller", model: controller, outputVariables: { ...variables, className: controllerName } },
        { templateId: "entrypoints-rest-response", model: response, outputVariables: { ...variables, className: responseName } },
      ];
    });
  }
}
