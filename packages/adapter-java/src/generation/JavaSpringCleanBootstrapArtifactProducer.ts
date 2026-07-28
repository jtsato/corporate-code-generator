import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import type { JavaBootstrapTemplateModel } from "../model/JavaBootstrapTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";

export class JavaSpringCleanBootstrapArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "bootstrap";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java bootstrap generation requires an application namespace.");
    const className = `${toJavaTypeName(request.application.name)}Application`;
    const model: JavaBootstrapTemplateModel = { packageName: namespace, className };
    return [{
      templateId: "spring-boot-application",
      model,
      outputVariables: {
        packagePath: namespace.replaceAll(".", "/"),
        className,
      },
    }];
  }
}
