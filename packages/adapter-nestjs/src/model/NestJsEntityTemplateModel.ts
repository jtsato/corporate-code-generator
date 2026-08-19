export interface NestJsPropertyTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly identifier: boolean;
  readonly validationDecorator: string;
  readonly swaggerType: string;
  readonly coreValidationStatements: readonly string[];
  readonly testValue: string;
  readonly alternateTestValue: string;
  readonly invalidTestValue: string;
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
  readonly identifier: NestJsIdentifierTemplateModel;
  readonly requestValidationImports: readonly string[];
  readonly updateRequestValidationImports: readonly string[];
  readonly patchRequestValidationImports: readonly string[];
}

export interface NestJsApplicationTemplateModel {
  readonly applicationName: string;
  readonly entities: readonly NestJsEntityTemplateModel[];
}
