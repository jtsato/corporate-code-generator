import type { ApplicationModel, Entity } from "@corporate-code-generator/core";

import type {
  NestJsApplicationTemplateModel,
  NestJsEntityTemplateModel,
  NestJsPropertyTemplateModel,
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

function testValue(type: Entity["attributes"][number]["type"]): string {
  switch (type) {
    case "string":
      return quoted("sample");
    case "uuid":
      return quoted("00000000-0000-0000-0000-000000000001");
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
        validationDecorator: resolved.validationDecorator,
        swaggerType: resolved.swaggerType,
        coreValidationStatements: createCoreValidationStatements(
          toTypeScriptPropertyName(attribute.name),
          attribute.type,
          attribute.required,
        ),
        testValue: testValue(attribute.type),
        invalidTestValue: invalidTestValue(attribute.type),
      } satisfies NestJsPropertyTemplateModel;
    });

    const identifier = properties.find((property) => property.identifier);

    if (identifier === undefined) {
      throw new Error(
        `NestJS generation requires an identifier attribute on entity '${entity.name}'.`,
      );
    }

    const requestValidationImports = [
      ...new Set([
        ...properties.map((property) => property.validationDecorator),
        ...(properties.some((property) => property.required) ? ["IsNotEmpty"] : []),
      ]),
    ].sort();

    return {
      className: toTypeScriptTypeName(entity.name),
      propertyName: toTypeScriptPropertyName(entity.name),
      fileName: toKebabCaseName(entity.name),
      pluralFileName: toPluralKebabCaseName(entity.name),
      restCollectionPath: toRestCollectionPath(entity.name),
      properties,
      identifier,
      requestValidationImports,
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
