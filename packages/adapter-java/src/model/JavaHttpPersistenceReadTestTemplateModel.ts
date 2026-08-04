export interface JavaTestFixtureConstantModel {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
}

export interface JavaHttpPersistenceReadTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly fixtures: readonly JavaTestFixtureConstantModel[];
  readonly entityType: string;
  readonly entityConstructorArguments: readonly string[];
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly repositoryCleanupMethodName: string;
  readonly repositorySaveMethodName: string;
  readonly autowiredAnnotationType: string;
  readonly cleanupAnnotationType: string;
  readonly cleanupMethodName: string;
  readonly serverPortAnnotationType: string;
  readonly serverPortFieldName: string;
  readonly testMethodName: string;
  readonly endpointUriExpression: string;
  readonly requestType: string;
  readonly responseType: string;
  readonly responseBodyType: string;
  readonly httpClientType: string;
  readonly objectMapperType: string;
  readonly jsonNodeType: string;
  readonly expectedStatusCode: number;
  readonly expectedItemsBodyExpression: string;
  readonly contentTypeHeaderName: string;
  readonly expectedContentTypePrefix: string;
  readonly activeProfile: string;
}
