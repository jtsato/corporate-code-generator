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
