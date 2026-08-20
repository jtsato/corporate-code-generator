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
  "core-update-command",
  "core-update-command-validator",
  "core-update-gateway",
  "core-update-usecase-interface",
  "core-update-usecase",
  "core-update-usecase-test",
  "core-patch-command",
  "core-patch-changes",
  "core-patch-command-validator",
  "core-patch-usecase-interface",
  "core-patch-usecase",
  "core-patch-usecase-test",
  "core-delete-command",
  "core-delete-gateway",
  "core-delete-usecase-interface",
  "core-delete-usecase",
  "core-delete-usecase-test",
  "core-get-by-id-query",
  "core-get-by-id-query-validator",
  "core-get-by-id-gateway",
  "core-get-by-id-usecase-interface",
  "core-get-by-id-usecase",
  "core-page-query",
  "core-page-gateway",
  "core-page-usecase-interface",
  "core-page-usecase",
  "core-get-by-id-usecase-test",
] as const;

const APPLICATION_TEMPLATES = [
  "core-exception",
  "core-field-violation",
  "core-not-found-exception",
  "core-validation-exception",
  "core-sort-direction",
  "core-sort-order",
  "core-sort-order-test",
  "core-page-request",
  "core-page-request-test",
  "core-page-result",
  "core-filter-operator",
  "core-filter-condition",
  "core-filter-expression",
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
          pluralFileName: entity.pluralFileName,
        },
      })),
    );

    return [...applicationInvocations, ...entityInvocations];
  }
}
