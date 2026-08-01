import type { Entity } from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";
import type { JavaFieldModel } from "../model/JavaFieldModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

export function createJavaEntityTemplateModel(
  entity: Entity,
  packageName: string,
  typeResolver: JavaTypeResolver = new JavaTypeResolver(),
  selfValidationEnabled = false,
): JavaEntityTemplateModel {
  const imports = new JavaImportCollector();
  const validationEnabled = selfValidationEnabled && entity.attributes.some((attribute) => attribute.required);
  if (validationEnabled) {
    imports.add("jakarta.validation.constraints.NotNull");
    imports.add(packageName.replace(/\.domains?(?:\..*)?$/, ".common.validation.SelfValidating"));
  }
  const fields: JavaFieldModel[] = entity.attributes.map((attribute) => {
    const javaType = typeResolver.resolve(attribute.type);
    imports.add(javaType.import);
    return attribute.required ? { name: attribute.name, type: javaType.name, modifiers: ["private", "final"], validationAnnotation: "@NotNull" } : { name: attribute.name, type: javaType.name, modifiers: ["private", "final"] };
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
    ...(validationEnabled ? { extendsType: `SelfValidating<${entity.name}>`, validateSelf: true } : {}),
  };
}
