import type { JavaPersistenceProviderTestFieldTemplateModel } from "./JavaPersistenceProviderTestTemplateModel.js";

export interface JavaPersistenceIntegrationTestTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly containerImage: string;
  readonly profileId: string;
  readonly providerType: string;
  readonly providerFieldName: string;
  readonly repositoryType: string;
  readonly repositoryFieldName: string;
  readonly entityType: string;
  readonly tombstoneType: string;
  readonly domainVariableName: string;
  readonly createdFields: readonly JavaPersistenceProviderTestFieldTemplateModel[];
  readonly createdConstructorArguments: readonly string[];
  readonly createdIdentifierConstantName: string;
  readonly unknownIdentifierField: JavaPersistenceProviderTestFieldTemplateModel;
}
