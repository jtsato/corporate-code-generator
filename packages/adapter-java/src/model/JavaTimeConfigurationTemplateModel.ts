export interface JavaTimeConfigurationTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly timeProviderBeanMethodName: string;
  readonly timeProviderType: string;
  readonly timeProviderImplementationType: string;
}
