import type { JavaGetterTemplateModel, JavaParameterModel } from "./JavaEntityTemplateModel.js";

export interface JavaPersistenceFieldTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly columnName: string;
  readonly nullable: boolean;
  readonly identifier: boolean;
}

export interface JavaPersistenceEntityTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly tableName: string;
  readonly fields: readonly JavaPersistenceFieldTemplateModel[];
  readonly constructorParameters: readonly JavaParameterModel[];
  readonly getters: readonly JavaGetterTemplateModel[];
}
