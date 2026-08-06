export interface JavaPatchRestRequestComponentModel {
  readonly name: string;
  readonly type: string;
  readonly accessorName: string;
  readonly setterName: string;
}

export interface JavaPatchRestRequestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly components: readonly JavaPatchRestRequestComponentModel[];
  readonly identifierType: string;
  readonly identifierParameterName: string;
  readonly commandType: string;
  readonly commandPackageName: string;
  readonly commandArguments: readonly string[];
}
