import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { persistenceOf, type PersistenceOption } from "../options/PersistenceOption.js";
import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

/**
 * The three per-entity templates the `persistence` option selects between, and
 * the module-level ones only some options need.
 *
 * The mapper and the five providers are not here, because the option does not
 * change them. That is the point of the mapper boundary ADR-057 mandated:
 * swapping the storage technology touches the entity and the repository, and
 * nothing that sits between them and the Core.
 */
interface PersistenceTemplates {
  readonly entityModel: string;
  readonly repository: string;
  readonly repositoryTest: string;
  /** Emitted once per project rather than once per entity. */
  readonly moduleTemplates: readonly string[];
}

const TEMPLATES_BY_OPTION: Readonly<Record<PersistenceOption, PersistenceTemplates>> = {
  memory: {
    entityModel: "infra-persistence-entity-model",
    repository: "infra-persistence-repository",
    repositoryTest: "infra-persistence-repository-test",
    moduleTemplates: [],
  },
  typeorm: {
    entityModel: "infra-persistence-typeorm-entity-model",
    repository: "infra-persistence-typeorm-repository",
    repositoryTest: "infra-persistence-typeorm-repository-test",
    // Emitted whether or not this model has a column that needs it. Making it
    // conditional would tie the generated file list to which primitive types a
    // model happens to use, so adding one decimal attribute later would add a
    // file rather than an import.
    moduleTemplates: ["infra-persistence-column-transformers"],
  },
};

const PROVIDER_TEMPLATE_IDS = [
  "infra-persistence-create-provider",
  "infra-persistence-get-by-id-provider",
  "infra-persistence-page-provider",
  "infra-persistence-update-provider",
  "infra-persistence-delete-provider",
  "infra-persistence-restore-provider",
  "infra-persistence-get-deleted-by-id-provider",
  "infra-persistence-page-deleted-provider",
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
    const templates = TEMPLATES_BY_OPTION[persistenceOf(request)];
    const perEntityTemplateIds = [
      templates.entityModel,
      "infra-persistence-mapper",
      templates.repository,
      templates.repositoryTest,
      ...PROVIDER_TEMPLATE_IDS,
    ];

    const moduleInvocations = templates.moduleTemplates.map((templateId) => ({
      templateId,
      model: this.transformer.transformApplication(request.application),
      outputVariables: {},
    }));

    const entityInvocations = request.application.entities.flatMap((entity) => {
      const model = this.transformer.transform(entity);

      return perEntityTemplateIds.map((templateId) => ({
        templateId,
        model,
        outputVariables: {
          fileName: model.fileName,
          pluralFileName: model.pluralFileName,
        },
      }));
    });

    return [...moduleInvocations, ...entityInvocations];
  }
}
