export interface JavaFilteredPagingPersistenceTestRecord {
  readonly identifierConstantName: string;
  readonly identifierExpression: string;
  readonly constructorArguments: readonly string[];
}

export interface JavaFilteredPagingPersistenceTestScenario {
  readonly methodName: string;
  readonly expression: string;
  readonly page: number;
  readonly size: number;
  readonly expectedItemCount: number;
  readonly expectedTotalItems: number;
  readonly expectedTotalPages: number;
  readonly invalid?: boolean;
}

export interface JavaFilteredPagingPersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly identifierType: string;
  readonly identifierGetterName: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly executeMethodName: string;
  readonly filterExpressionType: string;
  readonly pageRequestType: string;
  readonly pageResultType: string;
  readonly identifiersMethodName: string;
  readonly records: readonly JavaFilteredPagingPersistenceTestRecord[];
  readonly scenarios: readonly JavaFilteredPagingPersistenceTestScenario[];
}
