export interface JavaRestControllerTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly requestMapping: string;
  readonly responseClassName: string;
  readonly findAllMethodName: string;
}
