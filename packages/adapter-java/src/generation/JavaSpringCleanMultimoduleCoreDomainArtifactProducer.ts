import type { GenerationArtifactProducer, GenerationRequest, TemplateInvocation } from "@corporate-code-generator/core";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { createJavaEntityTemplateModel } from "../transformers/createJavaEntityTemplateModel.js";

export class JavaSpringCleanMultimoduleCoreDomainArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "core";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java generation requires an application namespace.");

    return request.application.entities.map((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const model = createJavaEntityTemplateModel(
        entity,
        `${namespace}.core.domains.${domainName}.model`,
      );
      return {
        templateId: "core-domain-entity",
        model,
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          domainName,
          className: model.className,
        },
      };
    });
  }
}
