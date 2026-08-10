export interface JavaPersistenceProviderTestColumnTemplateModel {
  readonly columnName: string;
  readonly sqlLiteral: string;
}

export interface JavaPersistenceProviderTestFieldTemplateModel {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly accessorName: string;
}

export interface JavaPersistenceProviderTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly providerType: string;
  readonly providerFieldName: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly domainVariableName: string;
  readonly tableName: string;
  readonly activeScope: string;
  readonly deletionScopeColumn: string;
  readonly seededColumns: readonly JavaPersistenceProviderTestColumnTemplateModel[];
  readonly seededFields: readonly JavaPersistenceProviderTestFieldTemplateModel[];
  readonly createdFields: readonly JavaPersistenceProviderTestFieldTemplateModel[];
  readonly updatedFields: readonly JavaPersistenceProviderTestFieldTemplateModel[];
  readonly seededConstructorArguments: readonly string[];
  readonly createdConstructorArguments: readonly string[];
  readonly updatedConstructorArguments: readonly string[];
  readonly identifierConstantName: string;
  readonly createdIdentifierConstantName: string;
}
