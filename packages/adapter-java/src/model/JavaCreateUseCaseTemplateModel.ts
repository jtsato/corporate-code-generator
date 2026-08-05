export interface JavaCreateUseCaseTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly interfaceName: string;
  readonly commandType: string;
  readonly entityType: string;
  readonly executeMethodName: string;
}
