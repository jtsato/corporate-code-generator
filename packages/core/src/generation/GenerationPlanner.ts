import {
  FilePlan,
} from "../file-plan/FilePlan.js";
import type {
  CreateFileOperation,
} from "../file-plan/FileOperation.js";
import type {
  TemplateEngine,
} from "../templates/TemplateEngine.js";
import type {
  TemplatePack,
} from "../template-packs/TemplatePack.js";
import {
  findTemplateDefinition,
} from "../template-packs/TemplateDefinitionLookup.js";
import type {
  GenerationArtifactProducer,
} from "./GenerationArtifactProducer.js";
import {
  GenerationProducerCompatibilityError,
} from "./GenerationProducerCompatibilityError.js";
import type {
  GenerationRequest,
} from "./GenerationRequest.js";
import {
  SimpleOutputPathResolver,
  type OutputPathResolver,
} from "./OutputPathResolver.js";
import type {
  TemplateInvocation,
} from "./TemplateInvocation.js";
import {
  TemplateDefinitionModuleMismatchError,
} from "./TemplateDefinitionModuleMismatchError.js";

export class GenerationPlanner {
  public constructor(
    private readonly templateEngine: TemplateEngine,
    private readonly artifactProducer: GenerationArtifactProducer,
    private readonly templatePack: TemplatePack,
    private readonly outputPathResolver: OutputPathResolver =
      new SimpleOutputPathResolver(),
  ) {}

  public async plan(
    request: GenerationRequest,
  ): Promise<FilePlan> {
    this.validateCompatibility(request);

    const invocations = this.artifactProducer.produce(request);
    const operations: CreateFileOperation[] = [];

    for (const invocation of invocations) {
      const definition = this.lookupDefinition(invocation.templateId);

      if (definition.module !== this.artifactProducer.moduleId) {
        throw new TemplateDefinitionModuleMismatchError(
          definition.id,
          definition.module,
          this.artifactProducer.moduleId,
        );
      }

      const targetPath = this.outputPathResolver.resolve(
        definition.output,
        invocation.outputVariables,
      );

      const content = await this.templateEngine.render(
        definition.template,
        invocation.model,
      );

      operations.push({
        kind: "CREATE",
        targetPath,
        content,
      });
    }

    return FilePlan.create(operations);
  }

  private lookupDefinition(templateId: string) {
    return findTemplateDefinition(this.templatePack, templateId);
  }

  private validateCompatibility(
    request: GenerationRequest,
  ): void {
    const isProfileCompatible =
      request.profile.id === this.artifactProducer.profileId;
    const isModuleCompatible = request.modules.some(
      (module) => module.id === this.artifactProducer.moduleId,
    );

    if (isProfileCompatible && isModuleCompatible) {
      return;
    }

    throw new GenerationProducerCompatibilityError(
      this.artifactProducer.profileId,
      this.artifactProducer.moduleId,
      request.profile.id,
      request.modules.map((module) => module.id),
    );
  }
}
