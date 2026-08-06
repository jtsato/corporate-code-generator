import type { JavaRecordComponentModel } from "./JavaRestResponseTemplateModel.js";

export interface JavaCreateRestRequestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly recordName: string;
  readonly components: readonly JavaRecordComponentModel[];
  readonly commandType: string;
  readonly commandPackageName: string;
  readonly commandArguments: readonly string[];
}
