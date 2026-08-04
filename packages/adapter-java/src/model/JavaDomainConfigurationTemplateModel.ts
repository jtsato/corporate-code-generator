export interface JavaDomainConfigurationTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly gatewayBeanMethodName: string;
  readonly gatewayType: string;
  readonly gatewayImplementationType: string;
  readonly repositoryType: string;
  readonly repositoryParameterName: string;
  readonly useCaseBeanMethodName: string;
  readonly useCaseType: string;
  readonly useCaseImplementationType: string;
  readonly gatewayParameterName: string;
  readonly byFilterUseCaseBeanMethodName: string;
  readonly byFilterUseCaseType: string;
  readonly byFilterUseCaseImplementationType: string;
  readonly pageUseCaseBeanMethodName: string;
  readonly pageUseCaseType: string;
  readonly pageUseCaseImplementationType: string;
}
