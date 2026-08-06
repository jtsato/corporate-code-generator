export interface JavaDeletePersistenceTestTemplateModel {
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
  readonly declaredFixtures: readonly {
    readonly constantName: string;
    readonly type: string;
    readonly javaExpression: string;
  }[];
  readonly entityConstructorArguments: readonly string[];
  readonly identifierExpression: string;
  readonly missingIdentifierExpression: string;
  readonly notFoundExceptionType: string;
  readonly notFoundMessageKey: string;
  readonly notFoundDefaultMessage: string;
}
