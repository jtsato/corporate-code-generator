import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const APPLICATION_TEMPLATE_IDS = [
  "bootstrap-main",
  "bootstrap-app-module",
] as const;

export class NestJsCleanArchitectureBootstrapArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "bootstrap";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    const model = this.transformer.transformApplication(request.application);

    return APPLICATION_TEMPLATE_IDS.map((templateId) => ({
      templateId,
      model,
      outputVariables: {},
    }));
  }
}
