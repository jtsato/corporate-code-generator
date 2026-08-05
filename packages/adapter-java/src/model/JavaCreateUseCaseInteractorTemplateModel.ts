export interface JavaCreateUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly entityType: string;
  readonly entityConstructorArguments: readonly string[];
  readonly executeMethodName: string;
  readonly gatewayCreateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
}
