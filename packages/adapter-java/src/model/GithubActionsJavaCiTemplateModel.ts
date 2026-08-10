export interface GithubActionsJavaCiTemplateModel {
  readonly javaVersion: string;
  readonly checkoutActionRef: string;
  readonly setupJavaActionRef: string;
  readonly sonarProjectKey: string;
  readonly mutationCommand: string;
}
