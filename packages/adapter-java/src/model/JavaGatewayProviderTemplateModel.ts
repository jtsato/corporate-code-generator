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
  readonly findByFilterMethodName: string;
  readonly filterExpressionType: string;
  readonly filterExpressionParameterName: string;
  readonly filterMapperType: string;
  readonly filterMapperMethodName: string;
  readonly filterDefinitionType: string;
  readonly filterDefinitionFactoryMethodName: string;
  readonly persistenceEntityType: string;
  readonly persistenceEntitiesVariableName: string;
  readonly requiresIterableConversion: boolean;
}
