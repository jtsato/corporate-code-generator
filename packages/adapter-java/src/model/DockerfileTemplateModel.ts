export interface DockerfileModulePomCopy {
  readonly source: string;
  readonly destination: string;
}

export interface DockerfileTemplateModel {
  readonly builderImage: string;
  readonly runtimeImage: string;
  readonly buildWorkingDirectory: string;
  readonly runtimeWorkingDirectory: string;
  readonly modulePomCopies: readonly DockerfileModulePomCopy[];
  readonly resolvePluginsCommand: string;
  readonly packageCommand: string;
  readonly builtJarPath: string;
  readonly runtimeJarPath: string;
  readonly javaToolOptions: string;
  readonly serverPort: number;
  readonly runtimeUserName: string;
  readonly runtimeUserId: number;
  readonly runtimeGroupName: string;
  readonly runtimeGroupId: number;
  readonly healthcheckInterval: string;
  readonly healthcheckTimeout: string;
  readonly healthcheckStartPeriod: string;
  readonly healthcheckRetries: number;
  readonly healthcheckUrl: string;
}
