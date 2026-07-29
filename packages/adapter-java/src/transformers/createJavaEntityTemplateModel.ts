import type { Entity } from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";
import type { JavaFieldModel } from "../model/JavaFieldModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaEntityTemplateModel(
  entity: Entity,
  packageName: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
): JavaEntityTemplateModel {
  const imports = new JavaImportCollector();
  const fields: JavaFieldModel[] = entity.attributes.map((attribute) => {
    const javaType = typeResolver.resolve(attribute.type);
    imports.add(javaType.import);
    return { name: attribute.name, type: javaType.name, modifiers: ["private", "final"] };
  });
  const constructorParameters = fields.map((field) => ({ name: field.name, type: field.type }));
  const getters = fields.map((field) => ({
    name: `get${field.name[0]?.toUpperCase() ?? ""}${field.name.slice(1)}`,
    returnType: field.type,
    fieldName: field.name,
  }));

  return {
    packageName,
    imports: imports.values(),
    className: entity.name,
    modifiers: ["public"],
    fields,
    constructorParameters,
    getters,
  };
}
