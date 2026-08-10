export interface JavaApplicationYamlTemplateModel {
  readonly applicationName: string;
  readonly serverPort: number;
  readonly exposedManagementEndpoints: string;
  readonly healthDetailsPolicy: string;
}
