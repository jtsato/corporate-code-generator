export interface JavaRestorePersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly deleteUseCaseType: string;
  readonly deleteUseCaseFieldName: string;
  readonly deleteCommandType: string;
  readonly restoreUseCaseType: string;
  readonly restoreUseCaseFieldName: string;
  readonly restoreCommandType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly persistenceEntityType: string;
  readonly declaredFixtures: readonly { readonly constantName: string; readonly type: string; readonly javaExpression: string }[];
  readonly entityConstructorArguments: readonly string[];
  readonly identifierExpression: string;
  readonly missingIdentifierExpression: string;
  readonly conflictingEntityConstructorArguments: readonly string[];
  readonly hasUniqueAttribute: boolean;
  readonly notFoundExceptionType: string;
  readonly conflictExceptionType: string;
  readonly conflictMessageKey: string;
}
