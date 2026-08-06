export interface JavaUpdatePersistenceTestDeclaredFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
}

export interface JavaUpdatePersistenceTestAssertionFixture {
  readonly constantName: string;
  readonly accessorName: string;
}

export interface JavaUpdatePersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly commandType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly persistenceEntityType: string;
  readonly declaredFixtures: readonly JavaUpdatePersistenceTestDeclaredFixture[];
  readonly originalEntityConstructorArguments: readonly string[];
  readonly commandArguments: readonly string[];
  readonly assertionFixtures: readonly JavaUpdatePersistenceTestAssertionFixture[];
  readonly identifierExpression: string;
  readonly notFoundExceptionType: string;
  readonly notFoundMessageKey: string;
  readonly notFoundDefaultMessage: string;
  readonly missingIdentifierExpression: string;
  readonly missingCommandArguments: readonly string[];
}
