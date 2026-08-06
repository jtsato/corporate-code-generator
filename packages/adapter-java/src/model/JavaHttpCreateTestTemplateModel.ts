export interface JavaHttpCreateFixtureModel {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly jsonName: string;
  readonly accessorName: string;
  readonly jsonLiteral: string;
}

export interface JavaHttpCreateTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly endpointPath: string;
  readonly findByIdEndpointPath: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly identifierType: string;
  readonly identifierConstantName: string;
  readonly entityConstructorArguments: readonly string[];
  readonly validPayloadExpression: string;
  readonly duplicatePayloadExpression: string;
  readonly nullIdentifierPayloadExpression: string;
  readonly nullValuePayloadExpression: string;
  readonly invalidIdentifierPayloadExpression: string;
  readonly invalidJsonPayloadExpression: string;
  readonly conflictDefaultMessage: string;
  readonly fixtures: readonly JavaHttpCreateFixtureModel[];
}
