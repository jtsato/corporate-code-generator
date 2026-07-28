export interface TemplateDefinition {
  readonly id: string;
  readonly module: string;
  readonly template: string;
  readonly output: string;
}

export interface TemplatePack {
  readonly id: string;
  readonly version: string;
  readonly templates: readonly TemplateDefinition[];
}
