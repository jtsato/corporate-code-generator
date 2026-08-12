import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const APPLICATION_TEMPLATE_IDS = [
  "web-api-health-response",
  "web-api-health-controller",
  "web-api-i18n-messages",
  "web-api-i18n-service",
  "web-api-http-response",
  "web-api-http-response-builder",
  "web-api-response-transformer-interceptor",
  "web-api-not-found-exception-filter",
  "web-api-validation-exception-filter",
] as const;

const PER_ENTITY_TEMPLATE_IDS = [
  "web-api-create-request",
  "web-api-response",
  "web-api-presenter",
  "web-api-page-request",
  "web-api-filter-parser",
  "web-api-page-response",
  "web-api-controller",
] as const;

export class NestJsCleanArchitectureWebApiArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "web-api";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    const application = this.transformer.transformApplication(request.application);

    const applicationInvocations = APPLICATION_TEMPLATE_IDS.map((templateId) => ({
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
