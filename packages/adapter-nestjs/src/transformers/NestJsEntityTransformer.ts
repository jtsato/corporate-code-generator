import type { ApplicationModel, Entity } from "@corporate-code-generator/core";

import type {
  NestJsApplicationTemplateModel,
  NestJsEntityTemplateModel,
  NestJsPropertyTemplateModel,
  NestJsUniqueAttributeModel,
  NestJsUniqueGroupCheckModel,
} from "../model/NestJsEntityTemplateModel.js";
import {
  toKebabCaseName,
  toPluralKebabCaseName,
  toRestCollectionPath,
  toTypeScriptPropertyName,
  toTypeScriptTypeName,
} from "../naming/TypeScriptNames.js";
import { TypeScriptTypeResolver } from "../types/TypeScriptTypeResolver.js";

function quoted(value: string): string {
  return JSON.stringify(value);
}

function pathValueExpression(type: Entity["attributes"][number]["type"]): string {
  switch (type) {
    case "int32":
    case "int64":
    case "decimal":
      return "Number(id)";
    case "date":
    case "datetime":
      return "new Date(id)";
    case "boolean":
      return '(id === "true" ? true : id === "false" ? false : id as never)';
    case "string":
    case "uuid":
      return "id";
  }
}

function testValue(type: Entity["attributes"][number]["type"]): string {
  switch (type) {
    case "string":
      return quoted("sample");
    case "uuid":
      return quoted("00000000-0000-4000-8000-000000000001");
    case "boolean":
      return "true";
    case "int32":
    case "int64":
      return "1";
    case "decimal":
      return "1.5";
    case "date":
    case "datetime":
      return 'new Date("2025-01-01T00:00:00.000Z")';
  }
}

function alternateTestValue(type: Entity["attributes"][number]["type"]): string {
  switch (type) {
    case "string":
      return quoted("updated");
    case "uuid":
      return quoted("00000000-0000-4000-8000-000000000002");
    case "boolean":
      return "false";
    case "int32":
    case "int64":
      return "2";
    case "decimal":
      return "2.5";
    case "date":
    case "datetime":
      return 'new Date("2025-01-02T00:00:00.000Z")';
  }
}

function invalidTestValue(type: Entity["attributes"][number]["type"]): string {
  switch (type) {
    case "string":
    case "uuid":
      return "123 as never";
    case "boolean":
      return "0 as never";
    case "int32":
    case "int64":
    case "decimal":
      return "Number.NaN";
    case "date":
    case "datetime":
      return 'new Date("invalid")';
  }
}

function createCoreValidationStatements(
  attributeName: string,
  type: Entity["attributes"][number]["type"],
  required: boolean,
): readonly string[] {
  const field = quoted(attributeName);
  const valuePresent = "value !== undefined && value !== null";
  const statements: string[] = [];

  if (required) {
    const emptyString = type === "string" || type === "uuid"
      ? ' || (typeof value === "string" && value.trim() === "")'
      : "";
    statements.push(
      `if (value === undefined || value === null${emptyString}) violations.push(new FieldViolation(${field}, ${quoted(`${attributeName} is required`)}));`,
    );
  }

  const typeCheck = (() => {
    switch (type) {
      case "string":
        return `typeof value !== "string"`;
      case "boolean":
        return `typeof value !== "boolean"`;
      case "int32":
      case "int64":
        return `typeof value !== "number" || !Number.isSafeInteger(value)`;
      case "decimal":
        return `typeof value !== "number" || !Number.isFinite(value)`;
      case "uuid":
        return `typeof value !== "string" || !UUID_PATTERN.test(value)`;
      case "date":
      case "datetime":
        return `!(value instanceof Date) || Number.isNaN(value.getTime())`;
    }
  })();

  statements.push(
    `if (${valuePresent} && (${typeCheck})) violations.push(new FieldViolation(${field}, ${quoted(`${attributeName} has an invalid value`)}));`,
  );

  return statements;
}

export class NestJsEntityTransformer {
  public constructor(
    private readonly typeResolver: TypeScriptTypeResolver = new TypeScriptTypeResolver(),
  ) {}

  public transform(entity: Entity): NestJsEntityTemplateModel {
    const properties = entity.attributes.map((attribute) => {
      const resolved = this.typeResolver.resolve(attribute.type);

      return {
        name: toTypeScriptPropertyName(attribute.name),
        type: resolved.name,
        required: attribute.required,
        identifier: attribute.identifier,
        unique: attribute.unique ?? false,
        validationDecorator: resolved.validationDecorator,
        swaggerType: resolved.swaggerType,
        coreValidationStatements: createCoreValidationStatements(
          toTypeScriptPropertyName(attribute.name),
          attribute.type,
          attribute.required,
        ),
        testValue: testValue(attribute.type),
        alternateTestValue: alternateTestValue(attribute.type),
        invalidTestValue: invalidTestValue(attribute.type),
      } satisfies NestJsPropertyTemplateModel;
    });

    const identifierAttribute = entity.attributes.find((attribute) => attribute.identifier);
    const identifier = properties.find((property) => property.identifier);

    if (identifier === undefined || identifierAttribute === undefined) {
      throw new Error(
        `NestJS generation requires an identifier attribute on entity '${entity.name}'.`,
      );
    }

    const preparedIdentifier = {
      ...identifier,
      pathValueExpression: pathValueExpression(identifierAttribute.type),
    };

    const mutableProperties = properties.filter((property) => !property.identifier);

    const uniqueAttributes = properties
      .filter((property) => property.unique && !property.identifier)
      .map((property) => ({
        name: property.name,
        type: property.type,
      } satisfies NestJsUniqueAttributeModel));

    const propertiesByName = new Map(properties.map((property) => [property.name, property]));

    const uniqueGroupChecks = (entity.uniqueGroups ?? [])
      .map((group) => ({
        attributes: group
          .map((attributeName) => propertiesByName.get(toTypeScriptPropertyName(attributeName)))
          .filter((property): property is NestJsPropertyTemplateModel => property !== undefined)
          .map((property) => ({
            name: property.name,
            type: property.type,
          } satisfies NestJsUniqueAttributeModel)),
      } satisfies NestJsUniqueGroupCheckModel))
      .filter((group) => group.attributes.length > 0);

    const requestValidationImports = [
      ...new Set([
        ...properties.map((property) => property.validationDecorator),
        ...(properties.some((property) => property.required) ? ["IsNotEmpty"] : []),
      ]),
    ].sort();

    const updateRequestValidationImports = [
      ...new Set([
        ...mutableProperties.map((property) => property.validationDecorator),
        ...(mutableProperties.some((property) => property.required) ? ["IsNotEmpty"] : []),
      ]),
    ].sort();

    const patchRequestValidationImports = [
      ...new Set([
        ...mutableProperties.map((property) => property.validationDecorator),
        ...(mutableProperties.length > 0 ? ["IsOptional"] : []),
      ]),
    ].sort();

    return {
      className: toTypeScriptTypeName(entity.name),
      propertyName: toTypeScriptPropertyName(entity.name),
      fileName: toKebabCaseName(entity.name),
      pluralFileName: toPluralKebabCaseName(entity.name),
      restCollectionPath: toRestCollectionPath(entity.name),
      properties,
      mutableProperties,
      uniqueAttributes,
      uniqueGroupChecks,
      hasUniqueAttributes: uniqueAttributes.length > 0 || uniqueGroupChecks.length > 0,
      identifier: preparedIdentifier,
      requestValidationImports,
      updateRequestValidationImports,
      patchRequestValidationImports,
    };
  }

  public transformApplication(
    application: ApplicationModel,
  ): NestJsApplicationTemplateModel {
    return {
      applicationName: application.name,
      entities: application.entities.map((entity) => this.transform(entity)),
    };
  }
}
