export interface JavaLocaleNegotiationTestTemplateModel {
  readonly packageName: string;
  readonly className: string;
  readonly defaultLocaleExpression: string;
  readonly supportedLocaleExpression: string;
  readonly acceptLanguageHeaderName: string;
  readonly supportedAcceptLanguage: string;
  readonly unsupportedAcceptLanguage: string;
  readonly messageKey: string;
  readonly supportedMessage: string;
  readonly defaultMessage: string;
}
