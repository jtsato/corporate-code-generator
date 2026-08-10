export interface JavaLocaleConfigurationTemplateModel {
  readonly packageName: string;
  readonly className: string;
  readonly defaultLocaleExpression: string;
  readonly supportedLocaleExpressions: readonly string[];
  readonly messageSourceBasename: string;
  readonly messageSourceEncoding: string;
  readonly fallbackToSystemLocale: boolean;
}
