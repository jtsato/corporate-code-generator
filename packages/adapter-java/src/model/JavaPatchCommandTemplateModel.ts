export interface JavaPatchCommandField {
  readonly name: string;
  readonly type: string;
  readonly requiredMessageKey?: string;
  readonly requiredDefaultMessage?: string;
}

export interface JavaPatchCommandTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly fields: readonly JavaPatchCommandField[];
  readonly valueFields: readonly JavaPatchCommandField[];
  readonly identifierFieldName: string;
  readonly atLeastOneFieldMessageKey: string;
  readonly atLeastOneFieldDefaultMessage: string;
}
