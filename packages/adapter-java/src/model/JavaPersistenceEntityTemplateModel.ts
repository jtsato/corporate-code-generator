import type { JavaGetterTemplateModel, JavaParameterModel } from "./JavaEntityTemplateModel.js";

export interface JavaPersistenceFieldTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly columnName: string;
  readonly nullable: boolean;
  readonly identifier: boolean;
  readonly unique?: boolean;
}

export interface JavaPersistenceUniqueConstraintTemplateModel {
  readonly name: string;
  readonly columnNames: readonly string[];
}

export interface JavaPersistenceEntityTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly tableName: string;
  readonly fields: readonly JavaPersistenceFieldTemplateModel[];
  readonly constructorParameters: readonly JavaParameterModel[];
  readonly getters: readonly JavaGetterTemplateModel[];
  readonly deletionTimestampFieldName: string;
  readonly deletionTimestampColumnName: string;
  readonly deletionScopeFieldName: string;
  readonly deletionScopeColumnName: string;
  readonly activeScopeConstantName: string;
  readonly activeScopeValue: string;
  readonly markDeletedMethodName: string;
  readonly isActiveMethodName: string;
  readonly uniqueConstraints: readonly JavaPersistenceUniqueConstraintTemplateModel[];
}
