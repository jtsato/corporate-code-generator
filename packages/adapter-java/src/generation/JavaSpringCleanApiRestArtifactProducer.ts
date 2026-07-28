import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaRestControllerTemplateModel } from "../model/JavaRestControllerTemplateModel.js";
import type { JavaRestResponseTemplateModel } from "../model/JavaRestResponseTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export class JavaSpringCleanApiRestArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "api-rest";

  public constructor(
    private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  ) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("REST generation requires an application namespace.");
    return request.application.entities.flatMap((entity) => [
      this.createControllerInvocation(namespace, entity.name),
      this.createResponseInvocation(namespace, entity),
    ]);
  }

  private createControllerInvocation(namespace: string, entityName: string): TemplateInvocation {
    const className = `${toJavaTypeName(entityName)}Controller`;
    const imports = new JavaImportCollector();
    imports.add("java.util.List");
    imports.add("org.springframework.web.bind.annotation.GetMapping");
    imports.add("org.springframework.web.bind.annotation.RequestMapping");
    imports.add("org.springframework.web.bind.annotation.RestController");
    const model: JavaRestControllerTemplateModel = {
      packageName: `${namespace}.api`,
      imports: imports.values(),
      className,
      requestMapping: toRestCollectionPath(entityName),
      responseClassName: `${toJavaTypeName(entityName)}Response`,
      findAllMethodName: "findAll",
    };
    return {
      templateId: "rest-controller",
      model,
      outputVariables: { packagePath: namespace.replaceAll(".", "/"), className },
    };
  }

  private createResponseInvocation(
    namespace: string,
    entity: GenerationRequest["application"]["entities"][number],
  ): TemplateInvocation {
    const imports = new JavaImportCollector();
    const components = entity.attributes.map((attribute) => {
      const javaType = this.typeResolver.resolve(attribute.type);
      imports.add(javaType.import);
      return { name: attribute.name, type: javaType.name };
    });
    const className = `${toJavaTypeName(entity.name)}Response`;
    const model: JavaRestResponseTemplateModel = {
      packageName: `${namespace}.api`,
      imports: imports.values(),
      recordName: className,
      components,
    };
    return {
      templateId: "rest-response",
      model,
      outputVariables: { packagePath: namespace.replaceAll(".", "/"), className },
    };
  }
}
