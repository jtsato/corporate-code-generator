import type { MavenDependencyTemplateModel } from "./MavenPomTemplateModel.js";

export interface MavenMultimoduleParentPomTemplateModel {
  readonly modelVersion: "4.0.0";
  readonly springBootVersion: string;
  readonly groupId: string;
  readonly artifactId: string;
  readonly version: string;
  readonly name: string;
  readonly modules: readonly string[];
  readonly javaVersion: string;
  readonly archUnitVersion: string;
  readonly springdocOpenapiVersion: string;
  readonly querydslVersion: string;
  readonly jakartaPersistenceVersion: string;
  readonly jakartaAnnotationVersion: string;
  readonly expresslyVersion: string;
  readonly jacocoVersion: string;
  readonly pitestVersion: string;
  readonly pitestJunit5PluginVersion: string;
  readonly coverageLineMinimum: string;
  readonly managedDependencies: readonly MavenDependencyTemplateModel[];
  readonly sharedDependencies: readonly MavenDependencyTemplateModel[];
}
