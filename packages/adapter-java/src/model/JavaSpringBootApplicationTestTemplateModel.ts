export interface JavaSpringBootApplicationTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly testMethodName: string;
}
