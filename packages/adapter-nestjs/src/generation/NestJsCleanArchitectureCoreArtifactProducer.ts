import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const PER_ENTITY_TEMPLATE_IDS = [
  "core-domain-model",
  "core-create-command",
  "core-create-command-validator",
  "core-create-gateway",
  "core-create-usecase-interface",
  "core-create-usecase",
  "core-create-usecase-test",
  "core-get-by-id-query",
  "core-get-by-id-query-validator",
  "core-get-by-id-gateway",
  "core-get-by-id-usecase-interface",
  "core-get-by-id-usecase",
  "core-get-by-id-usecase-test",
] as const;

const APPLICATION_TEMPLATES = [
  "core-exception",
  "core-field-violation",
  "core-not-found-exception",
  "core-validation-exception",
] as const;

export class NestJsCleanArchitectureCoreArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "core";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    const application = this.transformer.transformApplication(request.application);

    const applicationInvocations = APPLICATION_TEMPLATES.map((templateId) => ({
      templateId,
      model: application,
      outputVariables: {},
    }));

    const entityInvocations = application.entities.flatMap((entity) =>
      PER_ENTITY_TEMPLATE_IDS.map((templateId) => ({
        templateId,
        model: entity,
        outputVariables: {
          fileName: entity.fileName,
        },
      })),
    );

    return [...applicationInvocations, ...entityInvocations];
  }
}
