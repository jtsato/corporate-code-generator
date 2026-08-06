export interface JavaRestoreUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly executeMethodName: string;
  readonly gatewayRestoreMethodName: string;
  readonly identifierAccessorName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
}
