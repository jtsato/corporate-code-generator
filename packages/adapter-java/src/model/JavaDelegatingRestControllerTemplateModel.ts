export interface JavaDelegatingRestControllerTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly requestMapping: string;
  readonly responseClassName: string;
  readonly findAllMethodName: string;
  readonly useCaseType: string;
  readonly useCaseFieldName: string;
  readonly useCaseExecuteMethodName: string;
  readonly responseFactoryMethodName: string;
}
