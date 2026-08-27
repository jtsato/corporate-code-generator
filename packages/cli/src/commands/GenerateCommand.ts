import { resolve } from "node:path";
import {
  GenerationPlanner,
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  ModuleResolver,
  OptionResolver,
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
  JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer,
} from "@corporate-code-generator/adapter-java";
import {
  NestJsCleanArchitectureBootstrapArtifactProducer,
  NestJsCleanArchitectureBuildArtifactProducer,
  NestJsCleanArchitectureCoreArtifactProducer,
  NestJsCleanArchitectureInfraPersistenceArtifactProducer,
  NestJsCleanArchitectureWebApiArtifactProducer,
  NestJsMultimoduleArtifactProducer,
  NestJsMultimoduleBuildArtifactProducer,
} from "@corporate-code-generator/adapter-nestjs";
import { NunjucksTemplateEngine } from "@corporate-code-generator/template-engine-nunjucks";
import { NodeFileWriter } from "@corporate-code-generator/file-writer-node";
import { formatCliError } from "../CliErrorFormatter.js";
import type { GenerateOptions } from "./GenerateOptions.js";

type WriteFilePlan = (plan: FilePlan, outputDirectory: string) => Promise<void>;

type ProducerFactory = () => GenerationArtifactProducer;

const PRODUCER_REGISTRY: Readonly<Record<string, Readonly<Record<string, ProducerFactory>>>> = {
  "java-spring-clean": {
    "build": () => new JavaSpringCleanBuildArtifactProducer(),
    "domain": () => new JavaSpringCleanDomainArtifactProducer(),
    "application": () => new JavaSpringCleanApplicationArtifactProducer(),
    "bootstrap": () => new JavaSpringCleanBootstrapArtifactProducer(),
    "api-rest": () => new JavaSpringCleanApiRestArtifactProducer(),
  },
  "java-spring-clean-multimodule": {
    "build": () => new JavaSpringCleanMultimoduleBuildArtifactProducer(),
    "core": () => new JavaSpringCleanMultimoduleCoreArtifactProducer(),
    "entrypoints-rest": () => new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer(),
    "infra-database": () => new JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer(),
    "configuration": () => new JavaSpringCleanMultimoduleConfigurationArtifactProducer(),
  },
  "nestjs-clean-architecture": {
    "build": () => new NestJsCleanArchitectureBuildArtifactProducer(),
    "core": () => new NestJsCleanArchitectureCoreArtifactProducer(),
    "infra-persistence": () => new NestJsCleanArchitectureInfraPersistenceArtifactProducer(),
    "web-api": () => new NestJsCleanArchitectureWebApiArtifactProducer(),
    "bootstrap": () => new NestJsCleanArchitectureBootstrapArtifactProducer(),
  },
  // The same artifacts, rendered into npm workspace packages. Each module
  // delegates to its single-package producer and contributes the package
  // scaffolding it owns, so an artifact added to one profile appears in both.
  "nestjs-clean-architecture-multimodule": {
    "build": () => new NestJsMultimoduleBuildArtifactProducer(),
    "core": () => new NestJsMultimoduleArtifactProducer(
      new NestJsCleanArchitectureCoreArtifactProducer(),
      ["core-package-json", "core-tsconfig-json"],
    ),
    "infra-persistence": () => new NestJsMultimoduleArtifactProducer(
      new NestJsCleanArchitectureInfraPersistenceArtifactProducer(),
      ["infra-persistence-package-json", "infra-persistence-tsconfig-json"],
    ),
    "web-api": () => new NestJsMultimoduleArtifactProducer(
      new NestJsCleanArchitectureWebApiArtifactProducer(),
      ["web-api-package-json", "web-api-tsconfig-json"],
    ),
    "bootstrap": () => new NestJsMultimoduleArtifactProducer(
      new NestJsCleanArchitectureBootstrapArtifactProducer(),
      ["bootstrap-package-json", "bootstrap-tsconfig-json", "nest-cli-json", "e2e-jest-config"],
    ),
  },
};

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
      const resolvedOptions = new OptionResolver().resolve(profile.options, options.optionAssignments);
      const producers = this.createProducers(profile.id, modules);
      const resolvedPack = await new TemplatePackResolver(
        resolve(process.cwd(), "template-packs"),
      ).resolve(profile.templatePack);
      const request = { application, profile, modules, options: resolvedOptions } satisfies GenerationRequest;
      const operations = [];
      for (const producer of producers) {
        const planner = new GenerationPlanner(
          new NunjucksTemplateEngine(resolvedPack.directories),
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
    const moduleProducers = PRODUCER_REGISTRY[profileId];

    if (moduleProducers === undefined) {
      throw new CliCapabilityError(`Profile/module combination is not supported by this CLI: ${profileId}.`);
    }

    return modules.map((module) => {
      const createProducer = moduleProducers[module.id];

      if (createProducer === undefined) {
        throw new CliCapabilityError(
          `Profile/module combination is not supported by this CLI: ${profileId}/${module.id}.`,
        );
      }

      return createProducer();
    });
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
