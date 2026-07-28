import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import type { JavaRestControllerTemplateModel } from "../model/JavaRestControllerTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";

export class JavaSpringCleanApiRestArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "api-rest";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("REST generation requires an application namespace.");
    return request.application.entities.map((entity) => {
      const entityTypeName = toJavaTypeName(entity.name);
      const className = `${entityTypeName}Controller`;
      const model: JavaRestControllerTemplateModel = {
        packageName: `${namespace}.api`,
        className,
        requestMapping: toRestCollectionPath(entity.name),
      };
      return {
        templateId: "rest-controller",
        model,
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          className,
        },
      };
    });
  }
}
