export interface JavaPatchUseCaseInteractorTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly interfaceName: string;
  readonly commandType: string;
  readonly gatewayType: string;
  readonly gatewayFieldName: string;
  readonly entityType: string;
  readonly mergedEntityArguments: readonly string[];
  readonly executeMethodName: string;
  readonly gatewayFindByIdMethodName: string;
  readonly gatewayUpdateMethodName: string;
  readonly commandRequiredMessageKey: string;
  readonly commandRequiredDefaultMessage: string;
}
