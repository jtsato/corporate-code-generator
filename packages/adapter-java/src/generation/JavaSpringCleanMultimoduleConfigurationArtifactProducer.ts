import type { GenerationArtifactProducer, GenerationRequest, TemplateInvocation } from "@corporate-code-generator/core";
import type { JavaBootstrapTemplateModel } from "../model/JavaBootstrapTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";

export class JavaSpringCleanMultimoduleConfigurationArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "configuration";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java bootstrap generation requires an application namespace.");
    const className = `${toJavaTypeName(request.application.name)}Application`;
    const model: JavaBootstrapTemplateModel = { packageName: namespace, className };
    return [{
      templateId: "configuration-application",
      model,
      outputVariables: { packagePath: namespace.replaceAll(".", "/"), className },
    }];
  }
}
