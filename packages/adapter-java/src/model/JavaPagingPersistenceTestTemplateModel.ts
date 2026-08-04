export interface JavaPagingPersistenceTestRecord {
  readonly constructorArguments: readonly string[];
}

export interface JavaPagingPersistenceTestScenario {
  readonly methodName: string;
  readonly page: number;
  readonly size: number;
  readonly expectedItemCount: number;
  readonly expectedTotalItems: number;
  readonly expectedTotalPages: number;
}

export interface JavaPagingPersistenceTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly executeMethodName: string;
  readonly pageRequestType: string;
  readonly pageRequestFactoryMethodName: string;
  readonly pageResultType: string;
  readonly records: readonly JavaPagingPersistenceTestRecord[];
  readonly scenarios: readonly JavaPagingPersistenceTestScenario[];
}
