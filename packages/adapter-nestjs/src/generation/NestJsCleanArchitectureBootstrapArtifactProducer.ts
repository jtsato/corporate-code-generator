import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { persistenceOf, type PersistenceOption } from "../options/PersistenceOption.js";
import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const APPLICATION_TEMPLATE_IDS = [
  "bootstrap-main",
  "bootstrap-app-module",
  "bootstrap-environment-config",
] as const;

const PER_ENTITY_TEMPLATE_IDS = [
  "bootstrap-entity-module",
] as const;

/**
 * The environment test is selected rather than shared. Both render to
 * `src/config/environment.spec.ts`, and the difference is not additive: with an
 * ORM the default configuration is no longer valid on its own, because a
 * server-backed database has to be named, so a case like "applies documented
 * defaults when nothing is set" has to say something different rather than
 * something extra.
 */
const ENVIRONMENT_TEST_TEMPLATE_ID_BY_OPTION: Readonly<Record<PersistenceOption, string>> = {
  memory: "bootstrap-environment-config-test",
  typeorm: "bootstrap-typeorm-environment-config-test",
};

/**
 * The end-to-end suite boots the real composition root, so with an ORM it needs
 * to be told which database to boot against before its first import runs.
 */
const EXTRA_TEMPLATE_IDS_BY_OPTION: Readonly<Record<PersistenceOption, readonly string[]>> = {
  memory: [],
  typeorm: ["bootstrap-e2e-environment-setup"],
};

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
    const persistence = persistenceOf(request);
    const transformed = this.transformer.transformApplication(request.application);
    const application = { ...transformed, persistence };

    const applicationTemplateIds = [
      ...APPLICATION_TEMPLATE_IDS,
      ENVIRONMENT_TEST_TEMPLATE_ID_BY_OPTION[persistence],
      "bootstrap-e2e-test",
      ...EXTRA_TEMPLATE_IDS_BY_OPTION[persistence],
      // One clock module per application, not per audited entity; see the Core
      // producer for why the clock is application-scoped.
      ...(transformed.hasAuditedEntities ? ["bootstrap-clock-module"] : []),
    ];

    const applicationInvocations = applicationTemplateIds.map((templateId) => ({
      templateId,
      model: application,
      outputVariables: {},
    }));

    const entityInvocations = transformed.entities.flatMap((entity) =>
      PER_ENTITY_TEMPLATE_IDS.map((templateId) => ({
        templateId,
        model: { ...entity, persistence },
        outputVariables: {
          fileName: entity.fileName,
          pluralFileName: entity.pluralFileName,
        },
      })),
    );

    return [...applicationInvocations, ...entityInvocations];
  }
}
