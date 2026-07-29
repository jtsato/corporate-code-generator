export interface MavenDependencyTemplateModel {
  readonly groupId: string;
  readonly artifactId: string;
  readonly version?: string;
  readonly scope?: string;
}

export interface MavenPomTemplateModel {
  readonly modelVersion: string;
  readonly groupId: string;
  readonly artifactId: string;
  readonly version: string;
  readonly javaVersion: string;
  readonly mavenCompilerPluginVersion: string;
  readonly springBootVersion: string;
  readonly dependencies: readonly MavenDependencyTemplateModel[];
}
