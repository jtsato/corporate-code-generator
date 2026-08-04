export interface JavaOpenApiSmokeTestTemplateModel {
  readonly packageName: string;
  readonly className: string;
  readonly title: string;
  readonly endpointPath: string;
  readonly filterParameterName: string;
  readonly filterParameterDescriptionFragment: string;
  readonly sortParameterName: string;
  readonly sortParameterDescriptionFragment: string;
  readonly pageParameterName: string;
  readonly sizeParameterName: string;
  readonly pageResponseSchemaName: string;
  readonly itemResponseSchemaName: string;
}
