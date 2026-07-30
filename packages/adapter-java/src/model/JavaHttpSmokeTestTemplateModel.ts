export interface JavaHttpSmokeTestTemplateModel {
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
  readonly expectedStatusCode: number;
  readonly expectedBody: string;
  readonly contentTypeHeaderName: string;
  readonly expectedContentTypePrefix: string;
}
