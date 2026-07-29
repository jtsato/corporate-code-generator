import { resolve } from "node:path";
import {
  GenerationPlanner,
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  ModuleResolver,
  ProfileResolver,
  SchemaValidator,
  SchemaVersionDetector,
  SemanticValidator,
  TemplatePackResolver,
  FilePlan,
  type GenerationArtifactProducer,
  type GenerationRequest,
} from "@corporate-code-generator/core";
import {
  JavaSpringCleanApplicationArtifactProducer,
  JavaSpringCleanBootstrapArtifactProducer,
  JavaSpringCleanApiRestArtifactProducer,
  JavaSpringCleanBuildArtifactProducer,
  JavaSpringCleanDomainArtifactProducer,
  JavaSpringCleanMultimoduleBuildArtifactProducer,
  JavaSpringCleanMultimoduleCoreArtifactProducer,
  JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer,
  JavaSpringCleanMultimoduleConfigurationArtifactProducer,
} from "@corporate-code-generator/adapter-java";
import { NunjucksTemplateEngine } from "@corporate-code-generator/template-engine-nunjucks";
import { NodeFileWriter } from "@corporate-code-generator/file-writer-node";
import { formatCliError } from "../CliErrorFormatter.js";
import type { GenerateOptions } from "./GenerateOptions.js";

type WriteFilePlan = (plan: FilePlan, outputDirectory: string) => Promise<void>;

export class GenerateCommand {
  public constructor(
    private readonly writeFilePlan: WriteFilePlan = (plan, output) => new NodeFileWriter().write(plan, output),
  ) {}

  public async execute(options: GenerateOptions): Promise<number> {
    try {
      if (!options.dryRun && options.outputDirectory === undefined) {
        throw new CliUsageError("Option '--output' is required unless '--dry-run' is used.");
      }
      const application = await this.loadApplication(options.modelPath);
      const profile = await new ProfileResolver(resolve(process.cwd(), "profiles")).resolve(options.profileId);
      const modules = options.moduleIds.length === 0
        ? new ModuleResolver().resolveAll(profile.modules)
        : new ModuleResolver().resolveSelected(profile.modules, options.moduleIds);
      const producers = this.createProducers(profile.id, modules);
      const resolvedPack = await new TemplatePackResolver(
        resolve(process.cwd(), "template-packs"),
      ).resolve(profile.templatePack);
      const request = { application, profile, modules } satisfies GenerationRequest;
      const operations = [];
      for (const producer of producers) {
        const planner = new GenerationPlanner(
          new NunjucksTemplateEngine([resolvedPack.directory]),
          producer,
          resolvedPack.templatePack,
        );
        const currentPlan = await planner.plan(request);
        operations.push(...currentPlan.operations);
      }
      const plan = FilePlan.create(operations);
      if (options.dryRun) {
        printDryRun(plan);
      } else {
        await this.writeFilePlan(plan, resolve(process.cwd(), options.outputDirectory as string));
      }
      return 0;
    } catch (error) {
      for (const line of formatCliError(error)) console.error(line);
      return 1;
    }
  }

  private async loadApplication(modelPath: string) {
    const document = await new ModelLoader().load(modelPath);
    const schemaVersion = new SchemaVersionDetector().detect(document);
    if (schemaVersion === undefined) throw new CliUsageError("Model schema version is missing.");
    const schema = await new ModelSchemaRegistry().get(schemaVersion);
    const schemaValidator: SchemaValidator = new SchemaValidator(schema);
    schemaValidator.validate(document);
    const application = new ModelParser().parse(document);
    new SemanticValidator().validate(application);
    return application;
  }

  private createProducers(profileId: string, modules: readonly { readonly id: string }[]): readonly GenerationArtifactProducer[] {
    if (profileId === "java-spring-clean-multimodule") {
      const producers: GenerationArtifactProducer[] = [];
      for (const module of modules) {
        if (module.id === "build") producers.push(new JavaSpringCleanMultimoduleBuildArtifactProducer());
        else if (module.id === "core") producers.push(new JavaSpringCleanMultimoduleCoreArtifactProducer());
        else if (module.id === "entrypoints-rest") producers.push(new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer());
        else if (module.id === "configuration") producers.push(new JavaSpringCleanMultimoduleConfigurationArtifactProducer());
        else throw new CliCapabilityError(
          "Profile 'java-spring-clean-multimodule' currently supports only the 'build', 'core' and 'entrypoints-rest' modules; complete multi-module generation is not implemented yet.",
        );
      }
      return producers;
    }

    if (profileId !== "java-spring-clean") {
      throw new CliCapabilityError(`Profile/module combination is not supported by this CLI: ${profileId}.`);
    }
    const producers: GenerationArtifactProducer[] = [];
    for (const module of modules) {
      if (module.id === "build") producers.push(new JavaSpringCleanBuildArtifactProducer());
      else if (module.id === "domain") producers.push(new JavaSpringCleanDomainArtifactProducer());
      else if (module.id === "application") producers.push(new JavaSpringCleanApplicationArtifactProducer());
      else if (module.id === "bootstrap") producers.push(new JavaSpringCleanBootstrapArtifactProducer());
      else if (module.id === "api-rest") producers.push(new JavaSpringCleanApiRestArtifactProducer());
      else throw new CliCapabilityError(`Module '${module.id}' is not supported by this CLI.`);
    }
    return producers;
  }
}

class CliUsageError extends Error { public readonly code = "CLI001"; }
class CliCapabilityError extends Error { public readonly code = "CLI002"; }

function printDryRun(plan: FilePlan): void {
  console.log("Generation plan:");
  for (const operation of plan.operations) console.log(`  ${operation.kind} ${operation.targetPath}`);
  console.log();
  console.log("Summary:");
  console.log(`  Operations: ${plan.operations.length}`);
  console.log(`  CREATE: ${plan.operations.filter((operation) => operation.kind === "CREATE").length}`);
}
