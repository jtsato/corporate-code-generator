import type { TemplateDefinition, TemplatePack } from "./TemplatePack.js";
export class TemplateDefinitionNotFoundError extends Error {
  public readonly code = "TEMPLATE006";

  public constructor(templateId: string) {
    super(`Template definition '${templateId}' was not found.`);
    this.name = "TemplateDefinitionNotFoundError";
  }
}

export function findTemplateDefinition(
  pack: TemplatePack,
  templateId: string,
): TemplateDefinition {
  const definition = pack.templates.find((template) => template.id === templateId);

  if (definition === undefined) {
    throw new TemplateDefinitionNotFoundError(templateId);
  }

  return definition;
}
