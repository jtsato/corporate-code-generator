export interface JavaRestoreUseCaseInteractorTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interactorType: string;
  readonly fakeGatewayType: string;
  readonly gatewayType: string;
  readonly entityType: string;
  readonly identifierType: string;
  readonly identifierParameterName: string;
  readonly commandType: string;
  readonly executeMethodName: string;
  readonly gatewayRestoreMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
  readonly identifierRequiredMessageKey: string;
  readonly identifierRequiredDefaultMessage: string;
  readonly identifierValueExpression: string;
  readonly restoreCallCountFieldName: string;
  readonly receivedIdFieldName: string;
}
