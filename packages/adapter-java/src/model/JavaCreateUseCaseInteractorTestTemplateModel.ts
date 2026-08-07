export interface JavaCreateUseCaseInteractorTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interactorType: string;
  readonly fakeGatewayType: string;
  readonly gatewayType: string;
  readonly entityType: string;
  readonly commandType: string;
  readonly identifierType: string;
  readonly entityConstructorArguments: readonly string[];
  readonly commandArguments: readonly string[];
  readonly fieldAssertions: readonly {
    readonly accessorName: string;
    readonly expectedExpression: string;
  }[];
  readonly requiredFields: readonly {
    readonly fieldName: string;
    readonly messageKey: string;
    readonly testMethodSuffix: string;
    readonly nullArguments: readonly string[];
  }[];
  readonly executeMethodName: string;
  readonly gatewayCreateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly secondaryDependencyFixtureExpression?: string;
}
