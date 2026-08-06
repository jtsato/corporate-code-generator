export interface JavaHttpRestoreTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly endpointPath: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly identifierConstantName: string;
  readonly entityConstructorArguments: readonly string[];
  readonly conflictingEntityConstructorArguments: readonly string[];
  readonly fixtures: readonly { readonly constantName: string; readonly type: string; readonly javaExpression: string }[];
  readonly restoreResponseStatus: number;
}
