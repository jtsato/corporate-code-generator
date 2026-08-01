import type { MavenDependencyTemplateModel } from "./MavenPomTemplateModel.js";

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
}
