export interface JavaCreatePersistenceTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly accessorName: string;
}

export interface JavaCreatePersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly commandType: string;
  readonly commandArguments: readonly string[];
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly identifierType: string;
  readonly identifierExpression: string;
  readonly conflictExceptionType: string;
  readonly conflictMessageKey: string;
  readonly conflictDefaultMessage: string;
  readonly conflictCommandArguments: readonly string[];
  readonly fixtures: readonly JavaCreatePersistenceTestFixture[];
}
