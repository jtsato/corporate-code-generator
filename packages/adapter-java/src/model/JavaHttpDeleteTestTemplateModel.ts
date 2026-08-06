export interface JavaHttpDeleteTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
}

export interface JavaHttpDeleteTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly endpointPath: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly identifierConstantName: string;
  readonly missingIdentifierExpression: string;
  readonly entityConstructorArguments: readonly string[];
  readonly fixtures: readonly JavaHttpDeleteTestFixture[];
}
