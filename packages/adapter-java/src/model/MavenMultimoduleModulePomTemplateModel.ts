import type { MavenDependencyTemplateModel } from "./MavenPomTemplateModel.js";

export interface MavenMutationTestingTemplateModel {
  readonly profileId: string;
  readonly targetClasses: readonly string[];
  readonly targetTests: readonly string[];
  readonly outputFormats: readonly string[];
  readonly timestampedReports: boolean;
}

export interface MavenIntegrationTestingTemplateModel {
  readonly profileId: string;
}

export interface MavenMultimoduleModulePomTemplateModel {
  readonly modelVersion: "4.0.0";
  readonly parentGroupId: string;
  readonly parentArtifactId: string;
  readonly parentVersion: string;
  readonly parentRelativePath: string;
  readonly artifactId: string;
  readonly packaging: "jar";
  readonly dependencies: readonly MavenDependencyTemplateModel[];
  readonly hasSpringBootPlugin: boolean;
  readonly querydslAnnotationProcessing?: boolean;
  readonly finalName?: string;
  readonly mutationTesting?: MavenMutationTestingTemplateModel;
  readonly integrationTesting?: MavenIntegrationTestingTemplateModel;
}
