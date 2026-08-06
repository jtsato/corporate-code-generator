export interface JavaFindDeletedUseCaseTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly interfaceName: string;
  readonly entityType: string;
  readonly tombstoneType: string;
  readonly executeMethodName: string;
  readonly identifierType?: string;
  readonly identifierParameterName?: string;
  readonly filterExpressionType?: string;
  readonly filterExpressionParameterName?: string;
  readonly pageRequestType?: string;
  readonly pageRequestParameterName?: string;
  readonly pageResultType?: string;
}
