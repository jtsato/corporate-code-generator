export interface JavaHttpUpdateTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly jsonLiteral: string;
  readonly jsonName: string;
  readonly accessorName: string;
  readonly updatedConstantName: string | undefined;
}

export interface JavaHttpUpdateTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly activeProfile: string;
  readonly endpointPath: string;
  readonly entityType: string;
  readonly persistenceEntityType: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly identifierConstantName: string;
  readonly missingIdentifierExpression: string;
  readonly entityConstructorArguments: readonly string[];
  readonly validUpdatePayloadExpression: string;
  readonly missingValuePayloadExpression: string;
  readonly invalidJsonPayloadExpression: string;
  readonly fixtures: readonly JavaHttpUpdateTestFixture[];
  readonly updatedFixtures: readonly JavaHttpUpdateTestFixture[];
}
