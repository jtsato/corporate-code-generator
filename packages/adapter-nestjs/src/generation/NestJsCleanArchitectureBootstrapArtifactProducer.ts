import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const APPLICATION_TEMPLATE_IDS = [
  "bootstrap-main",
  "bootstrap-app-module",
  "bootstrap-environment-config",
  "bootstrap-environment-config-test",
  "bootstrap-e2e-test",
] as const;

const PER_ENTITY_TEMPLATE_IDS = [
  "bootstrap-entity-module",
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
