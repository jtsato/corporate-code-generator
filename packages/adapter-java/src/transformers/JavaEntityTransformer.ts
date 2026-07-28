import type {
  ApplicationModel,
  Entity,
} from "@corporate-code-generator/core";

import {
  JavaImportCollector,
} from "../model/JavaImportCollector.js";

import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";

import type {
  JavaFieldModel,
} from "../model/JavaFieldModel.js";

import {
  JavaTypeResolver,
} from "../types/JavaTypeResolver.js";

export class JavaEntityTransformer {
  public constructor(
    private readonly typeResolver:
      JavaTypeResolver = new JavaTypeResolver(),
  ) {}

  public transform(
    application: ApplicationModel,
    entity: Entity,
  ): JavaEntityTemplateModel {
    const imports =
      new JavaImportCollector();

    const fields: JavaFieldModel[] =
      entity.attributes.map((attribute) => {
        const javaType =
          this.typeResolver.resolve(attribute.type);

        imports.add(javaType.import);

        return {
          name: attribute.name,
          type: javaType.name,
          modifiers: ["private", "final"],
        };
      });

    const constructorParameters = fields.map((field) => ({
      name: field.name,
      type: field.type,
    }));

    const getters = fields.map((field) => ({
      name: `get${field.name[0]?.toUpperCase() ?? ""}${field.name.slice(1)}`,
      returnType: field.type,
      fieldName: field.name,
    }));

    return {
      packageName: this.resolvePackageName(
        application,
      ),
      imports: imports.values(),
      className: entity.name,
      modifiers: [
        "public",
      ],
      fields,
      constructorParameters,
      getters,
    };
  }

  private resolvePackageName(
    application: ApplicationModel,
  ): string {
    if (application.namespace === undefined) {
      throw new Error(
        "Java generation requires an application namespace.",
      );
    }

    return `${application.namespace}.domain`;
  }
}
