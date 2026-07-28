export class TemplateDefinitionModuleMismatchError extends Error {
  public readonly code = "TEMPLATE007";

  public constructor(
    public readonly templateId: string,
    public readonly definitionModuleId: string,
    public readonly producerModuleId: string,
  ) {
    super(
      `Template definition '${templateId}' belongs to module ` +
      `'${definitionModuleId}', not '${producerModuleId}'.`,
    );

    this.name = "TemplateDefinitionModuleMismatchError";
  }
}
