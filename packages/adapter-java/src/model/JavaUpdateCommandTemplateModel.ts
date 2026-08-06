export interface JavaUpdateCommandField {
  readonly name: string;
  readonly type: string;
  readonly requiredMessageKey?: string;
  readonly requiredDefaultMessage?: string;
}

export interface JavaUpdateCommandTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly fields: readonly JavaUpdateCommandField[];
}
