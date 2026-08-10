export interface JavaProjectDeveloperScriptTaskTemplateModel {
  readonly name: string;
  readonly description: string;
  readonly mavenArguments: string;
}

export interface JavaProjectDeveloperScriptTemplateModel {
  readonly applicationName: string;
  readonly defaultTaskName: string;
  readonly tasks: readonly JavaProjectDeveloperScriptTaskTemplateModel[];
}

export interface JavaProjectSmokeRequestFieldTemplateModel {
  readonly name: string;
  readonly jsonLiteral: string;
}

export interface JavaProjectSmokeRequestResourceTemplateModel {
  readonly entityName: string;
  readonly collectionPath: string;
  readonly identifierValue: string;
  readonly createFields: readonly JavaProjectSmokeRequestFieldTemplateModel[];
  readonly replaceFields: readonly JavaProjectSmokeRequestFieldTemplateModel[];
  readonly patchFields: readonly JavaProjectSmokeRequestFieldTemplateModel[];
}

export interface JavaProjectSmokeRequestsTemplateModel {
  readonly applicationName: string;
  readonly baseUrlVariableName: string;
  readonly baseUrl: string;
  readonly healthPath: string;
  readonly openApiPath: string;
  readonly resources: readonly JavaProjectSmokeRequestResourceTemplateModel[];
}
