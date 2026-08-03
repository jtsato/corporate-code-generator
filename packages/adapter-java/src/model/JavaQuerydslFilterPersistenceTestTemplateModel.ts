export interface JavaQuerydslFilterPersistenceTestRecord {
  readonly identifierConstantName: string;
  readonly identifierExpression: string;
  readonly constructorArguments: readonly string[];
}

export interface JavaQuerydslFilterPersistenceTestScenario {
  readonly methodName: string;
  readonly expression: string;
  readonly expectedIdentifiers: readonly string[];
}

export interface JavaQuerydslFilterPersistenceTestTemplateModel {
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
  readonly filterExpressionParameterName: string;
  readonly identifiersMethodName: string;
  readonly records: readonly JavaQuerydslFilterPersistenceTestRecord[];
  readonly scenarios: readonly JavaQuerydslFilterPersistenceTestScenario[];
}
