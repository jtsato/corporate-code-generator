import type { ApplicationModel } from "@corporate-code-generator/core";
import { JavaTestFixtureValueResolver } from "../fixtures/JavaTestFixtureValueResolver.js";
import type {
  JavaProjectSmokeRequestFieldTemplateModel,
  JavaProjectSmokeRequestResourceTemplateModel,
  JavaProjectSmokeRequestsTemplateModel,
} from "../model/JavaProjectDeveloperScriptTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";

export function createJavaProjectSmokeRequestsModel(
  application: ApplicationModel,
  baseUrl: string,
  healthPath: string,
  openApiPath: string,
  fixtureResolver: JavaTestFixtureValueResolver = new JavaTestFixtureValueResolver(),
): JavaProjectSmokeRequestsTemplateModel {
  const resources = application.entities.map((entity): JavaProjectSmokeRequestResourceTemplateModel => {
    const identifier = entity.attributes.find((attribute) => attribute.identifier);
    if (identifier === undefined) {
      throw new Error(`Cannot generate smoke requests for entity '${entity.name}' without an identifier.`);
    }

    // One occurrence index per request shape, so the created and replaced
    // bodies differ from each other and a reader can tell which call produced
    // which record. These are illustrative values, not the test fixtures.
    const fieldsAt = (occurrenceIndex: number): readonly JavaProjectSmokeRequestFieldTemplateModel[] =>
      entity.attributes.map((attribute) => ({
        name: attribute.name,
        jsonLiteral: fixtureResolver.resolve(attribute.type, occurrenceIndex).jsonLiteral,
      }));

    const createFields = fieldsAt(1);
    const identifierField = createFields.find((field) => field.name === identifier.name);
    if (identifierField === undefined) {
      throw new Error(`Cannot resolve the identifier value for entity '${entity.name}'.`);
    }

    return {
      entityName: toJavaTypeName(entity.name),
      collectionPath: toRestCollectionPath(entity.name),
      // The identifier travels in the URL, so it is emitted unquoted.
      identifierValue: identifierField.jsonLiteral.replaceAll('"', ""),
      createFields,
      replaceFields: fieldsAt(2),
      // PATCH is partial by contract, so only the non-identifier attributes are
      // sent; sending the identifier would defeat the point of the example.
      patchFields: fieldsAt(2).filter((field) => field.name !== identifier.name),
    };
  });

  return {
    applicationName: application.name,
    baseUrlVariableName: "baseUrl",
    baseUrl,
    healthPath,
    openApiPath,
    resources,
  };
}
