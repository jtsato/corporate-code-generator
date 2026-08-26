import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";

import { persistenceOf } from "../options/PersistenceOption.js";
import { NestJsEntityTransformer } from "../transformers/NestJsEntityTransformer.js";

const BUILD_TEMPLATE_IDS = [
  "package-json",
  "tsconfig-json",
  "tsconfig-build-json",
  "nest-cli-json",
  "e2e-jest-config",
  "build-gitignore",
  "build-readme",
  "build-eslint-config",
  "build-env-example",
  "build-env-development",
  "build-env-test",
  "build-env-production",
  "build-dockerfile",
  "build-dockerignore",
  "build-docker-compose",
  "build-github-actions-ci",
] as const;

/**
 * Runtime coordinates the packaging and CI artifacts must agree on.
 *
 * These are declared once because three generated files restate them — the
 * Dockerfile, the Compose file and the CI workflow — and a disagreement between
 * them surfaces only at deploy time. `tests/smoke/nestjs-container.smoke.test.ts`
 * additionally checks them against `.env.production` and the generated health
 * controller, which are the sources these values shadow.
 */
const containerPort = 3000;
const healthPath = "/health-check/ready";
const nodeVersion = "22";

/**
 * Pinned by commit SHA with the tag in a trailing comment, so a moved tag cannot
 * change what CI executes. Each SHA was verified against its tag through the
 * GitHub API rather than copied from documentation.
 */
const checkoutActionRef = "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1";
const setupNodeActionRef = "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0";

/** Templates that need the packaging coordinates on top of the application model. */
const PACKAGING_TEMPLATE_IDS = new Set<string>([
  "build-dockerfile",
  "build-docker-compose",
  "build-github-actions-ci",
]);

export class NestJsCleanArchitectureBuildArtifactProducer
  implements GenerationArtifactProducer {

  public readonly profileId = "nestjs-clean-architecture";
  public readonly moduleId = "build";

  public constructor(
    private readonly transformer: NestJsEntityTransformer =
      new NestJsEntityTransformer(),
  ) {}

  public produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[] {
    // Every build artifact restates something about persistence: the manifest
    // names the driver packages, the environment files name the database, and
    // Compose has to start one. So the option reaches all of them rather than
    // only the packaging subset.
    const model = {
      ...this.transformer.transformApplication(request.application),
      persistence: persistenceOf(request),
    };
    const packagingModel = {
      ...model,
      containerPort,
      healthPath,
      nodeVersion,
      checkoutActionRef,
      setupNodeActionRef,
    };

    return BUILD_TEMPLATE_IDS.map((templateId) => ({
      templateId,
      model: PACKAGING_TEMPLATE_IDS.has(templateId) ? packagingModel : model,
      outputVariables: {},
    }));
  }
}
