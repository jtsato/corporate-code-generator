export interface NestJsPropertyTemplateModel {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly identifier: boolean;
  readonly validationDecorator: string;
  readonly swaggerType: string;
}

export interface NestJsEntityTemplateModel {
  readonly className: string;
  readonly propertyName: string;
  readonly fileName: string;
  readonly pluralFileName: string;
  readonly restCollectionPath: string;
  readonly properties: readonly NestJsPropertyTemplateModel[];
  readonly identifier: NestJsPropertyTemplateModel;
  readonly requestValidationImports: readonly string[];
}

export interface NestJsApplicationTemplateModel {
  readonly applicationName: string;
  readonly entities: readonly NestJsEntityTemplateModel[];
}
