import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import {
  JavaEntityTransformer,
} from "../transformers/JavaEntityTransformer.js";

export class JavaSpringCleanDomainArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "domain";

  public constructor(
    private readonly transformer: JavaEntityTransformer =
      new JavaEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    return request.application.entities.map((entity) => {
      const namespace = request.application.namespace;

      if (namespace === undefined) {
        throw new Error(
          "Java generation requires an application namespace.",
        );
      }

      const model = this.transformer.transform(
        request.application,
        entity,
      );

      return {
        templateId: "domain-entity",
        model,
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          className: model.className,
        },
      };
    });
  }
}
