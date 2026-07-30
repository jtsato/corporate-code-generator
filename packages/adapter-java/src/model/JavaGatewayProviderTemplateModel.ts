export interface JavaGatewayProviderTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly gatewayType: string;
  readonly entityType: string;
  readonly findAllMethodName: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly constructorName: string;
  readonly mapperType: string;
  readonly repositoryFindAllMethodName: string;
  readonly mapperToDomainMethodName: string;
}
