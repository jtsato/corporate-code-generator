export interface NestJsPropertyTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly identifier: boolean;
  readonly unique: boolean;
  readonly validationDecorator: string;
  readonly swaggerType: string;
  readonly coreValidationStatements: readonly string[];
  readonly testValue: string;
  readonly alternateTestValue: string;
  readonly invalidTestValue: string;
  /** Relational column name; see `toSnakeCaseName`. */
  readonly columnName: string;
  /** Rendered `@Column`/`@PrimaryColumn` argument, always an object literal. */
  readonly columnDecoratorArguments: string;
}

export interface NestJsUniqueAttributeModel {
  readonly name: string;
  readonly type: string;
  readonly testValue: string;
  readonly alternateTestValue: string;
}

export interface NestJsUniqueGroupCheckModel {
  readonly attributes: readonly NestJsUniqueAttributeModel[];
}

export interface NestJsIdentifierTemplateModel extends NestJsPropertyTemplateModel {
  readonly pathValueExpression: string;
}

export interface NestJsEntityTemplateModel {
  readonly className: string;
  readonly propertyName: string;
  readonly fileName: string;
  readonly pluralFileName: string;
  readonly restCollectionPath: string;
  readonly properties: readonly NestJsPropertyTemplateModel[];
  readonly mutableProperties: readonly NestJsPropertyTemplateModel[];
  readonly uniqueAttributes: readonly NestJsUniqueAttributeModel[];
  readonly uniqueGroupChecks: readonly NestJsUniqueGroupCheckModel[];
  readonly hasUniqueAttributes: boolean;
  readonly identifier: NestJsIdentifierTemplateModel;
  readonly requestValidationImports: readonly string[];
  readonly updateRequestValidationImports: readonly string[];
  readonly patchRequestValidationImports: readonly string[];
  /** Relational table name; plural, snake_case. */
  readonly tableName: string;
  /** Opt-in `createdAt`/`updatedAt` tracking, declared per entity in the model. */
  readonly audited: boolean;
  /** True when at least one column needs the string-to-number transformer. */
  readonly usesNumericTransformer: boolean;
}

export interface NestJsApplicationTemplateModel {
  readonly applicationName: string;
  readonly entities: readonly NestJsEntityTemplateModel[];
  /**
   * True when at least one entity is audited. The clock port and its module are
   * emitted once per application rather than once per entity, so they are gated
   * on this rather than on any single entity's flag.
   */
  readonly hasAuditedEntities: boolean;
}
