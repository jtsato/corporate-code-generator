export interface JavaOpenApiSmokeTestTemplateModel {
  readonly packageName: string;
  readonly className: string;
  readonly title: string;
  readonly endpointPath: string;
  readonly findByIdEndpointPath: string;
  readonly identifierParameterName: string;
  readonly identifierSchemaFormat: string;
  readonly filterParameterName: string;
  readonly filterParameterDescriptionFragment: string;
  readonly sortParameterName: string;
  readonly sortParameterDescriptionFragment: string;
  readonly pageParameterName: string;
  readonly sizeParameterName: string;
  readonly pageResponseSchemaName: string;
  readonly itemResponseSchemaName: string;
  readonly createRequestSchemaName: string;
  readonly createResponseSchemaName: string;
  readonly updateRequestSchemaName: string;
  readonly patchRequestSchemaName: string;
}
