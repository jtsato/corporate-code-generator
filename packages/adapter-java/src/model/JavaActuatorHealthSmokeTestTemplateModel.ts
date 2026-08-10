export interface JavaActuatorHealthSmokeTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly serverPortAnnotationType: string;
  readonly serverPortFieldName: string;
  readonly endpointUriExpression: string;
  readonly testMethodName: string;
  readonly requestType: string;
  readonly responseType: string;
  readonly responseBodyType: string;
  readonly httpClientType: string;
  readonly objectMapperType: string;
  readonly jsonNodeType: string;
  readonly expectedStatusCode: number;
  readonly statusFieldName: string;
  readonly expectedStatus: string;
  readonly detailsFieldName: string;
  readonly activeProfile: string;
}
