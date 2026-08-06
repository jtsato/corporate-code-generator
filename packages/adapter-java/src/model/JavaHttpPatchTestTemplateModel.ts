export interface JavaHttpPatchTestFixture {
  readonly constantName: string;
  readonly type: string;
  readonly javaExpression: string;
  readonly jsonLiteral: string;
  readonly jsonName: string;
  readonly accessorName: string;
  readonly updatedConstantName: string | undefined;
}

export interface JavaHttpPatchTestTemplateModel {
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
  readonly validPatchPayloadExpression: string;
  readonly emptyPatchPayloadExpression: string;
  readonly requiredNullPayloadExpression: string;
  readonly hasRequiredNullScenario: boolean;
  readonly optionalNullPayloadExpression: string;
  readonly hasOptionalNullScenario: boolean;
  readonly omittedPayloadExpression: string;
  readonly omittedFieldName: string;
  readonly omittedAccessorName: string;
  readonly omittedExpectedConstantName: string;
  readonly hasOmittedFieldScenario: boolean;
  readonly invalidJsonPayloadExpression: string;
  readonly fixtures: readonly JavaHttpPatchTestFixture[];
  readonly updatedFixtures: readonly JavaHttpPatchTestFixture[];
}
