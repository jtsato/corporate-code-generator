import type { JavaRecordComponentModel } from "./JavaRestResponseTemplateModel.js";

export interface JavaUpdateRestRequestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly recordName: string;
  readonly components: readonly JavaRecordComponentModel[];
  readonly identifierType: string;
  readonly identifierParameterName: string;
  readonly commandType: string;
  readonly commandPackageName: string;
  readonly commandArguments: readonly string[];
}
