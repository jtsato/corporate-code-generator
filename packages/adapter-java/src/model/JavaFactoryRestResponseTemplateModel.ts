import type { JavaRecordComponentModel } from "./JavaRestResponseTemplateModel.js";

export interface JavaFactoryRestResponseTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly recordName: string;
  readonly components: readonly JavaRecordComponentModel[];
  readonly factoryMethodName: string;
  readonly factoryParameterType: string;
  readonly factoryParameterName: string;
  readonly factoryArguments: readonly string[];
}
