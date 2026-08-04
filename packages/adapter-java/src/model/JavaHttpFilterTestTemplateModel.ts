export interface JavaHttpFilterTestRecord {
  readonly identifierConstantName: string;
  readonly identifierExpression: string;
  readonly constructorArguments: readonly string[];
}

export interface JavaHttpFilterTestScenario {
  readonly methodName: string;
  readonly filterLiterals: readonly string[];
  readonly expectedStatusCode: number;
  readonly expectedIdentifierConstantNames: readonly string[] | null;
}

export interface JavaHttpFilterTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly identifierType: string;
  readonly identifierFromJsonExpression: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly serverPortAnnotationType: string;
  readonly serverPortFieldName: string;
  readonly endpointPath: string;
  readonly filterParameterName: string;
  readonly requestType: string;
  readonly responseType: string;
  readonly responseBodyType: string;
  readonly httpClientType: string;
  readonly objectMapperType: string;
  readonly jsonNodeType: string;
  readonly records: readonly JavaHttpFilterTestRecord[];
  readonly scenarios: readonly JavaHttpFilterTestScenario[];
}
