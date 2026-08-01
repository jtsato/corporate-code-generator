export interface JavaCorsSmokeTestTemplateModel {
  readonly packageName: string;
  readonly className: string;
  readonly endpointPath: string;
  readonly allowedOrigin: string;
  readonly expectedStatusCode: number;
}
