import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { persistenceOf } from "../options/PersistenceOption.js";
import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";
import {
  packageRootsFor,
  workspacePackagesFor,
  type NestJsWorkspacePackage,
} from "./NestJsMultimoduleLayout.js";

/**
 * Renders the single-package profile's artifacts into a workspace layout.
 *
 * It delegates to the single-package producer rather than restating the artifact
 * list, so a milestone that adds an artifact adds it to both profiles at once.
 * The only thing added on the way through is the set of package roots: the
 * shared templates default those to the relative paths a folder layout needs, so
 * supplying them is what turns a folder import into a package import.
 *
 * Scaffolding that has no single-package counterpart — each package's own
 * manifest and compiler configuration — is contributed here, by the module that
 * owns the package.
 */
export class NestJsMultimoduleArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "nestjs-clean-architecture-multimodule";

  public constructor(
    private readonly delegate: GenerationArtifactProducer,
    private readonly packageTemplateIds: readonly string[] = [],
    private readonly transformer: NestJsEntityTransformer = new NestJsEntityTransformer(),
  ) {}

  public get moduleId(): string {
    return this.delegate.moduleId;
  }

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const applicationName = request.application.name;
    const roots = packageRootsFor(applicationName);
    const packages = workspacePackagesFor(applicationName, persistenceOf(request));

    const delegated = this.delegate.produce(request).map((invocation) => ({
      ...invocation,
      model: { ...invocation.model, ...roots },
    }));

    if (this.packageTemplateIds.length === 0) {
      return delegated;
    }

    const owned = packages.find((candidate) => candidate.name === this.moduleId);

    if (owned === undefined) {
      throw new Error(
        `No workspace package is declared for module '${this.moduleId}'.`,
      );
    }

    const model = {
      ...this.transformer.transformApplication(request.application),
      ...roots,
      packages,
      packageName: owned.name,
      packageDependencies: owned.dependencies,
      packageReferences: owned.references,
    };

    const packageInvocations = this.packageTemplateIds.map((templateId) => ({
      templateId,
      model,
      outputVariables: {},
    }));

    // Ahead of the sources, so a reader of the plan sees the package declared
    // before the files that go into it.
    return [...packageInvocations, ...delegated];
  }
}

/**
 * The workspace-scaffolding producer for the `build` module.
 *
 * It shares nothing with the single-package build producer: a root manifest that
 * declares workspaces, a compiler baseline the packages extend, and a test
 * configuration that maps package names onto sources have no counterpart in a
 * folder layout. The container and continuous-integration artifacts differ too,
 * because the build walks project references rather than compiling one tree.
 */
export class NestJsMultimoduleBuildArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "nestjs-clean-architecture-multimodule";
  public readonly moduleId = "build";

  private static readonly TEMPLATE_IDS = [
    "package-json",
    "tsconfig-base-json",
    "tsconfig-spec-json",
    "build-eslint-config",
    "build-readme",
    "build-gitignore",
    "build-env-example",
    "build-env-development",
    "build-env-test",
    "build-env-production",
    "build-dockerfile",
    "build-dockerignore",
    "build-docker-compose",
    "build-github-actions-ci",
  ] as const;

  private static readonly PACKAGING_TEMPLATE_IDS = new Set<string>([
    "build-dockerfile",
    "build-docker-compose",
    "build-github-actions-ci",
    "build-readme",
  ]);

  public constructor(
    private readonly transformer: NestJsEntityTransformer = new NestJsEntityTransformer(),
  ) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const applicationName = request.application.name;
    const persistence = persistenceOf(request);

    const model = {
      ...this.transformer.transformApplication(request.application),
      ...packageRootsFor(applicationName),
      persistence,
      packages: workspacePackagesFor(applicationName, persistence).map(
        (workspacePackage: NestJsWorkspacePackage) => ({ name: workspacePackage.name }),
      ),
    };

    // The same coordinates the single-package profile declares once, for the same
    // reason: the Dockerfile, the Compose file and the workflow all restate them.
    const packagingModel = {
      ...model,
      containerPort: 3000,
      healthPath: "/health-check/ready",
      nodeVersion: "22",
      checkoutActionRef: "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1",
      setupNodeActionRef: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0",
    };

    return NestJsMultimoduleBuildArtifactProducer.TEMPLATE_IDS.map((templateId) => ({
      templateId,
      model: NestJsMultimoduleBuildArtifactProducer.PACKAGING_TEMPLATE_IDS.has(templateId)
        ? packagingModel
        : model,
      outputVariables: {},
    }));
  }
}
