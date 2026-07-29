export interface MavenMultimoduleParentPomTemplateModel {
  readonly modelVersion: "4.0.0";
  readonly springBootVersion: string;
  readonly groupId: string;
  readonly artifactId: string;
  readonly version: string;
  readonly modules: readonly string[];
  readonly javaVersion: string;
}
