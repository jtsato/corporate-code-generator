import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const APPLICATION_TEMPLATE_IDS = [
  "web-api-health-response",
  "web-api-health-controller",
  "web-api-i18n-messages-en",
  "web-api-i18n-messages-pt",
  "web-api-i18n-language-negotiation",
  "web-api-i18n-language-negotiation-test",
  "web-api-i18n-language-resolver",
  "web-api-i18n-module",
  "web-api-i18n-service",
  "web-api-http-response",
  "web-api-http-response-builder",
  "web-api-response-transformer-interceptor",
  "web-api-not-found-exception-filter",
  "web-api-validation-exception-filter",
  "web-api-conflict-exception-filter",
] as const;

const PER_ENTITY_TEMPLATE_IDS = [
  "web-api-create-request",
  "web-api-update-request",
  "web-api-patch-request",
  "web-api-response",
  "web-api-presenter",
  "web-api-page-request",
  "web-api-filter-parser",
  "web-api-sort-parser",
  "web-api-sort-parser-test",
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
