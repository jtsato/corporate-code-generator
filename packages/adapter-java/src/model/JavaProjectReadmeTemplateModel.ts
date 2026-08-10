export interface JavaProjectReadmeResourceTemplateModel {
  readonly entityName: string;
  readonly collectionPath: string;
}

export interface JavaProjectReadmeTemplateModel {
  readonly applicationName: string;
  readonly groupId: string;
  readonly artifactId: string;
  readonly version: string;
  readonly javaVersion: string;
  readonly springBootVersion: string;
  readonly modules: readonly string[];
  readonly resources: readonly JavaProjectReadmeResourceTemplateModel[];
  readonly containerImageReference: string;
  readonly containerServerPort: number;
  readonly containerHealthPath: string;
  readonly containerUserId: number;
  readonly containerGroupId: number;
  readonly mutationCommand: string;
  readonly mutationReportPath: string;
}
