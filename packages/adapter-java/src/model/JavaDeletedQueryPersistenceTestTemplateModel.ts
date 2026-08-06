export interface JavaDeletedQueryPersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly deleteUseCaseType: string;
  readonly deleteUseCaseFieldName: string;
  readonly deleteCommandType: string;
  readonly deletedByIdUseCaseType: string;
  readonly deletedByIdUseCaseFieldName: string;
  readonly deletedByFilterPageUseCaseType: string;
  readonly deletedByFilterPageUseCaseFieldName: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly persistenceEntityType: string;
  readonly declaredFixtures: readonly { readonly constantName: string; readonly type: string; readonly javaExpression: string }[];
  readonly entityConstructorArguments: readonly string[];
  readonly identifierExpression: string;
  readonly missingIdentifierExpression: string;
  readonly pageRequestExpression: string;
  readonly tombstoneType: string;
}
