export interface JavaRestoreCommandTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly fields: readonly {
    readonly name: string;
    readonly type: string;
    readonly requiredMessageKey: string;
    readonly requiredDefaultMessage: string;
  }[];
}
