import type { JavaFieldModel } from "./JavaFieldModel.js";

export interface JavaParameterModel {
  readonly name: string;
  readonly type: string;
}

export interface JavaGetterTemplateModel {
  readonly name: string;
  readonly returnType: string;
  readonly fieldName: string;
}

export interface JavaEntityTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly modifiers: readonly string[];
  readonly fields: readonly JavaFieldModel[];
  readonly constructorParameters: readonly JavaParameterModel[];
  readonly getters: readonly JavaGetterTemplateModel[];
  readonly extendsType?: string;
  readonly validateSelf?: boolean;
}
