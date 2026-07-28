export interface JavaRecordComponentModel {
  readonly name: string;
  readonly type: string;
}

export interface JavaRestResponseTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly recordName: string;
  readonly components: readonly JavaRecordComponentModel[];
}
