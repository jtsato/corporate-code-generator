export interface JavaFindByIdPersistenceTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly accessorName: string;
}

export interface JavaFindByIdPersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly persistenceEntityType: string;
  readonly domainEntityType: string;
  readonly fixtures: readonly JavaFindByIdPersistenceTestFixture[];
  readonly identifierConstantName: string;
  readonly missingIdentifierExpression: string;
  readonly notFoundExceptionType: string;
}
