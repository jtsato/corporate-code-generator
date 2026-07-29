export interface JavaApplicationServiceTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly entityType: string;
  readonly findAllMethodName: string;
}
