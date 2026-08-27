export interface TemplateDefinition {
  readonly id: string;
  readonly module: string;
  readonly template: string;
  readonly output: string;
}

export interface TemplatePackReference {
  readonly id: string;
  readonly version: string;
}

export interface TemplatePack {
  readonly id: string;
  readonly version: string;
  /**
   * A pack this one borrows template files from.
   *
   * Only file lookup is inherited, never template definitions: a derived pack
   * still declares every artifact it emits, with its own output paths. That is
   * the point — two layouts of the same artifacts should share the artifacts and
   * differ in where they land, rather than duplicating a hundred templates that
   * would then drift apart.
   */
  readonly extends?: TemplatePackReference;
  readonly templates: readonly TemplateDefinition[];
}
