export interface JavaRestoreUseCaseTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly interfaceName: string;
  readonly commandType: string;
  readonly executeMethodName: string;
}
