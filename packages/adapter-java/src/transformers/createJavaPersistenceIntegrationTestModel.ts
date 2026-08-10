import type { Entity } from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaPersistenceIntegrationTestTemplateModel } from "../model/JavaPersistenceIntegrationTestTemplateModel.js";
import { createJavaPersistenceProviderTestModel } from "./createJavaPersistenceProviderTestModel.js";

// The slice test seeds through SQL and asserts a conflict path that this test
// deliberately leaves out, so its imports for those two concerns are dropped
// rather than carried into a file that would not compile with unused warnings
// turned into noise.
const sliceOnlyImportSuffixes = [
  "org.springframework.test.context.jdbc.Sql",
  ".ConflictException",
];

export function createJavaPersistenceIntegrationTestModel(
  entity: Entity,
  namespace: string,
  containerImage: string,
  profileId: string,
): JavaPersistenceIntegrationTestTemplateModel {
  const sliceModel = createJavaPersistenceProviderTestModel(entity, namespace);
  const unknownIdentifier = sliceModel.seededFields.find(
    (field) => field.constantName === sliceModel.identifierConstantName,
  );
  if (unknownIdentifier === undefined) {
    throw new Error(
      `Cannot generate the persistence integration test for entity '${entity.name}': the seeded identifier constant was not found.`,
    );
  }

  const imports = new JavaImportCollector();
  for (const candidate of sliceModel.imports) {
    if (sliceOnlyImportSuffixes.some((suffix) => candidate.endsWith(suffix))) continue;
    imports.add(candidate);
  }
  imports.add("org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase");
  imports.add("org.springframework.test.context.DynamicPropertyRegistry");
  imports.add("org.springframework.test.context.DynamicPropertySource");
  imports.add("org.testcontainers.junit.jupiter.Container");
  imports.add("org.testcontainers.junit.jupiter.Testcontainers");
  imports.add("org.testcontainers.postgresql.PostgreSQLContainer");

  return {
    packageName: sliceModel.packageName,
    imports: imports.values(),
    className: `${sliceModel.providerType}IT`,
    containerImage,
    profileId,
    providerType: sliceModel.providerType,
    providerFieldName: sliceModel.providerFieldName,
    repositoryType: sliceModel.repositoryType,
    repositoryFieldName: sliceModel.repositoryFieldName,
    entityType: sliceModel.entityType,
    tombstoneType: `${sliceModel.entityType}Tombstone`,
    domainVariableName: sliceModel.domainVariableName,
    createdFields: sliceModel.createdFields,
    createdConstructorArguments: sliceModel.createdConstructorArguments,
    createdIdentifierConstantName: sliceModel.createdIdentifierConstantName,
    // Nothing in this test creates the slice test's seeded identifier, so it is
    // the one value guaranteed to be absent from the container database.
    unknownIdentifierField: unknownIdentifier,
  };
}
