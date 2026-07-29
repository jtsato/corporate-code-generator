export interface JavaDomainConfigurationTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly gatewayBeanMethodName: string;
  readonly gatewayType: string;
  readonly gatewayImplementationType: string;
  readonly useCaseBeanMethodName: string;
  readonly useCaseType: string;
  readonly useCaseImplementationType: string;
  readonly gatewayParameterName: string;
}
