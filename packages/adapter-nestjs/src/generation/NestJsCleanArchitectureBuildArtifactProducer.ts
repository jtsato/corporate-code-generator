import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const BUILD_TEMPLATE_IDS = [
  "package-json",
  "tsconfig-json",
  "tsconfig-build-json",
  "nest-cli-json",
] as const;

export class NestJsCleanArchitectureBuildArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "build";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    const model = this.transformer.transformApplication(request.application);

    return BUILD_TEMPLATE_IDS.map((templateId) => ({
      templateId,
      model,
      outputVariables: {},
    }));
  }
}
