import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

export class JavaSpringCleanApplicationArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "application";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    return request.application.entities.map((entity) => {
      const namespace = request.application.namespace;
      if (namespace === undefined) {
        throw new Error("Java generation requires an application namespace.");
      }
      return {
        templateId: "application-service",
        model: {
          packageName: `${namespace}.application`,
          className: `${entity.name}Service`,
        },
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          className: `${entity.name}Service`,
        },
      };
    });
  }
}
