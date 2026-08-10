export interface JavaRestControllerTestUseCaseTemplateModel {
  readonly type: string;
  readonly fieldName: string;
}

export interface JavaRestControllerTestFieldTemplateModel {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly jsonName: string;
  readonly jsonLiteral: string;
}

export interface JavaRestControllerTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly controllerType: string;
  readonly entityType: string;
  readonly entityVariableName: string;
  readonly tombstoneType: string;
  readonly responseType: string;
  readonly tombstoneResponseType: string;
  readonly collectionPath: string;
  readonly identifierJsonName: string;
  readonly identifierConstantName: string;
  readonly useCases: readonly JavaRestControllerTestUseCaseTemplateModel[];
  readonly fields: readonly JavaRestControllerTestFieldTemplateModel[];
  readonly entityConstructorArguments: readonly string[];
  readonly tombstoneConstructorArguments: readonly string[];
  readonly createCommandArguments: readonly string[];
  readonly updateCommandArguments: readonly string[];
  readonly patchCommandArguments: readonly string[];
  readonly createRequestBody: string;
  readonly updateRequestBody: string;
  readonly patchRequestBody: string;
}
