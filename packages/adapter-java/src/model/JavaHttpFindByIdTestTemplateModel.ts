export interface JavaHttpFindByIdTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly jsonName: string;
}

export interface JavaHttpFindByIdTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly persistenceEntityType: string;
  readonly fixtures: readonly JavaHttpFindByIdTestFixture[];
  readonly identifierConstantName: string;
  readonly missingIdentifierExpression: string;
  readonly endpointPath: string;
}
