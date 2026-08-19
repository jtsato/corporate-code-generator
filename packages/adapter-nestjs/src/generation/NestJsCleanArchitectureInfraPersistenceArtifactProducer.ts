import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const PER_ENTITY_TEMPLATE_IDS = [
  "infra-persistence-entity-model",
  "infra-persistence-mapper",
  "infra-persistence-repository",
  "infra-persistence-create-provider",
  "infra-persistence-get-by-id-provider",
  "infra-persistence-page-provider",
  "infra-persistence-update-provider",
  "infra-persistence-delete-provider",
] as const;

export class NestJsCleanArchitectureInfraPersistenceArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "infra-persistence";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    return request.application.entities.flatMap((entity) => {
      const model = this.transformer.transform(entity);

      return PER_ENTITY_TEMPLATE_IDS.map((templateId) => ({
        templateId,
        model,
        outputVariables: {
          fileName: model.fileName,
          pluralFileName: model.pluralFileName,
        },
      }));
    });
  }
}
