export interface JavaGatewayProviderTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly gatewayType: string;
  readonly entityType: string;
  readonly findAllMethodName: string;
}
